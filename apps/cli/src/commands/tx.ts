import { Command } from 'commander';
import ora from 'ora';
import { isAddress, isHex, formatEther, parseEther, toHex } from 'viem';
import type { Address, Hex } from 'viem';
import type { AppContext } from '../context';
import type { ElytroUserOperation, AccountInfo, ChainConfig } from '../types';
import { requestSponsorship, applySponsorToUserOp } from '../utils/sponsor';
import { askConfirm } from '../utils/prompt';
import * as display from '../utils/display';
import { sanitizeErrorMessage } from '../utils/display';

// ─── Error Codes (JSON-RPC / MCP convention) ──────────────────────────
//
//   -32602  Invalid params (bad --tx spec, missing required fields)
//   -32001  Insufficient balance
//   -32002  Account not ready (not initialized, not deployed, not found)
//   -32003  Sponsorship failed
//   -32004  Build / estimation failed
//   -32005  Sign / send failed
//   -32006  Execution reverted (UserOp included but reverted on-chain)
//   -32000  Unknown / internal error

const ERR_INVALID_PARAMS = -32602;
const ERR_INSUFFICIENT_BALANCE = -32001;
const ERR_ACCOUNT_NOT_READY = -32002;
const ERR_SPONSOR_FAILED = -32003;
const ERR_BUILD_FAILED = -32004;
const ERR_SEND_FAILED = -32005;
const ERR_EXECUTION_REVERTED = -32006;
const ERR_INTERNAL = -32000;

/**
 * Structured error for tx commands.
 * Carries a JSON-RPC-style error code and optional data context.
 */
class TxError extends Error {
  code: number;
  data?: Record<string, unknown>;

  constructor(code: number, message: string, data?: Record<string, unknown>) {
    super(message);
    this.name = 'TxError';
    this.code = code;
    this.data = data;
  }
}

/**
 * Unified error handler for all tx subcommands.
 * Outputs structured JSON to stderr.
 */
function handleTxError(err: unknown): void {
  if (err instanceof TxError) {
    display.txError({ code: err.code, message: sanitizeErrorMessage(err.message), data: err.data });
  } else {
    display.txError({
      code: ERR_INTERNAL,
      message: sanitizeErrorMessage((err as Error).message ?? String(err)),
    });
  }
  process.exitCode = 1;
}

// ─── Types ────────────────────────────────────────────────────────────

/**
 * A single transaction parsed from --tx flag.
 * Mirrors eth_sendTransaction params (minus from/nonce/gas which are handled by the pipeline).
 */
interface TxSpec {
  to: Address;
  value?: string; // human-readable ETH amount (e.g. "0.1")
  data?: Hex; // calldata hex
}

/**
 * Transaction type detected from parsed tx specs.
 * - Single tx with only value → 'eth-transfer'
 * - Single tx with data → 'contract-call'
 * - Multiple txs → 'batch'
 */
type TxType = 'eth-transfer' | 'contract-call' | 'batch';

// ─── --tx Parser & Validator ──────────────────────────────────────────

/**
 * Parse a --tx spec string into a TxSpec object.
 *
 * Format: "to:0xAddr,value:0.1,data:0xAbcDef"
 *   - `to` is required
 *   - `value` and `data` are optional, but at least one must be present
 *
 * @param spec  Raw string from CLI --tx flag
 * @param index 0-based position (for error messages)
 * @returns     Validated TxSpec
 */
