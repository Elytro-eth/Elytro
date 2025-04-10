import { localStorage } from './storage/local';

const CONFIG = {
  UNISWAP_API: {
    TOKEN_LIST_URL: 'https://ipfs.io/ipns/tokens.uniswap.org',
  },
  IPFS: {
    GATEWAY: 'https://ipfs.io/ipfs/',
    PROTOCOL: 'ipfs://',
  },
  CACHE: {
    DURATION: 1000 * 60 * 60 * 24, // 1 Day
    KEYS: {
      TOP_TOKENS: (chainId: number) => `top100Tokens-${chainId}`,
      USER_TOKENS: (chainId: number) => `userImportedTokens-${chainId}`,
    },
  },
} as const;

interface CachedTokens {
  tokens: TTokenInfo[];
  lastUpdated: number;
}

const transformLogoURI = (logoURI: string): string => {
  if (!logoURI.includes(CONFIG.IPFS.PROTOCOL)) return logoURI;
  return `${CONFIG.IPFS.GATEWAY}${logoURI.split(CONFIG.IPFS.PROTOCOL)[1]}`;
};

const isCacheValid = (lastUpdated: number): boolean => {
  return Date.now() - lastUpdated < CONFIG.CACHE.DURATION;
};

export const fetchTokens = async (
  chainId: number,
  maxCount?: number
): Promise<TTokenInfo[]> => {
  try {
    const response = await fetch(CONFIG.UNISWAP_API.TOKEN_LIST_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const { tokens } = await response.json();
    const filteredTokens = (tokens as TTokenInfo[])
      .filter((token) => token.chainId === chainId)
      .map((token) => ({
        address: token.address,
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        logoURI: transformLogoURI(token.logoURI),
      }));

    return maxCount ? filteredTokens.slice(0, maxCount) : filteredTokens;
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Unknown error');
    return [];
  }
};

export const getTop100TokenAddresses = async (
  chainId: number
): Promise<TTokenInfo[]> => {
  const storageKey = CONFIG.CACHE.KEYS.TOP_TOKENS(chainId);

  try {
    const cached = (await localStorage.get(storageKey)) as CachedTokens | null;

    if (cached && isCacheValid(cached.lastUpdated)) {
      return cached.tokens;
    }

    const tokens = await fetchTokens(chainId, 100);
    await localStorage.save({
      [storageKey]: {
        tokens,
        lastUpdated: Date.now(),
      },
    });

    return tokens;
  } catch (error) {
    console.error(
      'Elytro: Failed to get top 100 tokens:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return [];
  }
};

export const updateUserImportedTokens = async (
  chainId: number,
  token: TTokenInfo
): Promise<void> => {
  const storageKey = CONFIG.CACHE.KEYS.USER_TOKENS(chainId);

  try {
    const prevTokens =
      ((await localStorage.get(storageKey)) as TTokenInfo[]) || [];

    if (
      prevTokens.some(
        (t) => t.address.toLowerCase() === token.address.toLowerCase()
      )
    ) {
      return;
    }

    const newToken = {
      ...token,
      chainId,
      importedByUser: true,
    };

    await localStorage.save({
      [storageKey]: [...prevTokens, newToken],
    });
  } catch (error) {
    console.error(
      'Elytro: Failed to update user tokens:',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

export const getTokenList = async (chainId: number): Promise<TTokenInfo[]> => {
  try {
    const [userTokens, top100Tokens] = await Promise.all([
      localStorage.get(CONFIG.CACHE.KEYS.USER_TOKENS(chainId)) as Promise<
        TTokenInfo[]
      >,
      getTop100TokenAddresses(chainId),
    ]);

    const userTokenAddresses = new Set(
      (userTokens || []).map((token) => token.address.toLowerCase())
    );

    const filteredTop100Tokens = top100Tokens.filter(
      (token) => !userTokenAddresses.has(token.address.toLowerCase())
    );

    return [...(userTokens || []), ...filteredTop100Tokens];
  } catch (error) {
    console.error(
      'Elytro: Failed to get token list:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return [];
  }
};
