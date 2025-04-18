import { ethers } from 'ethers';
import { TypeGuard } from './typeGuard.js';
import { P256Lib } from './p256lib.js';
import { Hex } from './hex.js';
import { Base64Url } from './base64Url.js';
// import { webcrypto } from './webCrypto.js';
export interface ECCPoint {
  /**
   * Hex string of x coordinate
   *
   * @type {string}
   * @memberof ECCPoint
   */
  x: string;
  /**
   * Hex string of y coordinate
   *
   * @type {string}
   * @memberof ECCPoint
   */
  y: string;
}

export interface RSAPublicKey {
  /**
   * Hex string of public exponent
   *
   * @type {string}
   * @memberof RSAPublicKey
   */
  e: string;

  /**
   * Hex string of public key
   *
   * @type {string}
   * @memberof RSAPublicKey
   */
  n: string;
}

export class WebAuthN {
  /**
   * calculate the key hash
   *
   * @static
   * @param {ECCPoint} p256Key
   * @return {*}  {string}
   */
  private static p256PublicKeyToKeyhash(p256Key: ECCPoint): string {
    if (TypeGuard.onlyBytes32(p256Key.x).isErr() === true) {
      throw new Error(`invalid key.x: ${p256Key.x}`);
    }
    if (TypeGuard.onlyBytes32(p256Key.y).isErr() === true) {
      throw new Error(`invalid key.y: ${p256Key.y}`);
    }
    // keccak256(abi.encodePacked(uint256 Qx,uint256 Qy));
    const _key = ethers.keccak256(
      ethers.solidityPacked(['uint256', 'uint256'], [p256Key.x, p256Key.y])
    );
    return _key;
  }

  /**
   * calculate the key hash
   *
   * @static
   * @param {RSAPublicKey} rs256Key
   * @return {*}  {string}
   */
  private static rs256PublicKeyToKeyhash(rs256Key: RSAPublicKey): string {
    if (TypeGuard.onlyHex(rs256Key.e).isErr() === true) {
      throw new Error('invalid publicKey.e');
    } else {
      if (BigInt(rs256Key.e) !== BigInt(65537)) {
        throw new Error('e!=65537 is not supported yet');
      }
    }
    if (TypeGuard.onlyHex(rs256Key.n).isErr() === true) {
      throw new Error('invalid publicKey.n');
    } else {
      if ((rs256Key.n.length - 2) % 64 !== 0) {
        throw new Error('invalid publicKey.n length');
      }
    }
    // bytes memory e = hex"0000000000000000000000000000000000000000000000000000000000010001";
    // expected = keccak256(abi.encodePacked(e, n));
    const _key = ethers.keccak256(
      ethers.solidityPacked(
        ['bytes', 'bytes'],
        [
          '0x0000000000000000000000000000000000000000000000000000000000010001',
          rs256Key.n,
        ]
      )
    );
    return _key;
  }

  /**
   * public key to Keyhash
   *
   * @static
   * @param {(ECCPoint | RSAPublicKey)} publicKey
   * @return {*}  {string}
   * @memberof P256
   */
  public static publicKeyToKeyhash(publicKey: ECCPoint | RSAPublicKey): string {
    if (
      typeof publicKey === 'object' &&
      Object.prototype.hasOwnProperty.call(publicKey, 'x') &&
      Object.prototype.hasOwnProperty.call(publicKey, 'y')
    ) {
      // ES256
      const es256Key = publicKey as ECCPoint;
      return WebAuthN.p256PublicKeyToKeyhash(es256Key);
    } else if (
      typeof publicKey === 'object' &&
      Object.prototype.hasOwnProperty.call(publicKey, 'e') &&
      Object.prototype.hasOwnProperty.call(publicKey, 'n')
    ) {
      // RS256
      const rs256Key = publicKey as RSAPublicKey;
      return WebAuthN.rs256PublicKeyToKeyhash(rs256Key);
    } else {
      throw new Error('invalid publicKey');
    }
  }

