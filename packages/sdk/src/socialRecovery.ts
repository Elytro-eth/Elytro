import {
  GuardianSignature,
  ISocialRecovery,
} from './interface/ISocialRecovery.js';
import { TypeGuard } from './tools/typeGuard.js';
import { TypedDataDomain, TypedDataField, ethers } from 'ethers';
import { Hex } from './tools/hex.js';
import { Ok, Result } from '@elytro/result';
// import { bigIntToNumber } from './tools/convert.js';
import { InitialKey } from './interface/IElytroWallet.js';
import { ECCPoint, RSAPublicKey, WebAuthN } from './tools/webauthn.js';
import { Signature } from './tools/signature.js';

export class SocialRecovery implements ISocialRecovery {
  static readonly days = 86400;
  static readonly defalutInitialGuardianSafePeriod = 2 * SocialRecovery.days;

  static initialKeysToAddress(initialKeys: InitialKey[]): string[] {
    if (initialKeys.length === 0) {
      throw new Error('initialKeys is empty');
    }

    const _initialKeys: string[] = [];
    for (const oneKey of initialKeys) {
      if (typeof oneKey === 'string') {
        if (TypeGuard.onlyAddress(oneKey).isOk() === true) {
          _initialKeys.push(Hex.paddingZero(oneKey, 32));
        } else if (TypeGuard.onlyBytes32(oneKey).isOk() === true) {
          _initialKeys.push(oneKey);
        } else {
          throw new Error(`invalid key: ${oneKey}`);
        }
      } else {
        _initialKeys.push(WebAuthN.publicKeyToKeyhash(oneKey));
      }
    }
    _initialKeys.sort((a, b) => {
      const aBig = BigInt(a);
      const bBig = BigInt(b);
      if (aBig === bBig) {
        throw new Error(`guardian address is duplicated: ${a}`);
      } else if (aBig < bBig) {
        return -1;
      } else {
        return 1;
      }
    });
    return _initialKeys;
  }

  /**
   * calculate the key hash
   *
   * @static
   * @param {string[]} keys result of initialKeysToAddress
   * @return {*}  {string} bytes32
   * @memberof SocialRecovery
   */
  static getKeyHash(keys: string[]): string {
    for (const oneKey of keys) {
      if (TypeGuard.onlyBytes32(oneKey).isErr() === true) {
        throw new Error(`invalid key: ${oneKey}`);
      }
    }
    return ethers.keccak256(
      new ethers.AbiCoder().encode(['bytes32[]'], [keys])
    );
  }

  /**
   * pack guardian info into bytes
   *
   * @param {string[]} guardians EOA/Smart contract address array (auto sort)
   * @param {number} threshold
   * @param {string} salt hex string (bytes32),default is 0
   * @return {*}  {string} keccak256 hash of the guardian set
   * @memberof SocialRecovery
   */
  static getGuardianBytes(
    guardians: string[],
    threshold: number,
    salt: string = ethers.ZeroHash
  ): string {
    if (guardians.length === 0) {
      return '0x';
    }

    /* 
        (address[] memory guardians, uint256 threshold, uint256 salt) =
            abi.decode(rawGuardian, (address[], uint256, uint256));
        */
    // deep copy guardians,to avoid sort the original array
    guardians = [...guardians];
    guardians.sort((a, b) => {
      {
        const ret = TypeGuard.onlyAddress(a);
        if (ret.isErr() === true) {
          throw new Error(ret.ERR);
        }
      }

      const aBig = BigInt(a);
      const bBig = BigInt(b);
      if (aBig === bBig) {
        throw new Error(`guardian address is duplicated: ${a}`);
      } else if (aBig < bBig) {
        return -1;
      } else {
        return 1;
      }
    });
    const ret = TypeGuard.onlyBytes32(salt);
    if (ret.isErr() === true) {
      throw new Error(ret.ERR);
    }

    const abiEncoded = new ethers.AbiCoder().encode(
      ['address[]', 'uint256', 'uint256'],
      [guardians, threshold, salt]
    );
    return abiEncoded;
  }

  /**
   * calculate the guardian hash
   *
   * @abstract
   * @param {string[]} guardians EOA/Smart contract address array (auto sort)
   * @param {number} threshold
   * @param {string} salt hex string (bytes32),default is 0
   * @return {*}  {string} keccak256 hash of the guardian set
   * @memberof SocialRecovery
   */
  static calcGuardianHash(
    guardians: string[],
    threshold: number,
    salt: string = ethers.ZeroHash
  ): string {
    if (guardians.length === 0) {
      return ethers.ZeroHash;
    }

    const abiEncoded = SocialRecovery.getGuardianBytes(
      guardians,
      threshold,
      salt
    );
    const keccak256 = ethers.keccak256(abiEncoded);
    return keccak256;
  }

