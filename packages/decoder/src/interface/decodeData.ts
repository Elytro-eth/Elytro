import { Result } from 'ethers';
import { TokenInfo } from '@elytro/assets';

/**
 * Method is the interface for the function.
 *
 * @export
 * @interface Method
 */
export interface Method {
  /**
   * The bytes4 of the solidity function.
   *
   * @type {string}
   * @memberof Method
   */
  bytes4: string;

  /**
   * The name of the solidity function.
   *
   * @type {string}
   * @memberof Method
   */
  name?: string;

  /**
   * The text of the solidity function.
   *
   * @type {string}
   * @memberof Method
   */
  text?: string;

  /**
   * The params of the solidity function.
   *
   * @type {Result}
   * @memberof Method
   */
  params: Result;
}

/**
 * DecodeResult is the interface for the decode result.
 *
 * @export
 * @interface DecodeResult
 */
export interface DecodeResult {
  /**
   * The from address.
   *
   * @type {string}
   * @memberof DecodeResult
   */
  from: string;

  /**
   * The token information of the from address.
   *
   * @type {TokenInfo}
   * @memberof DecodeResult
   */
  fromInfo?: TokenInfo;

  /**
   * The to address.
   *
   * @type {string}
   * @memberof DecodeResult
   */
  to: string;

  /**
   * The token information of the to address.
   *
   * @type {TokenInfo}
   * @memberof DecodeResult
   */
  toInfo?: TokenInfo;

  /**
   * The eth value.
   *
   * @type {bigint}
   * @memberof DecodeResult
   */
  value: bigint;

  /**
   * The method.
   *
   * @type {Method}
   * @memberof DecodeResult
   */
  method?: Method;
}
