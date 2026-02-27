import chalk from 'chalk';

/**
 * Terminal display helpers.
 * Keeps output consistent across all commands.
 */

export function heading(text: string): void {
  console.log(chalk.bold.cyan(`\n${text}\n`));
}

export function info(label: string, value: string): void {
  console.log(`  ${chalk.gray(label + ':')} ${value}`);
}

export function success(text: string): void {
  console.log(chalk.green(`✔ ${text}`));
}

export function warn(text: string): void {
  console.log(chalk.yellow(`⚠ ${text}`));
}

export function error(text: string): void {
  console.error(chalk.red(`✖ ${text}`));
}

/**
 * Structured error output aligned with JSON-RPC / MCP conventions.
 *
 * Format:
 *   { "success": false, "error": { "code": <number>, "message": <string>, "data": { ... } } }
 *
 * Error codes follow JSON-RPC reserved range convention:
 *   -32602  Invalid params (bad --tx spec, missing required fields)
 *   -32001  Insufficient balance
 *   -32002  Account not ready (not initialized, not deployed)
 *   -32003  Sponsorship failed
 *   -32004  Build / estimation failed
 *   -32005  Sign / send failed
 *   -32006  Execution reverted (UserOp included but reverted on-chain)
 *   -32000  Unknown / internal error
 */
export interface TxErrorPayload {
  code: number;
  message: string;
  data?: Record<string, unknown>;
}

export function txError(payload: TxErrorPayload): void {
  const output = {
    success: false,
    error: {
      code: payload.code,
      message: payload.message,
      ...(payload.data && Object.keys(payload.data).length > 0 ? { data: payload.data } : {}),
    },
  };
  console.error(chalk.red(JSON.stringify(output, null, 2)));
}

export function table(rows: Record<string, string>[], columns: { key: string; label: string; width?: number }[]): void {
  // Header
  const header = columns.map((c) => c.label.padEnd(c.width ?? 20)).join('  ');
  console.log(chalk.bold(header));
  console.log(chalk.gray('─'.repeat(header.length)));

  // Rows
  for (const row of rows) {
    const line = columns.map((c) => (row[c.key] ?? '').padEnd(c.width ?? 20)).join('  ');
    console.log(line);
  }
}

export function address(addr: string): string {
  if (addr.length <= 14) return addr;
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
}
