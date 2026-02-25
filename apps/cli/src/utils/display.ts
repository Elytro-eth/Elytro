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