function parseTxSpec(spec: string, index: number): TxSpec {
  const prefix = `--tx #${index + 1}`;
  const fields: Record<string, string> = {};

  for (const part of spec.split(',')) {
    const colonIdx = part.indexOf(':');
    if (colonIdx === -1) {
      throw new TxError(ERR_INVALID_PARAMS, `${prefix}: invalid segment "${part}". Expected key:value format.`, {
        spec,
        index,
      });
    }
    const key = part.slice(0, colonIdx).trim().toLowerCase();
    const val = part.slice(colonIdx + 1).trim();
    if (!key || !val) {
      throw new TxError(ERR_INVALID_PARAMS, `${prefix}: empty key or value in "${part}".`, { spec, index });
    }
    if (fields[key]) {
      throw new TxError(ERR_INVALID_PARAMS, `${prefix}: duplicate key "${key}".`, { spec, index, key });
    }
    fields[key] = val;
  }

  const knownKeys = new Set(['to', 'value', 'data']);
  for (const key of Object.keys(fields)) {
    if (!knownKeys.has(key)) {
      throw new TxError(ERR_INVALID_PARAMS, `${prefix}: unknown key "${key}". Allowed: to, value, data.`, {
        spec,
        index,
        key,
      });
    }
  }

  if (!fields.to) {
    throw new TxError(ERR_INVALID_PARAMS, `${prefix}: "to" is required.`, { spec, index });
  }
  if (!isAddress(fields.to)) {
    throw new TxError(ERR_INVALID_PARAMS, `${prefix}: invalid address "${fields.to}".`, { spec, index, to: fields.to });
  }

  if (!fields.value && !fields.data) {
    throw new TxError(ERR_INVALID_PARAMS, `${prefix}: at least one of "value" or "data" is required.`, { spec, index });
  }

  if (fields.value) {
    try {
      const wei = parseEther(fields.value);
      if (wei < 0n) throw new Error('negative');
    } catch {
      throw new TxError(
        ERR_INVALID_PARAMS,
        `${prefix}: invalid ETH amount "${fields.value}". Use human-readable format (e.g. "0.1").`,
        { spec, index, value: fields.value }
      );
    }
  }

  if (fields.data) {
    if (!isHex(fields.data)) {
      throw new TxError(ERR_INVALID_PARAMS, `${prefix}: invalid hex in "data". Must start with 0x.`, {
        spec,
        index,
        data: fields.data,
      });
    }
    if (fields.data.length > 2 && fields.data.length % 2 !== 0) {
      throw new TxError(ERR_INVALID_PARAMS, `${prefix}: "data" hex must have even length (complete bytes).`, {
        spec,
        index,
        data: fields.data,
      });
    }
  }

  return {
    to: fields.to as Address,
    value: fields.value,
    data: fields.data as Hex | undefined,
  };
}

function detectTxType(specs: TxSpec[]): TxType {
  if (specs.length > 1) return 'batch';
  const tx = specs[0];
  if (tx.data && tx.data !== '0x') return 'contract-call';
  return 'eth-transfer';
}

function specsToTxs(specs: TxSpec[]): Array<{ to: string; value?: string; data?: string }> {
  return specs.map((s) => ({
    to: s.to,
    value: s.value ? toHex(parseEther(s.value)) : '0x0',
    data: s.data ?? '0x',
  }));
}

function totalEthValue(specs: TxSpec[]): bigint {
  let sum = 0n;
  for (const s of specs) {
    if (s.value) sum += parseEther(s.value);
  }
  return sum;
}

// ─── Display Helpers ──────────────────────────────────────────────────

function txTypeLabel(txType: TxType): string {
  switch (txType) {
    case 'eth-transfer':
      return 'ETH Transfer';
    case 'contract-call':
      return 'Contract Call';
    case 'batch':
      return 'Batch Transaction';
  }
}

function truncateHex(hex: string, maxLen = 42): string {
  if (hex.length <= maxLen) return hex;
  return `${hex.slice(0, 20)}...${hex.slice(-8)} (${(hex.length - 2) / 2} bytes)`;
}

function displayTxSpec(spec: TxSpec, index: number): void {
  const parts: string[] = [`#${index + 1}`];
  parts.push(`→ ${spec.to}`);
  if (spec.value) parts.push(`${spec.value} ETH`);
  if (spec.data && spec.data !== '0x') {
    const selector = spec.data.length >= 10 ? spec.data.slice(0, 10) : spec.data;
    parts.push(`call ${selector}`);
  }
  display.info('Tx', parts.join('  '));
}

// ─── Command Registration ─────────────────────────────────────────────

