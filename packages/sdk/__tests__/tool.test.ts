import {
  // ElytroWallet,
  // UserOperation,
  // PackedUserOperation,
  UserOpUtils,
  // UserOpErrors,
  // UserOpErrorCodes,
  // L1KeyStore,
  // Ok, Err, Result,
  // UserOpReceipt,
  // UserOpDetail,
  // UserOpGas,
  // Bundler,
  // Transaction,
  // KeyStoreInfo,
  // GuardianSignature,
  // KeyStoreTypedDataType,
  // InitialKey,
  // ECCPoint,
  // SignkeyType,
  // P256Lib,
  // WebAuthN,
  // Base64Url,
  // WalletFactory
} from '..';
import { describe, test } from '@jest/globals';
// import { webcrypto } from 'node:crypto';
// import { Hex } from '../src/tools/hex';
// import { randomBytes } from 'crypto';

describe('Tool', () => {
  // TODO: to be implemented.
  test.skip('string to packedUserOp', async () => {
    const userOpStr = `
        {
            "sender": "0xBF4433fA87Cdd6F40dc8Fe8dc155b6584A3f8D60",
            "nonce": 0,
            "factory": "0xF78Ae187CED0Ca5Fb98100d3F0EAB7a6461d6fC6",
            "factoryData": "a1aafc9e0000000000000000000000000000000000000000000000000000000000000040e6be02833bbbb7621abde523edf7041a434a475e79c3df01c698d0521588e27000000000000000000000000000000000000000000000000000000000000001a4ac27308a000000000000000000000000000000000000000000000000000000000000008000000000000000000000000082621ac52648b738fedd381a367885193350576200000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000180000000000000000000000000000000000000000000000000000000000000000151905cac4283120527d54ad35710642dc539fa79307914c3a77f944cb57691b0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000054880c6eb80583795625935b08aa28eb37f16732c70000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002a300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
            "callData": "0x",
            "callGasLimit": 0,
            "verificationGasLimit": 0,
            "preVerificationGas": 10000000,
            "maxFeePerGas": "0x118d8b",
            "maxPriorityFeePerGas": "0x118c30",
            "paymaster": null,
            "paymasterVerificationGasLimit": 0,
            "paymasterPostOpGasLimit": 0,
            "paymasterData": null,
            "signature": "0x"
        }
        `;

    const userOp = UserOpUtils.userOperationFromJSON(userOpStr);
    const packedUserOp = UserOpUtils.packUserOp(userOp);
    //const packedUserOpStr = UserOpUtils.packedUserOperationToTuple(packedUserOp);
    const userOpStrOut = JSON.stringify(packedUserOp);
    console.log(userOpStrOut);
  });
});
