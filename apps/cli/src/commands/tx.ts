import { Command } from 'commander';
import ora from 'ora';
import { isAddress, isHex, formatEther, parseEther, toHex, formatUnits } from 'viem';
import type { Address, Hex } from 'viem';
import type { AppContext } from '../context';
import type { ElytroUserOperation, AccountInfo, ChainConfig } from '../types';
import { requestSponsorship, applySponsorToUserOp } from '../utils/sponsor';
import { getTokenInfo, getTokenBalance, encodeTransfer, parseTokenAmount } from '../utils/erc20';
import { askConfirm } from '../utils/prompt';
import * as display from '../utils/display';

/**
 * Transaction type detected from user inputs.
 * Used to drive display logic in send confirmation and simulate output.
 */
type TxType = 'eth-transfer' | 'erc20-transfer' | 'contract-call';

/**
 * `elytro tx` — Build, simulate, and send UserOperations.
 *
 * Subcommands:
 *   build    — Build a UserOp from eth_sendTransaction-style params
 *   send     — Build + sign + broadcast a UserOp (or send a pre-built one)
 *   simulate — Preview a UserOp (gas estimate, sponsor check, balance impact)
 *
 * Design:
 * - Reuses the full UserOp pipeline from account activate (fee → estimate → sponsor → sign → send → receipt)
 * - Accepts eth_sendTransaction-style params (--to, --value, --data)
 * - Also supports ERC-20 shorthand via --token + --amount
 * - [account] is always optional, defaults to current
 */
