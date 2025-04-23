import { ethers } from 'ethers';
import {
  UserOperation,
  PackedUserOperation,
} from '../interface/UserOperation.js';
import {
  Address,
  BigNumberish,
  HexString,
  Bytes32,
} from '../interface/types.js';
import { Hex } from './hex.js';

function bigIntToNumber(value: bigint): number {
  if (value > Number.MAX_SAFE_INTEGER) {
    throw new Error(`value ${value} is greater than Number.MAX_SAFE_INTEGER`);
  }
  return Number(value);
}

function _BigNumberishToHexString(value: BigNumberish): string {
  return '0x' + BigInt(value).toString(16);
}

function _HexstringToBytes(value: string): string {
  if (value.length === 0) {
    return '0x';
  }
  if (value.startsWith('0x')) {
    return value;
  } else {
    return '0x' + value;
  }
}

function packedUserOperationToTuple(packedUserOp: PackedUserOperation): string {
  let tupleStr = '[';
  tupleStr += `"${ethers.getAddress(packedUserOp.sender)}",`;
  tupleStr += `${BigInt(packedUserOp.nonce).toString(10)},`;
  tupleStr += `"${_HexstringToBytes(packedUserOp.initCode)}",`;
  tupleStr += `"${_HexstringToBytes(packedUserOp.callData)}",`;
  tupleStr += `"${_HexstringToBytes(packedUserOp.accountGasLimits)}",`;
  tupleStr += `${BigInt(packedUserOp.preVerificationGas).toString(10)},`;
  tupleStr += `"${_HexstringToBytes(packedUserOp.gasFees)}",`;
  tupleStr += `"${_HexstringToBytes(packedUserOp.paymasterAndData)}",`;
  tupleStr += `"${_HexstringToBytes(packedUserOp.signature)}"`;
  tupleStr += ']';

  return tupleStr.toLowerCase();
}

function packedUserOperationToJSON(packedUserOp: PackedUserOperation): string {
  const obj = {
    sender: ethers.getAddress(packedUserOp.sender),
    nonce: _BigNumberishToHexString(packedUserOp.nonce),
    initCode: _HexstringToBytes(packedUserOp.initCode),
    callData: _HexstringToBytes(packedUserOp.callData),
    accountGasLimits: _BigNumberishToHexString(packedUserOp.accountGasLimits),
    preVerificationGas: _BigNumberishToHexString(
      packedUserOp.preVerificationGas
    ),
    gasFees: _BigNumberishToHexString(packedUserOp.gasFees),
    paymasterAndData: _HexstringToBytes(packedUserOp.paymasterAndData),
    signature: _HexstringToBytes(packedUserOp.signature),
  };
  return JSON.stringify(obj);
}

