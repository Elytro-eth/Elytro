declare global {
  interface Window {
    crypto: Crypto;
  }
}
export const webcrypto: Crypto = window.crypto;
