import { localStorage } from './storage/local';

type TLocalStorageTop100TokenAddresses = {
  tokens: TTokenInfo[];
  lastUpdated: number;
};

const TOP_100_TOKENS_CACHE_TIME = 1000 * 60 * 60 * 24; // 1 Day

export const getTop100TokenAddresses = async (
  chainId: number
): Promise<TTokenInfo[]> => {
  const storageKey = `top100Tokens-${chainId}`;
  const top100Tokens = (await localStorage.get(
    storageKey
  )) as TLocalStorageTop100TokenAddresses | null;

  if (
    top100Tokens &&
    Date.now() - top100Tokens.lastUpdated < TOP_100_TOKENS_CACHE_TIME
  ) {
    return top100Tokens.tokens;
  }

  try {
    const res = await fetch(
      `https://ipfs.io/ipns/tokens.uniswap.org?chainId=${chainId}`
    );
    const data = await res.json();

    const tokens = (data.tokens as TTokenInfo[])
      .filter((token) => token.chainId === chainId)
      .slice(0, 100)
      .map((token) => {
        return {
          address: token.address,
          name: token.name,
          symbol: token.symbol,
          decimals: token.decimals,
          // change ipfs to https: ipfs://{cid} -> https://ipfs.io/ipfs/{cid}
          logoURI: token.logoURI.includes('ipfs')
            ? `https://ipfs.io/ipfs/${token.logoURI.split('ipfs://')[1]}`
            : token.logoURI,
        };
      });

    localStorage.save({
      [storageKey]: {
        tokens,
        lastUpdated: Date.now(),
      },
    });
    return tokens;
  } catch (error) {
    console.error('Elytro: fetching top 100 token info failed', error);
    return [];
  }
};
