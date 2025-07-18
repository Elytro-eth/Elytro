// return type of pimlico_getTokenQuotes. all in hex.
export type TokenQuote = {
  paymaster: string;
  token: string;
  postOpGas: string;
  exchangeRate: string;
  exchangeRateNativeToUsd: string;
  balanceSlot: string;
  allowanceSlot: string;
  name: string;
};

export type TokenQuoteResponse = {
  quotes: TokenQuote[];
};

export type SupportedToken = {
  token: string;
  name: string;
  decimals: number;
  symbol: string;
};

export type TokenPaymaster = TokenQuote & SupportedToken;