  /**
   * pack guardian signatures into `guardianSignature` bytes
   *
   * @static
   * @param {GuardianSignature[]} guardianSignature
   * @return {*}  {string}
   * @memberof SocialRecovery
   */
  static packGuardianSignature(guardianSignature: GuardianSignature[]): string {
    // deep copy guardianSignature,to avoid sort the original array
    guardianSignature = [...guardianSignature];
    guardianSignature.sort((a, b) => {
      const aBig = BigInt(a.address);
      const bBig = BigInt(b.address);
      if (aBig === bBig) {
        throw new Error(`guardian address is duplicated: ${a}`);
      } else if (aBig < bBig) {
        return -1;
      } else {
        return 1;
      }
    });
    const signs: string[] = [];

    let skipTimes = 0;

    for (let index = 0; index < guardianSignature.length; index++) {
      /*  
           one signature structure:
            ┌──────────┬──────────────┬──────────┬────────────────┐
            │          │              │          │                │
            │    v     │       s      │   r      │  dynamic data  │
            │  bytes1  │bytes4|bytes32│  bytes32 │     dynamic    │
            │  (must)  │  (optional)  │(optional)│   (optional)   │
            └──────────┴──────────────┴──────────┴────────────────┘ 
            */
      let oneSign = '';
      const guardianSign = guardianSignature[index];
      if (guardianSign.signatureType === 3) {
        //3:No signature provided
        skipTimes++;
      } else {
        if (skipTimes > 0) {
          /* 
                        v = 2
                            skip
                            s: bytes4 skip times
                            r: no set
                    */
          oneSign = '02';
          oneSign += Hex.paddingZero(skipTimes - 1, 4).slice(2);
          signs.push(oneSign);
          skipTimes = 0;
        }
        let signature = guardianSign.signature ?? '';
        if (signature.startsWith('0x')) {
          signature = signature.slice(2);
        }
        if (signature.length % 2 !== 0) {
          throw new Error('signature invalid');
        }
        const signatureLen = signature.length / 2;
        switch (guardianSign.signatureType) {
          case 0: //0:EIP-1271 signature
            /*
                            v = 0
                                EIP-1271 signature
                                s: bytes4 Length of signature data 
                                r: no set
                                dynamic data: signature data
                         */
            oneSign = '00';
            oneSign += Hex.paddingZero(signatureLen, 4).slice(2);
            oneSign += signature;
            break;
          case 1: //1:approved onchain before
            /* 
                           v = 1
                               approved hash
                               r: no set
                               s: no set
                        */
            oneSign = '01';
            break;
          case 2: {
            //2:EOA signature
            /* 
                            v > 2
                                EOA signature
                        */
            // r, s, v => v, s, r
             
            const r = signature.slice(0, 64);
            const s = signature.slice(64, 128);
            const v = signature.slice(128, 130);
            oneSign = v + s + r;
            break;
          }
          default:
            throw new Error('unknown signatureType');
        }
        signs.push(oneSign);
      }
    }

    if (skipTimes > 0) {
      /* 
                v = 2
                    skip
                    s: bytes4 skip times
                    r: no set
            */
      let oneSign = '02';
      oneSign += Hex.paddingZero(skipTimes - 1, 4).slice(2);
      signs.push(oneSign);
      skipTimes = 0;
    }

    return '0x' + signs.join('');
  }

  static addressToBytes32(address: string): string {
    if (TypeGuard.onlyBytes32(address).isOk() === true) {
      return address;
    }
    TypeGuard.onlyAddress(address);
    return Hex.paddingZero(address, 32);
  }