function userOperationToJSON(userOp: UserOperation): string {
  let factory: string | null = null;
  if (
    userOp.factory !== null &&
    userOp.factory.length === 42 &&
    userOp.factory !== ethers.ZeroAddress
  ) {
    factory = ethers.getAddress(userOp.factory);
  }
  let paymaster: string | null = null;
  if (
    userOp.paymaster !== null &&
    userOp.paymaster.length === 42 &&
    userOp.paymaster !== ethers.ZeroAddress
  ) {
    paymaster = ethers.getAddress(userOp.paymaster);
  }
  if (paymaster !== null) {
    if (
      userOp.paymasterVerificationGasLimit === null ||
      userOp.paymasterPostOpGasLimit === null ||
      userOp.paymasterData === null
    ) {
      throw new Error(
        'paymasterVerificationGasLimit, paymasterPostOpGasLimit, paymasterData must be set'
      );
    }
  } else {
    if (
      userOp.paymasterVerificationGasLimit !== null ||
      userOp.paymasterPostOpGasLimit !== null ||
      userOp.paymasterData !== null
    ) {
      throw new Error(
        'paymasterVerificationGasLimit, paymasterPostOpGasLimit, paymasterData must be null'
      );
    }
  }
  const obj = {
    sender: ethers.getAddress(userOp.sender),
    nonce: _BigNumberishToHexString(userOp.nonce),
    factory: factory,
    factoryData:
      factory === null
        ? null
        : _HexstringToBytes(
            userOp.factoryData === null ? '0x' : userOp.factoryData
          ),
    callData: _HexstringToBytes(userOp.callData),
    callGasLimit: _BigNumberishToHexString(userOp.callGasLimit),
    verificationGasLimit: _BigNumberishToHexString(userOp.verificationGasLimit),
    preVerificationGas: _BigNumberishToHexString(userOp.preVerificationGas),
    maxFeePerGas: _BigNumberishToHexString(userOp.maxFeePerGas),
    maxPriorityFeePerGas: _BigNumberishToHexString(userOp.maxPriorityFeePerGas),
    paymaster: paymaster,
    paymasterVerificationGasLimit:
      userOp.paymasterVerificationGasLimit === null
        ? null
        : _BigNumberishToHexString(userOp.paymasterVerificationGasLimit),
    paymasterPostOpGasLimit:
      userOp.paymasterPostOpGasLimit === null
        ? null
        : _BigNumberishToHexString(userOp.paymasterPostOpGasLimit),
    paymasterData: userOp.paymasterData === null ? null : userOp.paymasterData,
    signature: _HexstringToBytes(userOp.signature),
  };
  return JSON.stringify(obj);
}
function userOperationFromJSON(json: string): UserOperation {
  const obj = JSON.parse(json);
  let factory: string | null = null;
  if (typeof obj.factory === 'string' && obj.factory.length === 42) {
    factory = ethers.getAddress(obj.factory);
  }
  let factoryData: string | null = null;
  if (factory !== null) {
    if (typeof obj.factoryData !== 'string') {
      throw new Error('factoryData must be a string');
    }
    factoryData = obj.factoryData;
  }
  let paymaster: string | null = null;
  if (typeof obj.paymaster === 'string' && obj.paymaster.length === 42) {
    paymaster = ethers.getAddress(obj.paymaster);
  }

  if (paymaster !== null) {
    if (
      obj.paymasterVerificationGasLimit === null ||
      obj.paymasterPostOpGasLimit === null ||
      obj.paymasterData === null
    ) {
      throw new Error(
        'paymasterVerificationGasLimit, paymasterPostOpGasLimit, paymasterData must be set'
      );
    }
  } else {
    if (
      obj.paymasterVerificationGasLimit !== null ||
      obj.paymasterPostOpGasLimit !== null ||
      obj.paymasterData !== null
    ) {
      throw new Error(
        'paymasterVerificationGasLimit, paymasterPostOpGasLimit, paymasterData must be null'
      );
    }
  }

  const userOp: UserOperation = {
    sender: ethers.getAddress(obj.sender),
    nonce: '0x' + BigInt(obj.nonce).toString(16),
    factory: factory,
    factoryData: factoryData,
    callData: obj.callData,
    callGasLimit: '0x' + BigInt(obj.callGasLimit).toString(16),
    verificationGasLimit: '0x' + BigInt(obj.verificationGasLimit).toString(16),
    preVerificationGas: '0x' + BigInt(obj.preVerificationGas).toString(16),
    maxFeePerGas: '0x' + BigInt(obj.maxFeePerGas).toString(16),
    maxPriorityFeePerGas: '0x' + BigInt(obj.maxPriorityFeePerGas).toString(16),
    paymaster: paymaster,
    paymasterVerificationGasLimit:
      obj.paymasterVerificationGasLimit === null
        ? null
        : '0x' + BigInt(obj.paymasterVerificationGasLimit).toString(16),
    paymasterPostOpGasLimit:
      obj.paymasterPostOpGasLimit === null
        ? null
        : '0x' + BigInt(obj.paymasterPostOpGasLimit).toString(16),
    paymasterData: obj.paymasterData,
    signature: obj.signature,
  };
  return userOp;
}

const UINT128_MAX = BigInt(2) ** BigInt(128) - BigInt(1);
const UINT256_MAX = BigInt(2) ** BigInt(256) - BigInt(1);

function packUints(high128: BigNumberish, low128: BigNumberish): Bytes32 {
  const _high128 = BigInt(high128);
  const _low128 = BigInt(low128);
  if (_high128 < 0 || _high128 > UINT128_MAX) {
    throw new Error(`high128 ${high128} is out of range`);
  }
  if (_low128 < 0 || _low128 > UINT128_MAX) {
    throw new Error(`low128 ${low128} is out of range`);
  }
  // (high128 << 128) | low128
  return Hex.paddingZero(
    ((_high128 << BigInt(128)) | _low128).toString(16),
    32
  );
}

function unpackUints(packed: Bytes32): {
  high128: BigNumberish;
  low128: BigNumberish;
} {
  // return (uint128(bytes16(packed)), uint128(uint256(packed)));
  const _packed = BigInt(packed);
  if (_packed < 0 || _packed > UINT256_MAX) {
    throw new Error(`packed ${packed} is out of range`);
  }
  const high128 = Number(_packed >> BigInt(128));
  const low128 = Number(_packed & UINT128_MAX);
  return {
    high128: Hex.paddingZero(high128),
    low128: Hex.paddingZero(low128),
  };
}

