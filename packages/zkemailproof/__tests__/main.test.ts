import {
  // TODO: EmailProof,
  EmailApproverFactory,
} from '..';
import { describe, expect, test } from '@jest/globals';

describe('elytro-zkemail', () => {
  test('EmailApproverFactory', async () => {
    const emailAddr = 'xurigong@gmail.com';
    const commitment_rand = BigInt(12322);
    const addressCommit = BigInt(
      '0x3021da71aa1435b4be7ced3ba1ac8058a0d2c796007e8b0b95483912a9e3728e'
    );
    const create2Salt = BigInt(2);

    const EmailApproverAddr = '0x1b8e3a980712Ed52DF5ba977c8a99BD86C4cE37A';
    const EmailApproverFactoryAddr =
      '0x490F83eC3E69FDCa0cdA31DF3Bd34cA988394d95';
    const emailApproverFactory = new EmailApproverFactory(
      EmailApproverFactoryAddr,
      EmailApproverAddr
    );
    const deployInfo1 = await emailApproverFactory.createEmailApprover(
      emailAddr,
      commitment_rand,
      create2Salt
    );
    const deployInfo2 = emailApproverFactory.createEmailApprover2(
      addressCommit,
      create2Salt
    );

    expect(deployInfo1.delpoyedAddress).toBe(deployInfo2.delpoyedAddress);
    expect(deployInfo1.senderCommitment).toBe(
      '0x' + addressCommit.toString(16)
    );

    expect(deployInfo1.delpoyedAddress.toLowerCase()).toBe(
      '0xec1f90Fe08988396C093A1Dcf14ade1AF8f75929'.toLowerCase()
    );
  });
});
