import { gql, useQuery } from '@apollo/client';
import { useEffect } from 'react';
import { Address, Hex, toHex } from 'viem';

export interface TokenDTO {
  decimals: number;
  logoURI: string;
  name: string;
  symbol: string;
  tokenBalance: Hex;
  price: number;
}

interface TokenQueryDTO {
  tokens: TokenDTO[];
}

export default function useTokens({
  chainId,
  address,
}: {
  chainId: number;
  address?: Address;
}) {
  const tokens_query = gql`
    query TokensQuery($address: String!, $chainId: String!) {
      tokens(address: $address, chainID: $chainId) {
        decimals
        logoURI
        name
        symbol
        tokenBalance
        price
      }
    }
  `;
  useEffect(() => {
    if (address && chainId) {
      refetch();
    }
  }, [address, chainId]);
  const { loading, data, refetch } = useQuery<TokenQueryDTO>(tokens_query, {
    variables: { address, chainId: toHex(chainId as number) },
  });

  return {
    tokens: data?.tokens || [],
    loadingTokens: loading,
    refetchTokens: refetch,
  };
}
