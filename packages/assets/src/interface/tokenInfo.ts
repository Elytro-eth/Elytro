export enum AddressType {
  Unknown = 0,
  Elytro = 1,
  Erc20 = 2,
  Erc721 = 3,
  Erc1155 = 4,
}

export interface MinTokenInfo {
  t: AddressType;
  n: string;
  s: string;
  d: number;
  l?: string;
}

/**
 * TokenInfo is the interface for the token information.
 *
 * @export
 * @interface TokenInfo
 */
export interface TokenInfo {
  /**
   * The chain id of the token.
   *
   * @type {number}
   * @memberof TokenInfo
   */
  chainId: number;

  /**
   * The address of the token.
   *
   * @type {string}
   * @memberof TokenInfo
   */
  address: string;

  /**
   * The type of the token.
   *
   * @type {AddressType}
   * @memberof TokenInfo
   */
  type: AddressType;

  /**
   * The name of the token.
   *
   * @type {string}
   * @memberof TokenInfo
   */
  name: string;

  /**
   * The symbol of the token.
   *
   * @type {string}
   * @memberof TokenInfo
   */
  symbol: string;

  /**
   * The decimals of the token.
   *
   * @type {number}
   * @memberof TokenInfo
   */
  decimals: number;

  /**
   * The logo URI of the token.
   *
   * @type {string}
   * @memberof TokenInfo
   */
  logoURI?: string;
}
