import { Command } from 'commander';
import ora from 'ora';
import { isAddress, isHex, formatEther, parseEther, toHex } from 'viem';
import type { Address, Hex } from 'viem';
import type { AppContext } from '../context';
import type { ElytroUserOperation, AccountInfo, ChainConfig } from '../types';
import { requestSponsorship, applySponsorToUserOp } from '../utils/sponsor';
import { askConfirm, askInput } from '../utils/prompt';
import * as display from '../utils/display';
import { outputSuccess, outputError, handleError, CliError, ErrorCode, isJsonMode } from '../utils/output';
import { SecurityHookService, createSignMessageForAuth } from '../services/securityHook';
import { SECURITY_HOOK_ADDRESS_MAP } from '../constants/securityHook';

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
      throw new CliError(ErrorCode.INVALID_PARAMS, `${prefix}: invalid segment "${part}". Expected key:value format.`, {
        spec,
        index,
      });
    }
    const key = part.slice(0, colonIdx).trim().toLowerCase();
    const val = part.slice(colonIdx + 1).trim();
    if (!key || !val) {
      throw new CliError(ErrorCode.INVALID_PARAMS, `${prefix}: empty key or value in "${part}".`, { spec, index });
    }
    if (fields[key]) {
      throw new CliError(ErrorCode.INVALID_PARAMS, `${prefix}: duplicate key "${key}".`, { spec, index, key });
    }
    fields[key] = val;
  }

  const knownKeys = new Set(['to', 'value', 'data']);
  for (const key of Object.keys(fields)) {
    if (!knownKeys.has(key)) {
      throw new CliError(ErrorCode.INVALID_PARAMS, `${prefix}: unknown key "${key}". Allowed: to, value, data.`, {
        spec,
        index,
        key,
      });
    }
  }

  if (!fields.to) {
    throw new CliError(ErrorCode.INVALID_PARAMS, `${prefix}: "to" is required.`, { spec, index });
  }
  if (!isAddress(fields.to)) {
    throw new CliError(ErrorCode.INVALID_PARAMS, `${prefix}: invalid address "${fields.to}".`, {
      spec,
      index,
      to: fields.to,
    });
  }

  if (!fields.value && !fields.data) {
    throw new CliError(ErrorCode.INVALID_PARAMS, `${prefix}: at least one of "value" or "data" is required.`, {
      spec,
      index,
    });
  }

  if (fields.value) {
    try {
      const wei = parseEther(fields.value);
      if (wei < 0n) throw new Error('negative');
    } catch {
      throw new CliError(
        ErrorCode.INVALID_PARAMS,
        `${prefix}: invalid ETH amount "${fields.value}". Use human-readable format (e.g. "0.1").`,
        { spec, index, value: fields.value }
      );
    }
  }

  if (fields.data) {
    if (!isHex(fields.data)) {
      throw new CliError(ErrorCode.INVALID_PARAMS, `${prefix}: invalid hex in "data". Must start with 0x.`, {
        spec,
        index,
        data: fields.data,
      });
    }
    if (fields.data.length > 2 && fields.data.length % 2 !== 0) {
      throw new CliError(ErrorCode.INVALID_PARAMS, `${prefix}: "data" hex must have even length (complete bytes).`, {
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

        outputSuccess({
          userOp: serializeUserOp(userOp),
          account: accountInfo.alias,
          address: accountInfo.address,
          chainId: chainConfig.id,
          chainName: chainConfig.name,
          txType,
          txTypeLabel: txTypeLabel(txType),
          txCount: specs.length,
          sponsored,
        });
      } catch (err) {
        handleError(err);
      }
    });

  // ─── send ───────────────────────────────────────────────────────

  tx.command('send')
    .description('Send a transaction on-chain')
    .argument('[account]', 'Source account alias or address (default: current)')
    .option('--tx <spec...>', 'Transaction spec: "to:0xAddr,value:0.1,data:0x..." (repeatable, ordered)')
    .option('--no-sponsor', 'Skip sponsorship check')
    .option('--no-hook', 'Skip SecurityHook signing (bypass 2FA)')
    .option('--userop <json>', 'Send a pre-built UserOp JSON (skips build step)')
    .action(async (target?: string, opts?: { tx?: string[]; sponsor?: boolean; hook?: boolean; userop?: string }) => {
      if (!ctx.keyring.isUnlocked) {
        outputError(ErrorCode.ACCOUNT_NOT_READY, 'Wallet not initialized. Run `elytro init` first.');
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
            throw new CliError(ErrorCode.ACCOUNT_NOT_READY, 'No account selected.', {
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

        // ── Confirmation prompt (human mode only) ──
        if (!isJsonMode()) {
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
            outputSuccess({ status: 'cancelled' });
            return;
          }
        }

        // ── Sign + Send + Wait ──
        const spinner = isJsonMode() ? null : ora('Signing UserOperation...').start();

        let opHash: Hex;
        try {
          const { packedHash, validationData } = await ctx.sdk.getUserOpHash(userOp);
          const rawSignature = await ctx.keyring.signDigest(packedHash);

          // Check if SecurityHook is installed and signing is needed
          const useHook = opts?.hook !== false; // --no-hook disables
          let hookSigned = false;

          if (useHook) {
            const hookAddress = SECURITY_HOOK_ADDRESS_MAP[accountInfo.chainId];
            if (hookAddress) {
              // Create a temporary hook service to check status
              const hookService = new SecurityHookService({
                store: ctx.store,
                graphqlEndpoint: ctx.chain.graphqlEndpoint,
                signMessageForAuth: createSignMessageForAuth({
                  signDigest: (digest) => ctx.keyring.signDigest(digest),
                  packRawHash: (hash) => ctx.sdk.packRawHash(hash),
                  packSignature: (rawSig, valData) => ctx.sdk.packUserOpSignature(rawSig, valData),
                }),
                readContract: async (params) =>
                  ctx.walletClient.readContract(params as Parameters<typeof ctx.walletClient.readContract>[0]),
                getBlockTimestamp: async () => {
                  const blockNum = await ctx.walletClient.raw.getBlockNumber();
                  const block = await ctx.walletClient.raw.getBlock({ blockNumber: blockNum });
                  return block.timestamp;
                },
              });

              if (spinner) spinner.text = 'Checking SecurityHook status...';
              const hookStatus = await hookService.getHookStatus(accountInfo.address, accountInfo.chainId);

              if (hookStatus.installed && hookStatus.capabilities.preUserOpValidation) {
                // Pre-sign: pack signature without hook first for authorization request
                userOp.signature = await ctx.sdk.packUserOpSignature(rawSignature, validationData);

                if (spinner) spinner.text = 'Requesting hook authorization...';
                let hookResult = await hookService.getHookSignature(
                  accountInfo.address,
                  accountInfo.chainId,
                  ctx.sdk.entryPoint,
                  userOp
                );

                // Handle OTP challenge
                if (hookResult.error) {
                  if (spinner) spinner.stop();
                  const errCode = hookResult.error.code;

                  if (errCode === 'OTP_REQUIRED' || errCode === 'SPENDING_LIMIT_EXCEEDED') {
                    if (!isJsonMode()) {
                      display.warn(hookResult.error.message ?? `Verification required (${errCode}).`);
                      if (hookResult.error.maskedEmail) {
                        display.info('OTP sent to', hookResult.error.maskedEmail);
                      }
                      if (
                        errCode === 'SPENDING_LIMIT_EXCEEDED' &&
                        hookResult.error.projectedSpendUsdCents !== undefined
                      ) {
                        display.info(
                          'Projected spend',
                          `$${(hookResult.error.projectedSpendUsdCents / 100).toFixed(2)}`
                        );
                        display.info(
                          'Daily limit',
                          `$${((hookResult.error.dailyLimitUsdCents ?? 0) / 100).toFixed(2)}`
                        );
                      }
                    }

                    const otpCode = await askInput('Enter the 6-digit OTP code:');

                    if (spinner) spinner.start('Verifying OTP...');
                    await hookService.verifySecurityOtp(
                      accountInfo.address,
                      accountInfo.chainId,
                      hookResult.error.challengeId!,
                      otpCode.trim()
                    );

                    if (spinner) spinner.text = 'OTP verified. Retrying authorization...';
                    hookResult = await hookService.getHookSignature(
                      accountInfo.address,
                      accountInfo.chainId,
                      ctx.sdk.entryPoint,
                      userOp
                    );

                    if (hookResult.error) {
                      throw new CliError(
                        ErrorCode.SEND_FAILED,
                        `Hook authorization failed after OTP: ${hookResult.error.message}`
                      );
                    }
                  } else {
                    throw new CliError(
                      ErrorCode.SEND_FAILED,
                      `Hook authorization failed: ${hookResult.error.message ?? errCode}`
                    );
                  }
                }

                // Pack signature with hook data
                userOp.signature = await ctx.sdk.packUserOpSignatureWithHook(
                  rawSignature,
                  validationData,
                  hookAddress,
                  hookResult.signature! as Hex
                );
                hookSigned = true;
              }
            }
          }

          // Standard signing (no hook or hook not installed)
          if (!hookSigned) {
            userOp.signature = await ctx.sdk.packUserOpSignature(rawSignature, validationData);
          }

          if (spinner) spinner.text = 'Sending to bundler...';
          opHash = await ctx.sdk.sendUserOp(userOp);
        } catch (err) {
          if (spinner) spinner.fail('Send failed.');
          if (err instanceof CliError) throw err;
          throw new CliError(ErrorCode.SEND_FAILED, (err as Error).message, {
            sender: accountInfo.address,
            chain: chainConfig.name,
          });
        }

        if (spinner) spinner.text = 'Waiting for on-chain confirmation...';
        const receipt = await ctx.sdk.waitForReceipt(opHash);

        if (receipt.success) {
          if (spinner) spinner.succeed('Transaction confirmed!');
        } else {
          if (spinner) spinner.warn('Execution reverted.');
        }

        const result: Record<string, unknown> = {
          status: receipt.success ? 'confirmed' : 'reverted',
          account: accountInfo.alias,
          address: accountInfo.address,
          txHash: receipt.transactionHash,
          blockNumber: receipt.blockNumber,
          gasCost: `${formatEther(BigInt(receipt.actualGasCost))} ETH`,
          sponsored,
          txType,
          txTypeLabel: txTypeLabel(txType),
        };

        if (chainConfig.blockExplorer) {
          result.explorerUrl = `${chainConfig.blockExplorer}/tx/${receipt.transactionHash}`;
        }

        if (!receipt.success) {
          result.revertReason = (receipt as Record<string, unknown>).reason ?? null;
          outputSuccess(result);
          process.exitCode = 1;
        } else {
          outputSuccess(result);
        }
      } catch (err) {
        handleError(err);
      }
    });

  // ─── simulate ───────────────────────────────────────────────────

  tx.command('simulate')
    .description('Preview a transaction (gas estimate, sponsor check)')
    .argument('[account]', 'Source account alias or address (default: current)')
    .option('--tx <spec...>', 'Transaction spec: "to:0xAddr,value:0.1,data:0x..." (repeatable, ordered)')
    .option('--no-sponsor', 'Skip sponsorship check')
    .action(async (target?: string, opts?: { tx?: string[]; sponsor?: boolean }) => {
      if (!ctx.keyring.isUnlocked) {
        outputError(ErrorCode.ACCOUNT_NOT_READY, 'Wallet not initialized. Run `elytro init` first.');
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

        const totalGas = userOp.callGasLimit + userOp.verificationGasLimit + userOp.preVerificationGas;
        const maxCostWei = totalGas * userOp.maxFeePerGas;

        const warnings: string[] = [];

        // Check balance for transfer value
        const ethTotal = totalEthValue(specs);
        if (ethTotal > 0n && ethBalance < ethTotal) {
          warnings.push(
            `Insufficient balance for value: need ${formatEther(ethTotal)}, have ${ethFormatted} ${nativeCurrency}`
          );
        }

        // Check balance for gas
        if (!sponsored && ethBalance < maxCostWei) {
          warnings.push(
            `Insufficient ${nativeCurrency} for gas: need ~${formatEther(maxCostWei)}, have ${ethFormatted}`
          );
        }

        const txsDetail = specs.map((s, i) => ({
          index: i,
          to: s.to,
          value: s.value ?? '0',
          data: s.data ?? '0x',
          ...(s.data && s.data.length >= 10 ? { selector: s.data.slice(0, 10) } : {}),
        }));

        // Human-readable output
        if (!isJsonMode()) {
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
          }

          console.log('');
          display.info('callGasLimit', userOp.callGasLimit.toString());
          display.info('verificationGasLimit', userOp.verificationGasLimit.toString());
          display.info('preVerificationGas', userOp.preVerificationGas.toString());
          display.info('maxFeePerGas', `${userOp.maxFeePerGas.toString()} wei`);
          display.info('maxPriorityFeePerGas', `${userOp.maxPriorityFeePerGas.toString()} wei`);
          display.info('Max Gas Cost', `${formatEther(maxCostWei)} ${nativeCurrency}`);

          console.log('');
          display.info('Sponsored', sponsored ? 'Yes (gasless)' : 'No (user pays gas)');
          display.info(`${nativeCurrency} Balance`, `${ethFormatted} ${nativeCurrency}`);

          for (const w of warnings) display.warn(w);
        }

        outputSuccess({
          txType,
          txTypeLabel: txTypeLabel(txType),
          account: accountInfo.alias,
          address: accountInfo.address,
          chainId: chainConfig.id,
          chainName: chainConfig.name,
          transactions: txsDetail,
          gas: {
            callGasLimit: userOp.callGasLimit.toString(),
            verificationGasLimit: userOp.verificationGasLimit.toString(),
            preVerificationGas: userOp.preVerificationGas.toString(),
            maxFeePerGas: userOp.maxFeePerGas.toString(),
            maxPriorityFeePerGas: userOp.maxPriorityFeePerGas.toString(),
            maxCost: formatEther(maxCostWei),
            maxCostSymbol: nativeCurrency,
          },
          sponsored,
          paymaster: userOp.paymaster ?? null,
          balance: ethFormatted,
          balanceSymbol: nativeCurrency,
          warnings,
        });
      } catch (err) {
        handleError(err);
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
    throw new CliError(ErrorCode.INVALID_PARAMS, 'At least one --tx is required. Format: --tx "to:0xAddr,value:0.1"');
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
    throw new CliError(ErrorCode.ACCOUNT_NOT_READY, 'No account selected.', {
      hint: 'Specify an alias/address or create an account first.',
    });
  }

  const accountInfo = resolveAccountStrict(ctx, identifier);
  const chainConfig = resolveChainStrict(ctx, accountInfo.chainId);

  if (!accountInfo.isDeployed) {
    throw new CliError(ErrorCode.ACCOUNT_NOT_READY, `Account "${accountInfo.alias}" is not deployed.`, {
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
      throw new CliError(ErrorCode.INSUFFICIENT_BALANCE, 'Insufficient ETH balance for transfer value.', {
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

  const spinner = isJsonMode() ? null : ora('Building UserOp...').start();

  let userOp: ElytroUserOperation;
  try {
    userOp = await ctx.sdk.createSendUserOp(accountInfo.address, txs);
  } catch (err) {
    if (spinner) spinner.fail('Build failed.');
    throw new CliError(ErrorCode.BUILD_FAILED, `Failed to build UserOp: ${(err as Error).message}`, {
      account: accountInfo.address,
      chain: chainConfig.name,
    });
  }

  // 4. Gas prices
  if (spinner) spinner.text = 'Fetching gas prices...';
  const feeData = await ctx.sdk.getFeeData(chainConfig);
  userOp.maxFeePerGas = feeData.maxFeePerGas;
  userOp.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;

  // 5. Estimate gas
  if (spinner) spinner.text = 'Estimating gas...';
  try {
    const gasEstimate = await ctx.sdk.estimateUserOp(userOp, { fakeBalance: true });
    userOp.callGasLimit = gasEstimate.callGasLimit;
    userOp.verificationGasLimit = gasEstimate.verificationGasLimit;
    userOp.preVerificationGas = gasEstimate.preVerificationGas;
  } catch (err) {
    if (spinner) spinner.fail('Gas estimation failed.');
    throw new CliError(ErrorCode.BUILD_FAILED, `Gas estimation failed: ${(err as Error).message}`, {
      account: accountInfo.address,
      chain: chainConfig.name,
    });
  }

  // 6. Sponsorship
  let sponsored = false;
  if (sponsor !== false) {
    if (spinner) spinner.text = 'Checking sponsorship...';
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
      if (spinner) spinner.text = 'Sponsorship unavailable, checking balance...';
      const { wei: balance } = await ctx.walletClient.getBalance(accountInfo.address);
      if (balance === 0n) {
        if (spinner) spinner.fail('Build failed.');
        throw new CliError(ErrorCode.SPONSOR_FAILED, 'Sponsorship failed and account has no ETH to pay gas.', {
          reason: sponsorError ?? 'unknown',
          account: accountInfo.address,
          chain: chainConfig.name,
          hint: `Fund ${accountInfo.address} on ${chainConfig.name}.`,
        });
      }
    }
  }

  if (spinner) spinner.succeed('UserOp built.');
  return { userOp, accountInfo, chainConfig, sponsored, txType };
}

// ─── Helpers ─────────────────────────────────────────────────────────

function resolveAccountStrict(ctx: AppContext, identifier: string): AccountInfo {
  const account = ctx.account.resolveAccount(identifier);
  if (!account) {
    throw new CliError(ErrorCode.ACCOUNT_NOT_READY, `Account "${identifier}" not found.`, { identifier });
  }
  return account;
}

function resolveChainStrict(ctx: AppContext, chainId: number): ChainConfig {
  const chain = ctx.chain.chains.find((c) => c.id === chainId);
  if (!chain) {
    throw new CliError(ErrorCode.ACCOUNT_NOT_READY, `Chain ${chainId} not configured.`, { chainId });
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
    throw new CliError(ErrorCode.INVALID_PARAMS, 'Invalid UserOp JSON. Pass a JSON-encoded UserOp object.', { json });
  }

  if (!raw.sender || !raw.callData) {
    throw new CliError(ErrorCode.INVALID_PARAMS, 'Invalid UserOp: missing required fields (sender, callData).');
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
