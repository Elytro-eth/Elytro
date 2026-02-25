import { webcrypto } from 'node:crypto';
import { readFile, writeFile, stat, chmod } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Device key management.
 *
 * A 256-bit random key stored as raw binary at ~/.elytro/.device-key.
 * Replaces user password for routine vault encryption/decryption.
 * File permissions are set to 600 (owner-only read/write).
 */

const DEVICE_KEY_FILE = '.device-key';
const KEY_LENGTH = 32; // 256 bits
const REQUIRED_MODE = 0o600;

/** Generate a cryptographically secure 256-bit device key. */
export function generateDeviceKey(): Uint8Array {
  return webcrypto.getRandomValues(new Uint8Array(KEY_LENGTH));
}

/** Write device key to disk with chmod 600. */
export async function saveDeviceKey(dataDir: string, key: Uint8Array): Promise<void> {
  validateDeviceKey(key);
  const path = keyPath(dataDir);
  await writeFile(path, key, { mode: REQUIRED_MODE });
  // Explicitly chmod in case umask overrode the mode
  await chmod(path, REQUIRED_MODE);
}

/** Load device key from disk. Returns null if file doesn't exist. */
export async function loadDeviceKey(dataDir: string): Promise<Uint8Array | null> {
  const path = keyPath(dataDir);
  try {
    // Verify file permissions before reading
    const st = await stat(path);
    const mode = st.mode & 0o777;
    if (mode !== REQUIRED_MODE) {
      throw new Error(
        `Device key has insecure permissions (${modeStr(mode)}). ` + `Expected 600. Fix with: chmod 600 ${path}`
      );
    }

    const buf = await readFile(path);
    const key = new Uint8Array(buf);
    validateDeviceKey(key);
    return key;
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw err;
  }
}

/** Check if a device key file exists. */
export async function deviceKeyExists(dataDir: string): Promise<boolean> {
  const path = keyPath(dataDir);
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

/** Validate key length. */
export function validateDeviceKey(key: Uint8Array): void {
  if (key.length !== KEY_LENGTH) {
    throw new Error(`Invalid device key: expected ${KEY_LENGTH} bytes, got ${key.length}.`);
  }
}

function keyPath(dataDir: string): string {
  return join(dataDir, DEVICE_KEY_FILE);
}

function modeStr(mode: number): string {
  return '0o' + mode.toString(8).padStart(3, '0');
}
