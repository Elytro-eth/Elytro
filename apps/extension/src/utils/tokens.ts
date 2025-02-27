import { localStorage } from './storage/local';

const UNISWAP_TOKEN_LIST_URL = 'https://ipfs.io/ipns/tokens.uniswap.org';
const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';
const IPFS_PROTOCOL = 'ipfs://';

export const fetchTokens = async (
  chainId: number,
  maxCount?: number
): Promise<TTokenInfo[]> => {
  try {
    const res = await fetch(UNISWAP_TOKEN_LIST_URL);
    const { tokens } = await res.json();

    let filteredTokens = (tokens as TTokenInfo[]).filter(
      (token) => token.chainId === chainId
    );

    if (maxCount !== undefined) {
      filteredTokens = filteredTokens.slice(0, maxCount);
    }

    return filteredTokens.map((token) => ({
      address: token.address,
      name: token.name,
      symbol: token.symbol,
      decimals: token.decimals,
      // change ipfs to https: ipfs://{cid} -> https://ipfs.io/ipfs/{cid}
      logoURI: token.logoURI.includes(IPFS_PROTOCOL)
        ? `${IPFS_GATEWAY}${token.logoURI.split(IPFS_PROTOCOL)[1]}`
        : token.logoURI,
    }));
  } catch (error) {
    console.error('Elytro: fetching 100 tokens failed', error);
    return [];
  }
};

type TLocalStorageTokenAddresses = {
  tokens: TTokenInfo[];
  lastUpdated: number;
};

const TOP_100_TOKENS_CACHE_TIME = 1000 * 60 * 60 * 24; // 1 Day

const getUserImportedTokensStorageKey = (chainId: number) => {
  return `userImportedTokens-${chainId}`;
};

export const getTop100TokenAddresses = async (
  chainId: number
): Promise<TTokenInfo[]> => {
  const storageKey = `top100Tokens-${chainId}`;
  const top100Tokens = (await localStorage.get(
    storageKey
  )) as TLocalStorageTokenAddresses | null;

  if (
    top100Tokens &&
    Date.now() - top100Tokens.lastUpdated < TOP_100_TOKENS_CACHE_TIME
  ) {
    return top100Tokens.tokens;
  }

  try {
    const tokens = await fetchTokens(chainId, 100);

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

export const updateUserImportedTokens = async (
  chainId: number,
  token: TTokenInfo
) => {
  const storageKey = getUserImportedTokensStorageKey(chainId);
  const prevTokens =
    ((await localStorage.get(storageKey)) as TTokenInfo[]) || [];

  await localStorage.save({
    [storageKey]: [
      ...prevTokens,
      {
        ...token,
        importedByUser: true,
      },
    ],
  });
};

export const getTokenList = async (chainId: number) => {
  const top100Tokens = await getTop100TokenAddresses(chainId);

  const userImportedTokensStorageKey = getUserImportedTokensStorageKey(chainId);

  const userImportedTokens = (await localStorage.get(
    userImportedTokensStorageKey
  )) as TTokenInfo[] | [];

  return [...top100Tokens, ...userImportedTokens];
};