export function registerTxCommand(program: Command, ctx: AppContext): void {
  const tx = program.command('tx').description('Build, simulate, and send transactions');

  // ─── build ──────────────────────────────────────────────────────

  tx.command('build')
    .description('Build a UserOp from transaction parameters')
    .argument('[account]', 'Source account alias or address (default: current)')
    .requiredOption('--to <address>', 'Recipient / contract address')
    .option('--value <amount>', 'ETH value in human units (e.g. "0.1")')
    .option('--data <hex>', 'Calldata hex (for contract calls)')
    .option('--token <address>', 'ERC-20 token address (shorthand for transfer)')
    .option('--amount <amount>', 'Token amount in human units (requires --token)')
    .option('--no-sponsor', 'Skip sponsorship check')
    .action(async (target?: string, opts?: BuildOptions) => {
      try {
        const { userOp, accountInfo, chainConfig, sponsored, txType } = await buildUserOp(ctx, target, opts);

        // Output the fully assembled (unsigned) UserOp as JSON
        display.heading('UserOperation (unsigned)');
        console.log(JSON.stringify(serializeUserOp(userOp), null, 2));
        console.log('');
        display.info('Account', accountInfo.alias);
        display.info('Chain', `${chainConfig.name} (${chainConfig.id})`);
        display.info('Type', txTypeLabel(txType));
        display.info('Sponsored', sponsored ? 'Yes' : 'No');
      } catch (err) {
        display.error((err as Error).message);
        process.exitCode = 1;
      }
    });

  // ─── send ───────────────────────────────────────────────────────

  tx.command('send')
    .description('Send a transaction on-chain')
    .argument('[account]', 'Source account alias or address (default: current)')
    .requiredOption('--to <address>', 'Recipient / contract address')
    .option('--value <amount>', 'ETH value in human units (e.g. "0.1")')
    .option('--data <hex>', 'Calldata hex (for contract calls)')
    .option('--token <address>', 'ERC-20 token address (shorthand for transfer)')
    .option('--amount <amount>', 'Token amount in human units (requires --token)')
    .option('--no-sponsor', 'Skip sponsorship check')
    .option('--userop <json>', 'Send a pre-built UserOp JSON (skips build step)')
    .action(async (target?: string, opts?: SendOptions) => {
      if (!ctx.deviceKey) {
        display.error('Wallet not initialized. Run `elytro init` first.');
        process.exitCode = 1;
        return;
      }

      try {
        let userOp: ElytroUserOperation;
        let accountInfo: AccountInfo;
        let chainConfig: ChainConfig;
        let sponsored: boolean;
        let txType: TxType = 'contract-call'; // default for pre-built userop

        if (opts?.userop) {
          // ── Pre-built UserOp path ──
          const parsed = deserializeUserOp(opts.userop);
          userOp = parsed;
          sponsored = !!userOp.paymaster;

          const identifier = target ?? ctx.account.currentAccount?.alias ?? ctx.account.currentAccount?.address;
          if (!identifier) {
            display.error('No account selected.');
            process.exitCode = 1;
            return;
          }
          accountInfo = resolveAccountStrict(ctx, identifier);
          chainConfig = resolveChainStrict(ctx, accountInfo.chainId);

          // Ensure SDK is initialized
          await ctx.sdk.initForChain(chainConfig);
          ctx.walletClient.initForChain(chainConfig);
        } else {
          // ── Build from params path ──
          const result = await buildUserOp(ctx, target, opts);
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
        display.info('From', `${accountInfo.alias} (${display.address(accountInfo.address)})`);
        display.info('To', opts?.to ?? '—');

        if (txType === 'erc20-transfer' && opts?.token && opts?.amount) {
          display.info('Token', opts.token);
          display.info('Amount', opts.amount);
        } else if (txType === 'contract-call') {
          display.info('Calldata', truncateHex(opts?.data ?? '0x'));
          if (opts?.data && opts.data.length >= 10) {
            display.info('Selector', opts.data.slice(0, 10));
          }
          if (opts?.value && opts.value !== '0') {
            display.info('Value', `${opts.value} ETH (payable)`);
          }
        } else if (opts?.value) {
          display.info('Value', `${opts.value} ETH`);
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

        // Sign
        const { packedHash, validationData } = await ctx.sdk.getUserOpHash(userOp);
        const rawSignature = await ctx.keyring.signDigest(packedHash);
        userOp.signature = await ctx.sdk.packUserOpSignature(rawSignature, validationData);

        // Send
        spinner.text = 'Sending to bundler...';
        const opHash = await ctx.sdk.sendUserOp(userOp);

        // Wait
        spinner.text = 'Waiting for on-chain confirmation...';
        const receipt = await ctx.sdk.waitForReceipt(opHash, chainConfig);

        if (receipt.success) {
          spinner.succeed('Transaction confirmed!');
        } else {
          spinner.warn('UserOp included but execution reverted.');
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
      } catch (err) {
        display.error((err as Error).message);
        process.exitCode = 1;
      }
    });

  // ─── simulate ───────────────────────────────────────────────────

  tx.command('simulate')
    .description('Preview a transaction (gas estimate, sponsor check)')
    .argument('[account]', 'Source account alias or address (default: current)')
    .requiredOption('--to <address>', 'Recipient / contract address')
    .option('--value <amount>', 'ETH value in human units (e.g. "0.1")')
    .option('--data <hex>', 'Calldata hex (for contract calls)')
    .option('--token <address>', 'ERC-20 token address (shorthand for transfer)')
    .option('--amount <amount>', 'Token amount in human units (requires --token)')
    .option('--no-sponsor', 'Skip sponsorship check')
    .action(async (target?: string, opts?: BuildOptions) => {
      if (!ctx.deviceKey) {
        display.error('Wallet not initialized. Run `elytro init` first.');
        process.exitCode = 1;
        return;
      }

      try {
        const { userOp, accountInfo, chainConfig, sponsored, txType, tokenInfo } = await buildUserOp(ctx, target, opts);

        // ── Fetch balances ──
        const { wei: ethBalance, ether: ethFormatted } = await ctx.walletClient.getBalance(accountInfo.address);
        const nativeCurrency = chainConfig.nativeCurrency.symbol;

        console.log('');
        display.heading('Transaction Simulation');

        // ── Overview ──
        display.info('Type', txTypeLabel(txType));
        display.info('From', `${accountInfo.alias} (${display.address(accountInfo.address)})`);
        display.info('To', opts?.to ?? '—');
        display.info('Chain', `${chainConfig.name} (${chainConfig.id})`);

        // ── Type-specific details ──
        if (txType === 'erc20-transfer' && tokenInfo && opts?.amount) {
          console.log('');
          display.info('Token', `${tokenInfo.symbol} (${opts.token})`);
          display.info('Amount', `${opts.amount} ${tokenInfo.symbol}`);
          const tokenBal = await getTokenBalance(ctx.walletClient, opts.token as Address, accountInfo.address);
          display.info('Token Balance', `${formatUnits(tokenBal, tokenInfo.decimals)} ${tokenInfo.symbol}`);
          const parsedAmt = parseTokenAmount(opts.amount, tokenInfo.decimals);
          if (tokenBal < parsedAmt) {
            display.warn(
              `Insufficient token balance: need ${opts.amount}, have ${formatUnits(tokenBal, tokenInfo.decimals)}`
            );
          }
        } else if (txType === 'contract-call') {
          console.log('');
          display.info('Calldata', truncateHex(opts?.data ?? '0x'));
          display.info('Calldata Size', `${Math.max(0, ((opts?.data?.length ?? 2) - 2) / 2)} bytes`);
          if (opts?.data && opts.data.length >= 10) {
            display.info('Selector', opts.data.slice(0, 10));
          }
          if (opts?.value && opts.value !== '0') {
            display.info('Value', `${opts.value} ${nativeCurrency} (payable)`);
            const sendValue = parseEther(opts.value);
            if (ethBalance < sendValue) {
              display.warn(
                `Insufficient balance for value: need ${opts.value}, have ${ethFormatted} ${nativeCurrency}`
              );
            }
          }
          // Check target is a contract
          const isContract = await ctx.walletClient.isContractDeployed(opts?.to as Address);
          display.info('Target', isContract ? 'Contract' : 'EOA (warning: calling non-contract)');
          if (!isContract) {
            display.warn('Target address has no deployed code. The call may be a no-op or revert.');
          }
        } else {
          // eth-transfer
          console.log('');
          display.info('Value', `${opts?.value ?? '0'} ${nativeCurrency}`);
          if (opts?.value) {
            const sendValue = parseEther(opts.value);
            if (ethBalance < sendValue) {
              display.warn(`Insufficient balance: need ${opts.value}, have ${ethFormatted} ${nativeCurrency}`);
            }
          }
        }

        // ── Gas details ──
        console.log('');
        display.info('callGasLimit', userOp.callGasLimit.toString());
        display.info('verificationGasLimit', userOp.verificationGasLimit.toString());
        display.info('preVerificationGas', userOp.preVerificationGas.toString());
        display.info('maxFeePerGas', `${userOp.maxFeePerGas.toString()} wei`);
        display.info('maxPriorityFeePerGas', `${userOp.maxPriorityFeePerGas.toString()} wei`);

        const totalGas = userOp.callGasLimit + userOp.verificationGasLimit + userOp.preVerificationGas;
        const maxCostWei = totalGas * userOp.maxFeePerGas;
        display.info('Max Gas Cost', `${formatEther(maxCostWei)} ${nativeCurrency}`);

        // ── Sponsor ──
        console.log('');
        display.info('Sponsored', sponsored ? 'Yes (gasless)' : 'No (user pays gas)');
        if (sponsored && userOp.paymaster) {
          display.info('Paymaster', userOp.paymaster);
        }

        // ── Balance summary ──
        display.info(`${nativeCurrency} Balance`, `${ethFormatted} ${nativeCurrency}`);
        if (!sponsored && ethBalance < maxCostWei) {
          display.warn(
            `Insufficient ${nativeCurrency} for gas: need ~${formatEther(maxCostWei)}, have ${ethFormatted}`
          );
        }
      } catch (err) {
        display.error((err as Error).message);
        process.exitCode = 1;
      }
    });
}

// ─── Shared Build Logic ──────────────────────────────────────────────

interface BuildOptions {
  to?: string;
  value?: string;
  data?: string;
  token?: string;
  amount?: string;
  sponsor?: boolean;
}

interface SendOptions extends BuildOptions {
  userop?: string;
}

interface BuildResult {
  userOp: ElytroUserOperation;
  accountInfo: AccountInfo;
  chainConfig: ChainConfig;
  sponsored: boolean;
  txType: TxType;
  tokenInfo?: { symbol: string; decimals: number };
}

/**
 * Shared UserOp build pipeline used by build, send, and simulate.
 *
 * Steps:
 *   1. Resolve account & chain
 *   2. Validate inputs
 *   3. Build transaction list (ETH transfer / ERC-20 transfer / raw calldata)
 *   4. Create unsigned UserOp via SDK fromTransaction
 *   5. Fetch gas prices
 *   6. Estimate gas
 *   7. Try sponsorship (unless --no-sponsor)
 */
async function buildUserOp(
  ctx: AppContext,
  target: string | undefined,
  opts: BuildOptions | undefined
): Promise<BuildResult> {
  // 1. Resolve account
  const identifier = target ?? ctx.account.currentAccount?.alias ?? ctx.account.currentAccount?.address;
  if (!identifier) {
    throw new Error('No account selected. Specify an alias/address or create an account first.');
  }

  const accountInfo = resolveAccountStrict(ctx, identifier);
  const chainConfig = resolveChainStrict(ctx, accountInfo.chainId);

  // Must be deployed
  if (!accountInfo.isDeployed) {
    throw new Error(`Account "${accountInfo.alias}" is not deployed. Run \`elytro account activate\` first.`);
  }

  // 2. Validate inputs
  if (!opts?.to || !isAddress(opts.to)) {
    throw new Error('--to must be a valid address.');
  }

  if (opts.token && !isAddress(opts.token)) {
    throw new Error('--token must be a valid address.');
  }

  if (opts.token && !opts.amount) {
    throw new Error('--amount is required when using --token.');
  }

  if (!opts.value && !opts.data && !opts.token) {
    throw new Error('At least one of --value, --data, or --token is required.');
  }

  // Validate --data hex format
  if (opts.data) {
    if (!isHex(opts.data)) {
      throw new Error('--data must be a valid hex string (starting with 0x).');
    }
    if (opts.data.length > 2 && opts.data.length % 2 !== 0) {
      throw new Error('--data hex string must have even length (complete bytes).');
    }
  }

  // Ensure SDK + WalletClient are initialized for the account's chain
  await ctx.sdk.initForChain(chainConfig);
  ctx.walletClient.initForChain(chainConfig);

  // 3. Build transaction(s) and determine type
  const txs: Array<{ to: string; value?: string; data?: string }> = [];
  let tokenInfo: { symbol: string; decimals: number } | undefined;
  let txType: TxType;

  if (opts.token && opts.amount) {
    // ERC-20 transfer shorthand
    txType = 'erc20-transfer';
    tokenInfo = await getTokenInfo(ctx.walletClient, opts.token as Address);
    const parsedAmount = parseTokenAmount(opts.amount, tokenInfo.decimals);
    const transferData = encodeTransfer(opts.to as Address, parsedAmount);

    txs.push({
      to: opts.token,
      value: '0x0',
      data: transferData,
    });
  } else if (opts.data && opts.data !== '0x') {
    // Has calldata → contract interaction (may also carry ETH value for payable)
    txType = 'contract-call';
    txs.push({
      to: opts.to,
      value: opts.value ? toHex(parseEther(opts.value)) : '0x0',
      data: opts.data,
    });
  } else {
    // Plain ETH transfer
    txType = 'eth-transfer';
    txs.push({
      to: opts.to,
      value: opts.value ? toHex(parseEther(opts.value)) : '0x0',
      data: '0x',
    });
  }

  // 3.5 Balance pre-check — reject early if sender can't cover transfer value
  // (Sponsor covers gas only, NOT the value being transferred)
  const { wei: ethBalance } = await ctx.walletClient.getBalance(accountInfo.address);

  if (txType === 'eth-transfer' || txType === 'contract-call') {
    const sendValue = opts.value ? parseEther(opts.value) : 0n;
    if (sendValue > 0n && ethBalance < sendValue) {
      const formatted = formatEther(ethBalance);
      throw new Error(
        `Insufficient ETH balance: need ${opts.value} ETH, have ${formatted} ETH. ` +
          `Fund ${accountInfo.address} on ${chainConfig.name} before sending.`
      );
    }
  }

  if (txType === 'erc20-transfer' && tokenInfo && opts.amount) {
    const parsedAmount = parseTokenAmount(opts.amount, tokenInfo.decimals);
    const tokenBal = await getTokenBalance(ctx.walletClient, opts.token as Address, accountInfo.address);
    if (tokenBal < parsedAmount) {
      const formatted = formatUnits(tokenBal, tokenInfo.decimals);
      throw new Error(
        `Insufficient ${tokenInfo.symbol} balance: need ${opts.amount}, have ${formatted}. ` +
          `Fund ${accountInfo.address} with ${tokenInfo.symbol} before sending.`
      );
    }
  }

  // 4. Create unsigned UserOp
  const spinner = ora('Building UserOp...').start();

  const userOp = await ctx.sdk.createSendUserOp(accountInfo.address, txs);

  // 5. Gas prices
  spinner.text = 'Fetching gas prices...';
  const feeData = await ctx.sdk.getFeeData(chainConfig);
  userOp.maxFeePerGas = feeData.maxFeePerGas;
  userOp.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;

  // 6. Estimate gas
  // Extension always injects fakeBalance during estimation (before sponsor),
  // because the bundler simulates as if user pays — AA21 if insufficient ETH.
  spinner.text = 'Estimating gas...';
  const gasEstimate = await ctx.sdk.estimateUserOp(userOp, { fakeBalance: true });
  userOp.callGasLimit = gasEstimate.callGasLimit;
  userOp.verificationGasLimit = gasEstimate.verificationGasLimit;
  userOp.preVerificationGas = gasEstimate.preVerificationGas;

  // 7. Sponsorship
  let sponsored = false;
  if (opts?.sponsor !== false) {
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
      // Sponsor failed — check if account has funds to self-pay
      spinner.text = 'Sponsorship unavailable, checking balance...';
      const { ether: balance } = await ctx.walletClient.getBalance(accountInfo.address);
      if (parseFloat(balance) === 0) {
        spinner.fail('Build failed.');
        throw new Error(
          `Sponsorship failed: ${sponsorError ?? 'unknown'}. ` +
            `Account has no ETH to pay gas. Fund ${accountInfo.address} on ${chainConfig.name}.`
        );
      }
      // Has funds — proceed without sponsor
    }
  }

  spinner.succeed('UserOp built.');
  return { userOp, accountInfo, chainConfig, sponsored, txType, tokenInfo };
}

// ─── Helpers ─────────────────────────────────────────────────────────

function txTypeLabel(txType: TxType): string {
  switch (txType) {
    case 'eth-transfer':
      return 'ETH Transfer';
    case 'erc20-transfer':
      return 'ERC-20 Transfer';
    case 'contract-call':
      return 'Contract Call';
  }
}

/**
 * Truncate a long hex string for display (e.g. "0xabcdef...1234" if >20 chars).
 */
function truncateHex(hex: string, maxLen = 42): string {
  if (hex.length <= maxLen) return hex;
  return `${hex.slice(0, 20)}...${hex.slice(-8)} (${(hex.length - 2) / 2} bytes)`;
}

function resolveAccountStrict(ctx: AppContext, identifier: string): AccountInfo {
  const account = ctx.account.resolveAccount(identifier);
  if (!account) {
    throw new Error(`Account "${identifier}" not found.`);
  }
  return account;
}

function resolveChainStrict(ctx: AppContext, chainId: number): ChainConfig {
  const chain = ctx.chain.chains.find((c) => c.id === chainId);
  if (!chain) {
    throw new Error(`Chain ${chainId} not configured.`);
  }
  return chain;
}

/**
 * Serialize ElytroUserOperation to a plain JSON-safe object (bigint → hex string).
 */
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

/**
 * Deserialize a JSON string into ElytroUserOperation (hex string → bigint).
 */
function deserializeUserOp(json: string): ElytroUserOperation {
  let raw: Record<string, string | null>;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new Error('Invalid UserOp JSON. Pass a JSON-encoded UserOp object.');
  }

  if (!raw.sender || !raw.callData) {
    throw new Error('Invalid UserOp: missing required fields (sender, callData).');
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
