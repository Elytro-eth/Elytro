// return type of pimlico_getTokenQuotes. all in hex.
export type TokenQuote = {
  paymaster: string;
  token: string;
  postOpGas: string;
  exchangeRate: string;
  exchangeRateNativeToUsd: string;
  balanceSlot: string;
  allowanceSlot: string;
};

export type TokenQuoteResponse = {
  quotes: TokenQuote[];
};
