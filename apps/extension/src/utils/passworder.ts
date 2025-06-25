import { Buffer } from 'buffer';
import { sessionStorage } from './storage/session';

const DEFAULT_ALGORITHM = 'PBKDF2';
const DERIVED_KEY_FORMAT = 'AES-GCM';
const STRING_ENCODING = 'utf-8';
const BUFFER_ENCODING = 'base64';
const ITERATIONS = 10_000;

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

const getCryptoKeyWithBackup = async (base64salt: string, password?: string) => {
  if (password) {
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

    sessionStorage.save({
      storedCryptoKey: await crypto.subtle.exportKey('jwk', derivedKey),
      storedSaltBase64: base64salt,
    });

    return derivedKey;
  } else {
    const { storedCryptoKey, storedSaltBase64 } = (await sessionStorage.get([
      'storedCryptoKey',
      'storedSaltBase64',
    ])) as { storedCryptoKey: JsonWebKey; storedSaltBase64: string };

    if (!storedCryptoKey || !storedSaltBase64) {
      throw new Error('locked');
    }
    return await crypto.subtle.importKey('jwk', storedCryptoKey, { name: DERIVED_KEY_FORMAT, length: 256 }, false, [
      'encrypt',
      'decrypt',
    ]);
  }
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

export async function encrypt<T>(data: T, password?: string) {
  if (password) {
    const salt = getBase64Salt(generateSalt());
    const key = await getCryptoKeyWithBackup(salt, password);
    const encryptedData = await encryptWithKey(key, data);
    return { ...encryptedData, salt };
  }

  const { storedCryptoKey, storedSaltBase64 } = (await sessionStorage.get(['storedCryptoKey', 'storedSaltBase64'])) as {
    storedCryptoKey: JsonWebKey;
    storedSaltBase64: string;
  };

  if (!storedCryptoKey || !storedSaltBase64) {
    throw new Error('Cannot encrypt without a password or a cached key.');
  }

  const key = await crypto.subtle.importKey('jwk', storedCryptoKey, { name: DERIVED_KEY_FORMAT }, false, ['encrypt']);
  const encryptedData = await encryptWithKey(key, data);

  return { ...encryptedData, salt: storedSaltBase64 };
}

async function decryptWithKey(
  key: CryptoKey,
  data: {
    data: string;
    iv: string;
  }
) {
  const dataBuffer = Buffer.from(data.data, BUFFER_ENCODING);
  const saltBuffer = Buffer.from(data.iv, BUFFER_ENCODING);

  try {
    const decryptedRes = await crypto.subtle.decrypt(
      {
        name: DERIVED_KEY_FORMAT,
        iv: saltBuffer,
      },
      key,
      dataBuffer
    );

    const decryptedData = new Uint8Array(decryptedRes);
    const decryptedStr = Buffer.from(decryptedData).toString(STRING_ENCODING);
    return JSON.parse(decryptedStr);
  } catch (error) {
    throw new Error(`Elytro: Wrong password! ${error}`);
  }
}

export async function decrypt<T>(payload: TPasswordEncryptedData, password?: string): Promise<T> {
  const { salt } = payload;
  const key = await getCryptoKeyWithBackup(salt, password);
  const result = await decryptWithKey(key, payload);
  return result as T;
}