function unpackPaymasterStaticFields(paymasterAndData: HexString): {
  paymaster: Address | null;
  verificationGasLimit: BigNumberish;
  postOpGasLimit: BigNumberish;
  paymasterData: HexString | null;
} {
  if (paymasterAndData.startsWith('0x') === false) {
    throw new Error(
      `paymasterAndData ${paymasterAndData} is not a valid HexString`
    );
  }
  if (paymasterAndData.length < 2 + 52 * 2) {
    return {
      paymaster: null,
      verificationGasLimit: 0,
      postOpGasLimit: 0,
      paymasterData: null,
    };
  }

  const paymaster = paymasterAndData.slice(0, 42);
  const verificationGasLimit = Hex.paddingZero(
    BigInt('0x' + paymasterAndData.slice(42, 74))
  );
  const postOpGasLimit = Hex.paddingZero(
    BigInt('0x' + paymasterAndData.slice(74, 106))
  );
  const paymasterData = '0x' + paymasterAndData.slice(106);

  return {
    paymaster: paymaster,
    verificationGasLimit: verificationGasLimit,
    postOpGasLimit: postOpGasLimit,
    paymasterData: paymasterData,
  };
}

function packPaymasterStaticFields(
  paymaster: Address | null,
  verificationGasLimit: BigNumberish | null,
  postOpGasLimit: BigNumberish | null,
  paymasterData: HexString | null
): HexString {
  if (
    paymaster === null ||
    paymaster.length !== 42 ||
    paymaster === ethers.ZeroAddress
  ) {
    return '0x';
  }

  let paymasterAndData = paymaster;
  paymasterAndData += Hex.paddingZero(
    verificationGasLimit === null ? BigInt(0) : verificationGasLimit,
    16
  ).slice(2);
  paymasterAndData += Hex.paddingZero(
    postOpGasLimit === null ? BigInt(0) : postOpGasLimit,
    16
  ).slice(2);
  if (
    paymasterData !== null &&
    paymasterData.startsWith('0x') === true &&
    paymasterData.length > 2
  ) {
    paymasterAndData += paymasterData.slice(2);
  }
  return paymasterAndData.toLowerCase();
}

function packUserOp(userOp: UserOperation): PackedUserOperation {
  let initCode = '0x';
  if (
    userOp.factory !== null &&
    userOp.factory.length === 42 &&
    userOp.factory !== ethers.ZeroAddress
  ) {
    let factoryData = userOp.factoryData;
    if (factoryData !== null && factoryData.startsWith('0x')) {
      factoryData = factoryData.slice(2);
    }
    initCode = ethers.getAddress(userOp.factory) + factoryData;
  }
  return {
    sender: userOp.sender,
    nonce: userOp.nonce,
    initCode: initCode,
    callData: userOp.callData,
    accountGasLimits: packUints(
      userOp.verificationGasLimit,
      userOp.callGasLimit
    ),
    preVerificationGas: userOp.preVerificationGas,
    gasFees: packUints(userOp.maxPriorityFeePerGas, userOp.maxFeePerGas),
    paymasterAndData: packPaymasterStaticFields(
      userOp.paymaster,
      userOp.paymasterVerificationGasLimit,
      userOp.paymasterPostOpGasLimit,
      userOp.paymasterData
    ),
    signature: userOp.signature,
  };
}

function unpackUserOp(packedUserOp: PackedUserOperation): UserOperation {
  const _accountGasLimits = unpackUints(packedUserOp.accountGasLimits);
  const _gasFees = unpackUints(packedUserOp.gasFees);
  const _paymasterStaticFields = unpackPaymasterStaticFields(
    packedUserOp.paymasterAndData
  );
  let factory: string | null = null;
  let factoryData: string | null = null;
  if (
    packedUserOp.initCode.startsWith('0x') &&
    packedUserOp.initCode.length >= 42
  ) {
    factory = ethers.getAddress(packedUserOp.initCode.slice(0, 42));
    factoryData = '0x' + packedUserOp.initCode.slice(42);
  }
  return {
    sender: packedUserOp.sender,
    nonce: packedUserOp.nonce,
    factory: factory,
    factoryData: factoryData,
    callData: packedUserOp.callData,
    callGasLimit: _accountGasLimits.low128,
    verificationGasLimit: _accountGasLimits.high128,
    preVerificationGas: packedUserOp.preVerificationGas,
    maxFeePerGas: _gasFees.low128,
    maxPriorityFeePerGas: _gasFees.high128,
    paymaster: _paymasterStaticFields.paymaster,
    paymasterVerificationGasLimit: _paymasterStaticFields.verificationGasLimit,
    paymasterPostOpGasLimit: _paymasterStaticFields.postOpGasLimit,
    paymasterData: _paymasterStaticFields.paymasterData,
    signature: packedUserOp.signature,
  };
}

export {
  packedUserOperationToJSON,
  userOperationFromJSON,
  userOperationToJSON,
  bigIntToNumber,
  packUserOp,
  unpackUserOp,
  packedUserOperationToTuple,
};
