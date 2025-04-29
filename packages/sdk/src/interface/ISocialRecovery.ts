export interface GuardianSignature {
  /**
   * 0:EIP-1271 signature, 1:approved onchain before, 2:EOA signature, 3:No signature provided
   *
   * @type {number}
   * @memberof GuardianSignature
   */
  signatureType: 0 | 1 | 2 | 3;

  /**
   * Guardian address
   *
   * @type {string}
   * @memberof GuardianSignature
   */
  address: string;

  /**
   * Signature
   *
   * @type {string}
   * @memberof GuardianSignature
   */
  signature?: string;
}

// export enum SocialRecoveryTypedDataType {

//     /**
//      * keccak256("SocialRecovery(address wallet,uint256 nonce, bytes32[] newOwner)");
//      */
//     TYPE_HASH_SOCIAL_RECOVERY = 'TYPE_HASH_SOCIAL_RECOVERY'
// }

export abstract class ISocialRecovery {}
