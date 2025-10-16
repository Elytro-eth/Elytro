import { Buffer } from 'buffer';
import { secureSession } from './secureSession';

const DEFAULT_ALGORITHM = 'PBKDF2';
const DERIVED_KEY_FORMAT = 'AES-GCM';
const STRING_ENCODING = 'utf-8';
const BUFFER_ENCODING = 'base64';
const ITERATIONS = 100_000;

export type TPasswordEncryptedData = {
  data: string;
  iv: string;
  salt: string;
};

function generateSalt(size = 32) {
  const randomBytes = new Uint8Array(size);
  return crypto.getRandomValues(new Uint8Array(randomBytes));
}

function getBase64Salt(salt: Uint8Array) {
  return Buffer.from(salt).toString(BUFFER_ENCODING);
}

const deriveCryptoKey = async (base64salt: string, password: string): Promise<CryptoKey> => {
  if (!password) {
    throw new Error('Password is required for key derivation');
  }

  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    Buffer.from(password, STRING_ENCODING),
    { name: DEFAULT_ALGORITHM },
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: DEFAULT_ALGORITHM,
      salt: Buffer.from(base64salt, 'base64'),
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    key,
    { name: DERIVED_KEY_FORMAT, length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  return derivedKey;
};

async function encryptWithKey<T>(key: CryptoKey, data: T) {
  const dataString = JSON.stringify(data);
  const dataBuffer = Buffer.from(dataString, STRING_ENCODING);
  const iv = generateSalt(16);

  const encrypted = await crypto.subtle.encrypt(
    {
      name: DERIVED_KEY_FORMAT,
      iv,
    },
    key,
    dataBuffer
  );

  return {
    data: Buffer.from(new Uint8Array(encrypted)).toString(BUFFER_ENCODING),
    iv: Buffer.from(iv).toString(BUFFER_ENCODING),
  };
}

export async function encrypt<T>(data: T, password?: string): Promise<TPasswordEncryptedData> {
  if (!password && secureSession.isSessionValid()) {
    const sessionKey = secureSession.getSessionKey();
    const sessionSalt = secureSession.getSessionSalt();
    if (sessionKey && sessionSalt) {
      const encryptedData = await encryptWithKey(sessionKey, data);
      return { ...encryptedData, salt: sessionSalt };
    }
  }

  if (!password) {
    throw new Error('Password is required for encryption');
  }

  const salt = getBase64Salt(generateSalt());
  const key = await deriveCryptoKey(salt, password);

  await secureSession.createSession(password, salt);

  const encryptedData = await encryptWithKey(key, data);
  return { ...encryptedData, salt };
}

async function decryptWithKey<T>(
  key: CryptoKey,
  data: {
    data: string;
    iv: string;
  }
): Promise<T> {
  const dataBuffer = Buffer.from(data.data, BUFFER_ENCODING);
  const ivBuffer = Buffer.from(data.iv, BUFFER_ENCODING);

  try {
    const decryptedRes = await crypto.subtle.decrypt(
      {
        name: DERIVED_KEY_FORMAT,
        iv: ivBuffer,
      },
      key,
      dataBuffer
    );

    const decryptedData = new Uint8Array(decryptedRes);
    const decryptedStr = Buffer.from(decryptedData).toString(STRING_ENCODING);
    return JSON.parse(decryptedStr);
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function decrypt<T>(payload: TPasswordEncryptedData, password?: string): Promise<T> {
  const { salt } = payload;

  if (!password && secureSession.isSessionValid()) {
    const sessionKey = secureSession.getSessionKey();
    if (sessionKey) {
      try {
        return await decryptWithKey<T>(sessionKey, payload);
      } catch {
        secureSession.clearSession();
        throw new Error('Session expired or invalid. Please provide password.');
      }
    }
  }

  if (!password) {
    throw new Error('Password is required for decryption');
  }

  const key = await deriveCryptoKey(salt, password);

  await secureSession.createSession(password, salt);

  return await decryptWithKey<T>(key, payload);
}