/**
 * `elytro tx` — Build, simulate, and send UserOperations.
 *
 * All subcommands use --tx flag(s) to specify transactions.
 * Multiple --tx flags are ordered and packed into a single UserOp (executeBatch).
 *
 * Format: --tx "to:0xAddr,value:0.1,data:0xAbcDef"
 */
export function registerTxCommand(program: Command, ctx: AppContext): void {
  const tx = program.command('tx').description('Build, simulate, and send transactions');

  // ─── build ──────────────────────────────────────────────────────

  tx.command('build')
    .description('Build an unsigned UserOp from transaction parameters')
    .argument('[account]', 'Source account alias or address (default: current)')
    .option('--tx <spec...>', 'Transaction spec: "to:0xAddr,value:0.1,data:0x..." (repeatable, ordered)')
    .option('--no-sponsor', 'Skip sponsorship check')
    .action(async (target?: string, opts?: { tx?: string[]; sponsor?: boolean }) => {
      try {
        const specs = parseAllTxSpecs(opts?.tx);
        const { userOp, accountInfo, chainConfig, sponsored, txType } = await buildUserOp(
          ctx,
          target,
          specs,
          opts?.sponsor
        );

        display.heading('UserOperation (unsigned)');
        console.log(JSON.stringify(serializeUserOp(userOp), null, 2));
        console.log('');
        display.info('Account', accountInfo.alias);
        display.info('Chain', `${chainConfig.name} (${chainConfig.id})`);
        display.info('Type', txTypeLabel(txType));
        if (txType === 'batch') display.info('Tx Count', specs.length.toString());
        display.info('Sponsored', sponsored ? 'Yes' : 'No');
      } catch (err) {
        handleTxError(err);
      }
    });

  // ─── send ───────────────────────────────────────────────────────

  tx.command('send')
    .description('Send a transaction on-chain')
    .argument('[account]', 'Source account alias or address (default: current)')
    .option('--tx <spec...>', 'Transaction spec: "to:0xAddr,value:0.1,data:0x..." (repeatable, ordered)')
    .option('--no-sponsor', 'Skip sponsorship check')
    .option('--userop <json>', 'Send a pre-built UserOp JSON (skips build step)')
    .action(async (target?: string, opts?: { tx?: string[]; sponsor?: boolean; userop?: string }) => {
      if (!ctx.deviceKey) {
        handleTxError(new TxError(ERR_ACCOUNT_NOT_READY, 'Wallet not initialized. Run `elytro init` first.'));
        return;
      }

      try {
        let userOp: ElytroUserOperation;
        let accountInfo: AccountInfo;
        let chainConfig: ChainConfig;
        let sponsored: boolean;
        let txType: TxType = 'contract-call';
        let specs: TxSpec[] = [];

        if (opts?.userop) {
          userOp = deserializeUserOp(opts.userop);
          sponsored = !!userOp.paymaster;

          const identifier = target ?? ctx.account.currentAccount?.alias ?? ctx.account.currentAccount?.address;
          if (!identifier) {
            throw new TxError(ERR_ACCOUNT_NOT_READY, 'No account selected.', {
              hint: 'Specify an alias/address or create an account first.',
            });
          }
          accountInfo = resolveAccountStrict(ctx, identifier);
          chainConfig = resolveChainStrict(ctx, accountInfo.chainId);

          await ctx.sdk.initForChain(chainConfig);
          ctx.walletClient.initForChain(chainConfig);
        } else {
          specs = parseAllTxSpecs(opts?.tx);
          const result = await buildUserOp(ctx, target, specs, opts?.sponsor);
          userOp = result.userOp;
          accountInfo = result.accountInfo;
          chainConfig = result.chainConfig;
          sponsored = result.sponsored;
          txType = result.txType;
        }

        // ── Confirmation prompt ──
        console.log('');
        display.heading('Transaction Summary');
        display.info('Type', txTypeLabel(txType));
        display.info('From', `${accountInfo.alias} (${accountInfo.address})`);

        if (txType === 'batch') {
          display.info('Tx Count', specs.length.toString());
          for (let i = 0; i < specs.length; i++) {
            displayTxSpec(specs[i], i);
          }
        } else if (txType === 'contract-call') {
          const s = specs[0];
          display.info('To', s.to);
          display.info('Calldata', truncateHex(s.data ?? '0x'));
          if (s.data && s.data.length >= 10) {
            display.info('Selector', s.data.slice(0, 10));
          }
          if (s.value && s.value !== '0') {
            display.info('Value', `${s.value} ETH (payable)`);
          }
        } else {
          const s = specs[0];
          display.info('To', s.to);
          display.info('Value', `${s.value ?? '0'} ETH`);
        }

        display.info('Sponsored', sponsored ? 'Yes (gasless)' : 'No (user pays gas)');
        const estimatedGas = userOp.callGasLimit + userOp.verificationGasLimit + userOp.preVerificationGas;
        display.info('Est. Gas', estimatedGas.toString());
        console.log('');

        const confirmed = await askConfirm('Sign and send this transaction?');
        if (!confirmed) {
          display.warn('Transaction cancelled.');
          return;
        }

        // ── Sign + Send + Wait ──
        const spinner = ora('Signing UserOperation...').start();

        let opHash: string;
        try {
          const { packedHash, validationData } = await ctx.sdk.getUserOpHash(userOp);
          const rawSignature = await ctx.keyring.signDigest(packedHash);
          userOp.signature = await ctx.sdk.packUserOpSignature(rawSignature, validationData);

          spinner.text = 'Sending to bundler...';
          opHash = await ctx.sdk.sendUserOp(userOp);
        } catch (err) {
          spinner.fail('Send failed.');
          throw new TxError(ERR_SEND_FAILED, (err as Error).message, {
            sender: accountInfo.address,
            chain: chainConfig.name,
          });
        }

        spinner.text = 'Waiting for on-chain confirmation...';
        const receipt = await ctx.sdk.waitForReceipt(opHash, chainConfig);

        if (receipt.success) {
          spinner.succeed('Transaction confirmed!');
        } else {
          spinner.warn('Execution reverted.');
          // Output structured error for the revert, then continue to show receipt
          display.txError({
            code: ERR_EXECUTION_REVERTED,
            message: 'UserOp included but execution reverted on-chain.',
            data: {
              txHash: receipt.transactionHash,
              block: receipt.blockNumber,
              gasCost: `${formatEther(BigInt(receipt.actualGasCost))} ETH`,
              sender: accountInfo.address,
            },
          });
        }

        console.log('');
        display.info('Account', accountInfo.alias);
        display.info('Tx Hash', receipt.transactionHash);
        display.info('Block', receipt.blockNumber);
        display.info('Gas Cost', `${formatEther(BigInt(receipt.actualGasCost))} ETH`);
        display.info('Sponsored', sponsored ? 'Yes (gasless)' : 'No (user paid)');

        if (chainConfig.blockExplorer) {
          display.info('Explorer', `${chainConfig.blockExplorer}/tx/${receipt.transactionHash}`);
        }

        if (!receipt.success) {
          process.exitCode = 1;
        }
      } catch (err) {
        handleTxError(err);
      }
    });

  // ─── simulate ───────────────────────────────────────────────────

  tx.command('simulate')
    .description('Preview a transaction (gas estimate, sponsor check)')
    .argument('[account]', 'Source account alias or address (default: current)')
    .option('--tx <spec...>', 'Transaction spec: "to:0xAddr,value:0.1,data:0x..." (repeatable, ordered)')
    .option('--no-sponsor', 'Skip sponsorship check')
    .action(async (target?: string, opts?: { tx?: string[]; sponsor?: boolean }) => {
      if (!ctx.deviceKey) {
        handleTxError(new TxError(ERR_ACCOUNT_NOT_READY, 'Wallet not initialized. Run `elytro init` first.'));
        return;
      }

      try {
        const specs = parseAllTxSpecs(opts?.tx);
        const { userOp, accountInfo, chainConfig, sponsored, txType } = await buildUserOp(
          ctx,
          target,
          specs,
          opts?.sponsor
        );

        const { wei: ethBalance, ether: ethFormatted } = await ctx.walletClient.getBalance(accountInfo.address);
        const nativeCurrency = chainConfig.nativeCurrency.symbol;

        console.log('');
        display.heading('Transaction Simulation');

        display.info('Type', txTypeLabel(txType));
        display.info('From', `${accountInfo.alias} (${accountInfo.address})`);
        display.info('Chain', `${chainConfig.name} (${chainConfig.id})`);

        if (txType === 'batch') {
          console.log('');
          display.info('Tx Count', specs.length.toString());
          for (let i = 0; i < specs.length; i++) {
            displayTxSpec(specs[i], i);
          }
          const total = totalEthValue(specs);
          if (total > 0n) {
            display.info('Total ETH', formatEther(total));
            if (ethBalance < total) {
              display.warn(`Insufficient balance: need ${formatEther(total)}, have ${ethFormatted} ${nativeCurrency}`);
            }
          }
        } else if (txType === 'contract-call') {
          const s = specs[0];
          console.log('');
          display.info('To', s.to);
          display.info('Calldata', truncateHex(s.data ?? '0x'));
          display.info('Calldata Size', `${Math.max(0, ((s.data?.length ?? 2) - 2) / 2)} bytes`);
          if (s.data && s.data.length >= 10) {
            display.info('Selector', s.data.slice(0, 10));
          }
          if (s.value && s.value !== '0') {
            display.info('Value', `${s.value} ${nativeCurrency} (payable)`);
            const sendValue = parseEther(s.value);
            if (ethBalance < sendValue) {
              display.warn(`Insufficient balance for value: need ${s.value}, have ${ethFormatted} ${nativeCurrency}`);
            }
          }
          const isContract = await ctx.walletClient.isContractDeployed(s.to);
          display.info('Target', isContract ? 'Contract' : 'EOA (warning: calling non-contract)');
          if (!isContract) {
            display.warn('Target address has no deployed code. The call may be a no-op or revert.');
          }
        } else {
          const s = specs[0];
          console.log('');
          display.info('To', s.to);
          display.info('Value', `${s.value ?? '0'} ${nativeCurrency}`);
          if (s.value) {
            const sendValue = parseEther(s.value);
            if (ethBalance < sendValue) {
              display.warn(`Insufficient balance: need ${s.value}, have ${ethFormatted} ${nativeCurrency}`);
            }
          }
        }

        console.log('');
        display.info('callGasLimit', userOp.callGasLimit.toString());
        display.info('verificationGasLimit', userOp.verificationGasLimit.toString());
        display.info('preVerificationGas', userOp.preVerificationGas.toString());
        display.info('maxFeePerGas', `${userOp.maxFeePerGas.toString()} wei`);
        display.info('maxPriorityFeePerGas', `${userOp.maxPriorityFeePerGas.toString()} wei`);

        const totalGas = userOp.callGasLimit + userOp.verificationGasLimit + userOp.preVerificationGas;
        const maxCostWei = totalGas * userOp.maxFeePerGas;
        display.info('Max Gas Cost', `${formatEther(maxCostWei)} ${nativeCurrency}`);

        console.log('');
        display.info('Sponsored', sponsored ? 'Yes (gasless)' : 'No (user pays gas)');
        if (sponsored && userOp.paymaster) {
          display.info('Paymaster', userOp.paymaster);
        }

        display.info(`${nativeCurrency} Balance`, `${ethFormatted} ${nativeCurrency}`);
        if (!sponsored && ethBalance < maxCostWei) {
          display.warn(
            `Insufficient ${nativeCurrency} for gas: need ~${formatEther(maxCostWei)}, have ${ethFormatted}`
          );
        }
      } catch (err) {
        handleTxError(err);
      }
    });
}