  /**
   *
   *
   * @static
   * @param {string} r r
   * @param {string} s s
   * @param {string} message userOp hash
   * @param {string} authenticatorData hex string of authenticatorData
   * @param {string} clientDataSuffix clientDataSuffix string
   * @param {string} [clientDataPrefix='{"type":"webauthn.get","challenge":"'] clientDataPrefix
   * @return {*}  {{
   *             0: ECCPoint,
   *             1: ECCPoint
   *         }}
   * @memberof WebAuthN
   */
  public static recoverWebAuthN(
    message: string,
    r: string,
    s: string,
    authenticatorData: string,
    clientDataSuffix: string,
    clientDataPrefix?: string
  ): {
    0: ECCPoint;
    1: ECCPoint;
  } {
    if (typeof clientDataPrefix === 'undefined') {
      clientDataPrefix = '{"type":"webauthn.get","challenge":"';
    }
    if (TypeGuard.onlyBytes32(message).isErr() === true) {
      throw new Error(`invalid message.x: ${message}`);
    }
    const messageBase64Url = Base64Url.bytes32Tobase64Url(message);
    const clientDataJSON: string =
      clientDataPrefix + messageBase64Url + clientDataSuffix;
    // check clientDataJSON is valid JSON
    JSON.parse(clientDataJSON);
    let clientDataJSONHash: string = ethers.sha256(
      ethers.toUtf8Bytes(clientDataJSON)
    );
    if (authenticatorData.startsWith('0x'))
      authenticatorData = authenticatorData.slice(2);
    if (clientDataJSONHash.startsWith('0x'))
      clientDataJSONHash = clientDataJSONHash.slice(2);
    const _message = ethers.sha256(
      '0x' + authenticatorData + clientDataJSONHash
    );
    return WebAuthN.recover(_message, r, s);
  }

  /**
   *
   *
   * @static
   * @param {string} r r
   * @param {string} s s
   * @param {string} message userOp hash
   * @param {string} authenticatorData hex string of authenticatorData
   * @param {string} clientDataSuffix clientDataSuffix string
   * @param {string} [clientDataPrefix='{"type":"webauthn.get","challenge":"'] clientDataPrefix
   * @return {*}  {{
   *             0: string,
   *             1: string
   *         }}
   * @memberof WebAuthN
   */
  public static recoverWebAuthNPublicKey(
    message: string,
    r: string,
    s: string,
    authenticatorData: string,
    clientDataSuffix: string,
    clientDataPrefix?: string
  ): {
    0: string;
    1: string;
  } {
    const p = WebAuthN.recoverWebAuthN(
      message,
      r,
      s,
      authenticatorData,
      clientDataSuffix,
      clientDataPrefix
    );
    return {
      0: WebAuthN.publicKeyToKeyhash(p[0]),
      1: WebAuthN.publicKeyToKeyhash(p[1]),
    };
  }

  /**
   *
   *
   * @static
   * @param {string} rawMessage
   * @param {string} r
   * @param {string} s
   * @return {*}  {{
   *         0: ECCPoint,
   *         1: ECCPoint
   *     }}
   * @memberof P256
   */
  public static recover(
    rawMessage: string,
    r: string,
    s: string
  ): {
    0: ECCPoint;
    1: ECCPoint;
  } {
    if (TypeGuard.onlyBytes32(rawMessage).isErr() === true) {
      throw new Error(`invalid message.x: ${rawMessage}`);
    }
    if (TypeGuard.onlyBytes32(r).isErr() === true) {
      throw new Error(`invalid r: ${r}`);
    }
    if (TypeGuard.onlyBytes32(s).isErr() === true) {
      throw new Error(`invalid s: ${s}`);
    }
    const _message = BigInt(rawMessage);
    const _r = BigInt(r);
    const _s = BigInt(s);
    const p = {
      0: { x: ethers.ZeroHash, y: ethers.ZeroHash },
      1: { x: ethers.ZeroHash, y: ethers.ZeroHash },
    };
    try {
      const p1 = P256Lib.ec_recover_r1(_message, BigInt(27), _r, _s);
      p[0].x = Hex.paddingZero(p1.x, 32);
      p[0].y = Hex.paddingZero(p1.y, 32);
    } catch (e) {
      console.log(e);
    }

    try {
      const p2 = P256Lib.ec_recover_r1(_message, BigInt(28), _r, _s);
      p[1].x = Hex.paddingZero(p2.x, 32);
      p[1].y = Hex.paddingZero(p2.y, 32);
    } catch (e) {
      console.log(e);
    }

    return p;
  }
}
