import { TokenInfo } from './interface/tokenInfo.js';
import tokenList from './tokens.js';
import { Ok, Err, Result } from '@elytro/result';
import { UriCompression } from './uriCompression.js';

/**
 * Get the token information from the token list.
 *
 * @param {number} chainId
 * @param {string} address
 * @return {*}  {Promise<Result<TokenInfo, Error>>}
 */
async function getAsset(
  chainId: number,
  address: string
): Promise<Result<TokenInfo, Error>> {
  const key = address.toLowerCase() + '|' + chainId;
  const token = tokenList.get(key);
  if (token) {
    return new Ok({
      chainId: chainId,
      address: address,
      type: token.t,
      name: token.n,
      symbol: token.s,
      decimals: token.d,
      logoURI: UriCompression.decompressUri(token.l),
    });
  }
  return new Err(new Error('token not found'));
}

export { getAsset };
