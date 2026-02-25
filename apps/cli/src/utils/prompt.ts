import { password, confirm, select, input } from '@inquirer/prompts';

/**
 * Interactive prompt wrappers.
 *
 * These replace the extension's ApprovalService UI popups.
 * Every destructive / on-chain action goes through a prompt.
 */

export async function askPassword(message = 'Enter password'): Promise<string> {
  return password({ message, mask: '*' });
}

export async function askNewPassword(): Promise<string> {
  const pwd = await password({ message: 'Set a password', mask: '*' });
  const confirm_ = await password({
    message: 'Confirm password',
    mask: '*',
  });
  if (pwd !== confirm_) {
    throw new Error('Passwords do not match.');
  }
  return pwd;
}

export async function askConfirm(message: string, defaultValue = false): Promise<boolean> {
  return confirm({ message, default: defaultValue });
}

export async function askSelect<T extends string>(message: string, choices: { name: string; value: T }[]): Promise<T> {
  return select({ message, choices });
}

export async function askInput(message: string, defaultValue?: string): Promise<string> {
  return input({ message, default: defaultValue });
}
