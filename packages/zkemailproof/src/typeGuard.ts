import { Ok, Err, Result } from '@elytro/result';

export class TypeGuard {
  static onlyHex(hex: string): Result<true, string> {
    const regex = /^0x[0-9a-f]+$/i;
    if (!regex.test(hex)) {
      return new Err('invalid hex:' + hex);
    }
    return new Ok(true);
  }

  static onlyAddress(address: string): Result<true, string> {
    const regex = /^0x[a-fA-F0-9]{40}$/;
    if (!regex.test(address)) {
      return new Err('address is invalid');
    }
    return new Ok(true);
  }

  static onlyBytes32(bytes32: string): Result<true, string> {
    const regex = /^0x[a-fA-F0-9]{64}$/;
    if (!regex.test(bytes32)) {
      return new Err('bytes32 is invalid');
    }
    return new Ok(true);
  }

  static maxToUint64(num: string): Result<bigint, string> {
    const bn = BigInt(num);
    /* 
        type(uint64).max = 0xffffffffffffffff
        */
    if (bn > BigInt('0xffffffffffffffff')) {
      // throw new Error("num is too large");
      return new Err('num is too large');
    }
    return new Ok(bn);
  }

  static maxToUint192(num: string): Result<bigint, string> {
    const bn = BigInt(num);
    /* 
        type(uint192).max =  0xffffffffffffffffffffffffffffffffffffffffffffffff
        */
    if (bn > BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffff')) {
      // throw new Error("num is too large");
      return new Err('num is too large');
    }
    return new Ok(bn);
  }

  static maxToUint256(num: string): Result<bigint, string> {
    const bn = BigInt(num);
    /* 
        type(uint256).max = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
        */
    if (
      bn >
      BigInt(
        '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
      )
    ) {
      return new Err('num is too large');
    }
    return new Ok(bn);
  }

  static httpOrHttps(url: string): Result<true, string> {
    const regex = /^https?:\/\/.+/;
    if (!regex.test(url)) {
      return new Err('url is invalid');
    }
    return new Ok(true);
  }

  static onlyBytes(bytes: string): Result<true, string> {
    // start with 0x, and at least 2 hex chars, and length is even number
    if (bytes === '0x') {
      return new Ok(true);
    }

    const regex = /^0x([0-9a-f][0-9a-f])*$/i;
    if (!regex.test(bytes)) {
      return new Err('bytes is invalid');
    }
    return new Ok(true);
  }
}
