import { ethers } from 'ethers';
import { TypeGuard } from './typeGuard.js';
import { packBytesIntoNBytes } from '@zk-email/helpers';
// import { poseidon } from "@iden3/js-crypto";
// import * as iden3_js_crypto from "@iden3/js-crypto";
import { buildPoseidon } from 'circomlibjs';
import { Hex } from './hex.js';
// import { ABI_EmailApproverFactory } from "@elytro/abi";
import { ABI_EmailApprover } from '@elytro/abi';

/**
 *
 *
 * @export
 * @interface ICreateEmailApproverArgs
 */
export interface ICreateEmailApproverArgs {
  /**
   * bytes32 - poseidon hash of (email address | commitment_rand)
   *
   * @type {string}
   * @memberof ICreateEmailApproverArgs
   */
  senderCommitment: string;

  /**
   * bytes32 - create2 salt
   *
   * @type {string}
   * @memberof ICreateEmailApproverArgs
   */
  salt: string;

  /**
   * deployed address
   *
   * @type {string}
   * @memberof ICreateEmailApproverArgs
   */
  delpoyedAddress: string;
}

export class EmailApproverFactory {
  private _EmailApproverFactoryAddress: string;
  private _EmailApproverAddress: string;

  constructor(
    EmailApproverFactoryAddress: string,
    EmailApproverAddress: string
  ) {
    if (TypeGuard.onlyAddress(EmailApproverFactoryAddress).isErr() === true) {
      throw new Error('EmailApproverFactoryAddress is invalid');
    }
    if (TypeGuard.onlyAddress(EmailApproverAddress).isErr() === true) {
      throw new Error('EmailApproverAddress is invalid');
    }

    this._EmailApproverFactoryAddress = EmailApproverFactoryAddress;
    this._EmailApproverAddress = EmailApproverAddress;
  }

  private proxyCode(): string {
    const _implementation = this._EmailApproverAddress.substring(2);
    const deploymentData =
      '0x603d3d8160223d3973' +
      _implementation +
      '60095155f3363d3d373d3d363d7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc545af43d6000803e6038573d6000fd5b3d6000f3';
    return deploymentData.toLowerCase();
  }

  /**
   * generate email address commitment
   *
   * @static
   * @param {string} emailAddr email address ( Case sensitive )
   * @param {bigint} sender_email_commitment_rand random number
   * @return {*}  {bigint}
   * @memberof EmailProof
   */
  public static async emailAddrCommit(
    emailAddr: string,
    email_commitment_rand: bigint
  ): Promise<bigint> {
    /*
           template EmailAddrCommit(num_ints) {
               signal input rand;
               signal input email_addr_ints[num_ints];
               signal output commit;

               component poseidon = Poseidon(1+num_ints);
               poseidon.inputs[0] <== rand;
               for(var i=0; i<num_ints; i++) {
                   poseidon.inputs[1+i] <== email_addr_ints[i];
               }
               commit <== poseidon.out;
           }
       */

    // @zk-email/circuits/utils/constants.circom
    const EMAIL_ADDR_MAX_BYTES = 256;
    const MAX_BYTES_IN_FIELD = 31;
    if (emailAddr.length > EMAIL_ADDR_MAX_BYTES) {
      throw new Error('Email address is too long');
    }
    const _sender_email_addr_ints = packBytesIntoNBytes(
      emailAddr,
      MAX_BYTES_IN_FIELD
    );
    const sender_email_addr_ints: bigint[] = [];
    for (
      let index = 0;
      index <
      Math.ceil(
        EMAIL_ADDR_MAX_BYTES / MAX_BYTES_IN_FIELD
      ) /*computeIntChunkLength()*/;
      index++
    ) {
      if (index < _sender_email_addr_ints.length) {
        sender_email_addr_ints[index] = BigInt(_sender_email_addr_ints[index]);
      } else {
        sender_email_addr_ints[index] = BigInt(0);
      }
    }
    const poseidonInputs = [email_commitment_rand, ...sender_email_addr_ints];
    // const out = iden3_js_crypto.poseidon.hash(poseidonInputs);
    const poseidon = await buildPoseidon();
    const out = poseidon.F.toObject(poseidon(poseidonInputs));
    return out;
  }

  private calcSalt(initializer: string, salt: string): string {
    /*
            function _calcSalt(bytes memory _initializer, bytes32 _salt) private pure returns (bytes32 salt) {
                return keccak256(abi.encodePacked(keccak256(_initializer), _salt));
            }
        */
    const _bytes = ethers.solidityPacked(
      ['bytes', 'bytes32'],
      [ethers.keccak256(initializer), salt]
    );
    const _salt = ethers.keccak256(_bytes).toLowerCase();
    return _salt;
  }

  /**
   * EmailApproverFactory.createEmailApprover()
   *
   * @param {bigint} emailAddrCommit poseidon hash of (email address | commitment_rand)
   * @param {bigint} [salt=BigInt(0)] create2 salt
   * @return {*}  {ICreateEmailApproverArgs}
   * @memberof EmailApproverFactory
   */
  public createEmailApprover2(
    emailAddrCommit: bigint,
    salt: bigint = BigInt(0)
  ): ICreateEmailApproverArgs {
    const _interface = new ethers.Interface(ABI_EmailApprover);
    const _emailAddrCommitBytes32 = Hex.paddingZero(emailAddrCommit, 32);
    const _saltBytes32 = Hex.paddingZero(salt, 32);
    const _initializer = _interface.encodeFunctionData('initialize', [
      _emailAddrCommitBytes32,
    ]);
    // const _interfaceFactory = new ethers.Interface(ABI_EmailApproverFactory);
    return {
      senderCommitment: _emailAddrCommitBytes32,
      salt: _saltBytes32,
      delpoyedAddress: this.getCreate2Address(_initializer, _saltBytes32),
    };
  }

  /**
   * EmailApproverFactory.createEmailApprover()
   *
   * @param {string} emailAddr email address( Case sensitive)
   * @param {bigint} [email_commitment_rand=BigInt(0)] random number
   * @param {bigint} [salt=BigInt(0)] create2 salt
   * @return {*}  {ICreateEmailApproverArgs}
   * @memberof EmailApproverFactory
   */
  public async createEmailApprover(
    emailAddr: string,
    email_commitment_rand: bigint = BigInt(0),
    salt: bigint = BigInt(0)
  ): Promise<ICreateEmailApproverArgs> {
    const _emailAddrCommit = await EmailApproverFactory.emailAddrCommit(
      emailAddr,
      email_commitment_rand
    );
    return this.createEmailApprover2(_emailAddrCommit, salt);
  }

  private getCreate2Address(initializer: string, salt: string): string {
    return ethers.getCreate2Address(
      this._EmailApproverFactoryAddress,
      this.calcSalt(initializer, salt),
      ethers.keccak256(this.proxyCode())
    );
  }
}
