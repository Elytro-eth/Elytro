'use strict';
// reference: https://github.com/jayden-sudo/RS256/blob/main/dev/RS256_v1.ts

import { webcrypto } from './webCrypto.js';

export class RS256 {
  private static modexp(
    base: bigint,
    exponent: bigint,
    modulus: bigint
  ): bigint {
    if (modulus === BigInt(1)) return BigInt(0);
    let result = BigInt(1);
    base = base % modulus;
    if (base === BigInt(0)) return BigInt(0);
    while (exponent > BigInt(0)) {
      if (exponent % BigInt(2) === BigInt(1)) {
        result = (result * base) % modulus;
      }
      exponent = exponent >> BigInt(1);
      base = (base * base) % modulus;
    }
    return result;
  }

  private static toHexString(_bigint: bigint): string {
    const _hex = _bigint.toString(16);
    // padding to even length
    return _hex.length % 2 ? '0' + _hex : _hex;
  }

  private static hexToUint8Array(hex: string): Uint8Array {
    if (hex.startsWith('0x')) hex = hex.slice(2);
    let len = hex.length;
    if (len % 2 !== 0) {
      len++;
      hex = '0' + hex;
    }
    const uint8Array = new Uint8Array(len / 2);
    for (let i = 0; i < len; i += 2) {
      uint8Array[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return uint8Array;
  }

  private static arrayBufferToHex(uint8Array: Uint8Array) {
    return (
      '0x' +
      Array.from(uint8Array)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
    );
  }

  private static async sha256(m: bigint): Promise<string> {
    const _hash = await webcrypto.subtle.digest(
      'SHA-256',
      this.hexToUint8Array(m.toString(16))
    );
    return this.arrayBufferToHex(new Uint8Array(_hash));
  }

  /**
   *
   *
   * @param {bigint} n (n, e) RSA public key
   * @param {bigint} e (n, e) RSA public key
   * @param {bigint} s s signature representative, an integer between 0 and n - 1
   * @return {*}  {bigint} m message representative, an integer between 0 and n - 1
   */
  private static RSAVP1(n: bigint, e: bigint, s: bigint): bigint {
    /*
            Steps:
     
            1.  If the signature representative s is not between 0 and n - 1,
                output "signature representative out of range" and stop.
     
            2.  Let m = s^e mod n.
     
            3.  Output m.
        */
    if (s < BigInt(0) || s > n - BigInt(1)) {
      console.log('signature representative out of range');
      throw new Error('signature representative out of range');
    }
    const m = this.modexp(s, e, n);
    return m;
  }

  /**
   * This encoding method is deterministic and only has an encoding operation.
   *
   * @param {string} M message whose signature is to be verified, an octet string
   * @param {bigint} emLen intended length in octets of the encoded message,
   * at least tLen + 11, where tLen is the octet length of the Distinguished
   * Encoding Rules (DER) encoding T of a certain value computed during the encoding operation.
   * @return {*}  {bigint} encoded message, an octet string of length emLen
   */
  private static async EMSA_PKCS1_v1_5_ENCODE(
    M: bigint,
    emLen: bigint
  ): Promise<bigint> {
    /*  
            1.  Encode the algorithm ID for the hash function and the hash
                value into an ASN.1 value of type DigestInfo (see
                Appendix A.2.4) with the DER, where the type DigestInfo has
                the syntax
     
                    DigestInfo ::= SEQUENCE {
                        digestAlgorithm AlgorithmIdentifier,
                        digest OCTET STRING
                    }
     
                The first field identifies the hash function and the second
                contains the hash value.  Let T be the DER encoding of the
                DigestInfo value (see the notes below), and let tLen be the
                length in octets of T.
     
            2.  If emLen < tLen + 11, output "intended encoded message length
                too short" and stop.
     
            3.  Generate an octet string PS consisting of emLen - tLen - 3
                octets with hexadecimal value 0xff.  The length of PS will be
                at least 8 octets.
     
            4.  Concatenate PS, the DER encoding T, and other padding to form
                the encoded message EM as
     
                    EM = 0x00 || 0x01 || PS || 0x00 || T.
     
            5.  Output EM.
     
            SHA-256: (0x)30 31 30 0d 06 09 60 86 48 01 65 03 04 02 01 05 00 04 20 || H.
        */

    // sha256 Algorithm Identifier Der
    const T_DER = '3031300d060960864801650304020105000420';
    const H = (await this.sha256(M)).slice(2);
    const T = T_DER + H;
    const tLen = BigInt(T.length / 2); // 51 (sha256)
    if (emLen < tLen + BigInt(11)) {
      throw new Error('intended encoded message length too short');
    }

    let PS_ByteLen = emLen - tLen - BigInt(3);
    if (PS_ByteLen < BigInt(8)) {
      PS_ByteLen = BigInt(8);
    }
    const PS = 'ff'.repeat(Number(PS_ByteLen));

    const EM = BigInt('0x0001' + PS + '00' + T);

    return EM;
  }

  /**
   * refer: https://datatracker.ietf.org/doc/html/rfc8017#section-8.2.2
   *
   * @param {*} n (n, e)  signer's RSA public key
   * @param {*} e (n, e)  signer's RSA public key
   * @param {*} M message whose signature is to be verified, an octet string
   * @param {*} S signature to be verified, an octet string of length k, where k is the length in octets of the RSA modulus n
   */
  public static async RSASSA_PKCS1_V1_5_VERIFY(
    n: bigint,
    e: bigint,
    M: bigint,
    S: bigint
  ): Promise<boolean> {
    // 1. Length checking: If the length of S is not k octets, output "invalid signature" and stop.
    const k = this.toHexString(n).length / 2;

    if (this.toHexString(S).length / 2 !== k) {
      console.log('invalid signature');
      return false;
    }
    // 2. RSA verification:
    /* 
            a.  Convert the signature S to an integer signature representative s (see Section 4.2):
                s = OS2IP (S).
        */

    /* 
            b.  Apply the RSAVP1 verification primitive (Section 5.2.2) to
                the RSA public key (n, e) and the signature representative
                s to produce an integer message representative m:
                m = RSAVP1 ((n, e), s).
                If RSAVP1 outputs "signature representative out of range",output "invalid signature" and stop.
        */
    const m = this.RSAVP1(n, e, S);

    /*
            c.  Convert the message representative m to an encoded message
                  EM of length k octets (see Section 4.1):
                     EM = I2OSP (m, k).
        */

    const EM = m; //  m = I2OSP(m, k);

    /*
            3.  EMSA-PKCS1-v1_5 encoding: Apply the EMSA-PKCS1-v1_5 encoding
              operation (Section 9.2) to the message M to produce a second
              encoded message EM' of length k octets:
     
                 EM' = EMSA-PKCS1-V1_5-ENCODE (M, k).
     
              If the encoding operation outputs "message too long", output
              "message too long" and stop.  If the encoding operation
              outputs "intended encoded message length too short", output
              "RSA modulus too short" and stop.
        */
    const EM_ = await this.EMSA_PKCS1_v1_5_ENCODE(M, BigInt(k));

    /* 
             4.  Compare the encoded message EM and the second encoded message
              EM'.  If they are the same, output "valid signature";
              otherwise, output "invalid signature".
        */

    if (EM === EM_) {
      return true;
    } else {
      throw new Error('invalid signature');
    }
  }
}