// ─── Shared Build Logic ──────────────────────────────────────────────

interface BuildResult {
  userOp: ElytroUserOperation;
  accountInfo: AccountInfo;
  chainConfig: ChainConfig;
  sponsored: boolean;
  txType: TxType;
}

function parseAllTxSpecs(rawSpecs: string[] | undefined): TxSpec[] {
  if (!rawSpecs || rawSpecs.length === 0) {
    throw new TxError(ERR_INVALID_PARAMS, 'At least one --tx is required. Format: --tx "to:0xAddr,value:0.1"');
  }
  return rawSpecs.map((spec, i) => parseTxSpec(spec, i));
}

/**
 * Shared UserOp build pipeline used by build, send, and simulate.
 */
async function buildUserOp(
  ctx: AppContext,
  target: string | undefined,
  specs: TxSpec[],
  sponsor?: boolean
): Promise<BuildResult> {
  // 1. Resolve account
  const identifier = target ?? ctx.account.currentAccount?.alias ?? ctx.account.currentAccount?.address;
  if (!identifier) {
    throw new TxError(ERR_ACCOUNT_NOT_READY, 'No account selected.', {
      hint: 'Specify an alias/address or create an account first.',
    });
  }

  const accountInfo = resolveAccountStrict(ctx, identifier);
  const chainConfig = resolveChainStrict(ctx, accountInfo.chainId);

  if (!accountInfo.isDeployed) {
    throw new TxError(ERR_ACCOUNT_NOT_READY, `Account "${accountInfo.alias}" is not deployed.`, {
      account: accountInfo.alias,
      address: accountInfo.address,
      hint: 'Run `elytro account activate` first.',
    });
  }

  await ctx.sdk.initForChain(chainConfig);
  ctx.walletClient.initForChain(chainConfig);

  // 2. Balance pre-check
  const ethValueTotal = totalEthValue(specs);
  if (ethValueTotal > 0n) {
    const { wei: ethBalance } = await ctx.walletClient.getBalance(accountInfo.address);
    if (ethBalance < ethValueTotal) {
      const have = formatEther(ethBalance);
      const need = formatEther(ethValueTotal);
      throw new TxError(ERR_INSUFFICIENT_BALANCE, 'Insufficient ETH balance for transfer value.', {
        need: `${need} ETH`,
        have: `${have} ETH`,
        account: accountInfo.address,
        chain: chainConfig.name,
      });
    }
  }

  // 3. Create unsigned UserOp (txs order preserved)
  const txType = detectTxType(specs);
  const txs = specsToTxs(specs);

  const spinner = ora('Building UserOp...').start();

  let userOp: ElytroUserOperation;
  try {
    userOp = await ctx.sdk.createSendUserOp(accountInfo.address, txs);
  } catch (err) {
    spinner.fail('Build failed.');
    throw new TxError(ERR_BUILD_FAILED, `Failed to build UserOp: ${(err as Error).message}`, {
      account: accountInfo.address,
      chain: chainConfig.name,
    });
  }

  // 4. Gas prices
  spinner.text = 'Fetching gas prices...';
  const feeData = await ctx.sdk.getFeeData(chainConfig);
  userOp.maxFeePerGas = feeData.maxFeePerGas;
  userOp.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;

  // 5. Estimate gas
  spinner.text = 'Estimating gas...';
  try {
    const gasEstimate = await ctx.sdk.estimateUserOp(userOp, { fakeBalance: true });
    userOp.callGasLimit = gasEstimate.callGasLimit;
    userOp.verificationGasLimit = gasEstimate.verificationGasLimit;
    userOp.preVerificationGas = gasEstimate.preVerificationGas;
  } catch (err) {
    spinner.fail('Gas estimation failed.');
    throw new TxError(ERR_BUILD_FAILED, `Gas estimation failed: ${(err as Error).message}`, {
      account: accountInfo.address,
      chain: chainConfig.name,
    });
  }

  // 6. Sponsorship
  let sponsored = false;
  if (sponsor !== false) {
    spinner.text = 'Checking sponsorship...';
    const { sponsor: sponsorResult, error: sponsorError } = await requestSponsorship(
      ctx.chain.graphqlEndpoint,
      accountInfo.chainId,
      ctx.sdk.entryPoint,
      userOp
    );

    if (sponsorResult) {
      applySponsorToUserOp(userOp, sponsorResult);
      sponsored = true;
    } else {
      spinner.text = 'Sponsorship unavailable, checking balance...';
      const { wei: balance } = await ctx.walletClient.getBalance(accountInfo.address);
      if (balance === 0n) {
        spinner.fail('Build failed.');
        throw new TxError(ERR_SPONSOR_FAILED, 'Sponsorship failed and account has no ETH to pay gas.', {
          reason: sponsorError ?? 'unknown',
          account: accountInfo.address,
          chain: chainConfig.name,
          hint: `Fund ${accountInfo.address} on ${chainConfig.name}.`,
        });
      }
    }
  }

  spinner.succeed('UserOp built.');
  return { userOp, accountInfo, chainConfig, sponsored, txType };
}