  /**
   * Get EIP-712 typed data for social recovery
   *
   * @static
   * @param {number} chainId chainId
   * @param {string} socialRecoveryContract socialRecoveryContract address
   * @param {string} walletAddress wallet address
   * @param {number} nonce uint256 nonce
   * @param {string[]} newOwner Interact Arg (Hex string):
   *
   * TYPE_HASH_SOCIAL_RECOVERY: "newOwner":"bytes32[]".
   *
   *
   * @return {*}  {{
   *         domain: TypedDataDomain,
   *         types: Record<string, Array<TypedDataField>>,
   *         value: Record<string, any>,
   *         typedMessage: string
   *     }}
   * @memberof socialRecovery
   */
  static getSocialRecoveryTypedData(
    chainId: number,
    socialRecoveryContract: string,
    walletAddress: string,
    nonce: number,
    newOwners: string[]
  ): {
    domain: TypedDataDomain;
    types: Record<string, Array<TypedDataField>>;
    primaryType: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    message: Record<string, any>;
    typedMessage: string;
  } {
    if (TypeGuard.onlyAddress(walletAddress).isErr() === true)
      throw new Error('walletAddress is invalid');
    if (newOwners.length === 0) {
      throw new Error('newOwner is empty');
    }
    const _newOwner: string[] = [];
    for (let i = 0; i < newOwners.length; i++) {
      _newOwner.push(SocialRecovery.addressToBytes32(newOwners[i]));
    }

    const domain: TypedDataDomain = {
      name: 'SocialRecovery',
      version: '1',
      chainId: chainId.toString(),
      verifyingContract: ethers.getAddress(socialRecoveryContract),
    };

    // keccak256("SocialRecovery(address wallet,uint256 nonce,bytes32[] newOwners)");
    const types: Record<string, Array<TypedDataField>> = {
      SocialRecovery: [
        { name: 'wallet', type: 'address' },
        { name: 'nonce', type: 'uint256' },
        { name: 'newOwners', type: 'bytes32[]' },
      ],
    };
    const primaryType = 'SocialRecovery';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value: Record<string, any> = {
      wallet: walletAddress,
      nonce: nonce,
      newOwners: _newOwner,
    };
    const typedMessage = ethers.TypedDataEncoder.hash(domain, types, value);

    return {
      domain,
      types,
      message: value,
      primaryType,
      typedMessage,
    };
  }

  /**
   * pack SocialRecovery signature (EOA)
   *
   * @param {string} signature EOA signature
   * @return {*}  {Promise<Result<string, Error>>}
   */
  private async packSocialRecoveryEOASignature(
    signature: string
  ): Promise<Result<string, Error>> {
    let sign = Signature.packEOASignature(
      '0x0000000000000000000000000000000000000000',
      signature,
      '0x00',
      undefined
    );
    // remove the first 20+4 bytes(validatorAddress+validatorSignature.length),
    sign = '0x' + sign.substring(2 + (20 + 4) * 2);
    return new Ok(sign);
  }

  /**
   * pack SocialRecovery signature (P256)
   *
   * @param {{
   *         messageHash:string,
   *         publicKey: InitialKey,
   *         r: string,
   *         s: string,
   *         authenticatorData: string,
   *         clientDataSuffix: string
   *     }} signatureData signature data, messageHash is userOp hash(packed userOp hash)
   * @return {*}  {Promise<Result<string, Error>>}
   */
  private async packSocialRecoveryP256Signature(signatureData: {
    messageHash: string;
    publicKey: ECCPoint | string;
    r: string;
    s: string;
    authenticatorData: string;
    clientDataSuffix: string;
  }): Promise<Result<string, Error>> {
    let sign = Signature.packP256Signature(
      '0x0000000000000000000000000000000000000000',
      signatureData,
      '0x00',
      undefined
    );
    // remove the first 20+4 bytes(validatorAddress+validatorSignature.length),
    sign = '0x' + sign.substring(2 + (20 + 4) * 2);
    return new Ok(sign);
  }

  /**
   * pack SocialRecovery signature (RS256)
   *
   * @param {{
   *             messageHash:string,
   *             publicKey: InitialKey,
   *             r: string,
   *             s: string,
   *             authenticatorData: string,
   *             clientDataSuffix: string
   *         }} signatureData
   * @return {*}  {Promise<Result<string, Error>>}
   */
  private async packSocialRecoveryRS256Signature(signatureData: {
    messageHash: string;
    publicKey: RSAPublicKey;
    signature: string;
    authenticatorData: string;
    clientDataSuffix: string;
  }): Promise<Result<string, Error>> {
    let sign = Signature.packRS256Signature(
      '0x0000000000000000000000000000000000000000',
      signatureData,
      '0x00',
      undefined
    );
    // remove the first 20+4 bytes(validatorAddress+validatorSignature.length),
    sign = '0x' + sign.substring(2 + (20 + 4) * 2);
    return new Ok(sign);
  }
}
