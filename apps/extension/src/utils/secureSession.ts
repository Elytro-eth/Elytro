class SecureSessionManager {
  private sessionKey: CryptoKey | null = null;
  private sessionSalt: string | null = null;
  private sessionExpiry: number | null = null;
  private readonly SESSION_DURATION = 15 * 60 * 1000; // 15分钟会话

  async createSession(password: string, salt: string): Promise<void> {
    try {
      const key = await this.deriveKey(salt, password);
      this.sessionKey = key;
      this.sessionSalt = salt;
      this.sessionExpiry = Date.now() + this.SESSION_DURATION;
    } catch {
      throw new Error('Invalid password');
    }
  }

  isSessionValid(): boolean {
    if (!this.sessionKey || !this.sessionExpiry) {
      return false;
    }
    return Date.now() < this.sessionExpiry;
  }

  getSessionKey(): CryptoKey | null {
    if (this.isSessionValid()) {
      return this.sessionKey;
    }
    return null;
  }

  getSessionSalt(): string | null {
    if (this.isSessionValid()) {
      return this.sessionSalt;
    }
    return null;
  }

  clearSession(): void {
    this.sessionKey = null;
    this.sessionSalt = null;
    this.sessionExpiry = null;
  }

  getRemainingTime(): number {
    if (!this.sessionExpiry) return 0;
    return Math.max(0, Math.floor((this.sessionExpiry - Date.now()) / 1000));
  }

  private async deriveKey(salt: string, password: string): Promise<CryptoKey> {
    const key = await globalThis.crypto.subtle.importKey(
      'raw',
      Buffer.from(password, 'utf-8'),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: Buffer.from(salt, 'base64'),
        iterations: 100_000,
        hash: 'SHA-256',
      },
      key,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }
}

export const secureSession = new SecureSessionManager();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    secureSession.clearSession();
  });
}