// ─── Helpers ─────────────────────────────────────────────────────────

function resolveAccountStrict(ctx: AppContext, identifier: string): AccountInfo {
  const account = ctx.account.resolveAccount(identifier);
  if (!account) {
    throw new TxError(ERR_ACCOUNT_NOT_READY, `Account "${identifier}" not found.`, { identifier });
  }
  return account;
}

function resolveChainStrict(ctx: AppContext, chainId: number): ChainConfig {
  const chain = ctx.chain.chains.find((c) => c.id === chainId);
  if (!chain) {
    throw new TxError(ERR_ACCOUNT_NOT_READY, `Chain ${chainId} not configured.`, { chainId });
  }
  return chain;
}

function serializeUserOp(op: ElytroUserOperation): Record<string, string | null> {
  return {
    sender: op.sender,
    nonce: toHex(op.nonce),
    factory: op.factory,
    factoryData: op.factoryData,
    callData: op.callData,
    callGasLimit: toHex(op.callGasLimit),
    verificationGasLimit: toHex(op.verificationGasLimit),
    preVerificationGas: toHex(op.preVerificationGas),
    maxFeePerGas: toHex(op.maxFeePerGas),
    maxPriorityFeePerGas: toHex(op.maxPriorityFeePerGas),
    paymaster: op.paymaster,
    paymasterVerificationGasLimit: op.paymasterVerificationGasLimit ? toHex(op.paymasterVerificationGasLimit) : null,
    paymasterPostOpGasLimit: op.paymasterPostOpGasLimit ? toHex(op.paymasterPostOpGasLimit) : null,
    paymasterData: op.paymasterData,
    signature: op.signature,
  };
}

function deserializeUserOp(json: string): ElytroUserOperation {
  let raw: Record<string, string | null>;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new TxError(ERR_INVALID_PARAMS, 'Invalid UserOp JSON. Pass a JSON-encoded UserOp object.', { json });
  }

  if (!raw.sender || !raw.callData) {
    throw new TxError(ERR_INVALID_PARAMS, 'Invalid UserOp: missing required fields (sender, callData).');
  }

  return {
    sender: raw.sender as Address,
    nonce: BigInt(raw.nonce ?? '0x0'),
    factory: (raw.factory as Address) ?? null,
    factoryData: (raw.factoryData as Hex) ?? null,
    callData: raw.callData as Hex,
    callGasLimit: BigInt(raw.callGasLimit ?? '0x0'),
    verificationGasLimit: BigInt(raw.verificationGasLimit ?? '0x0'),
    preVerificationGas: BigInt(raw.preVerificationGas ?? '0x0'),
    maxFeePerGas: BigInt(raw.maxFeePerGas ?? '0x0'),
    maxPriorityFeePerGas: BigInt(raw.maxPriorityFeePerGas ?? '0x0'),
    paymaster: (raw.paymaster as Address) ?? null,
    paymasterVerificationGasLimit: raw.paymasterVerificationGasLimit ? BigInt(raw.paymasterVerificationGasLimit) : null,
    paymasterPostOpGasLimit: raw.paymasterPostOpGasLimit ? BigInt(raw.paymasterPostOpGasLimit) : null,
    paymasterData: (raw.paymasterData as Hex) ?? null,
    signature: (raw.signature as Hex) ?? '0x',
  };
}
