import { gql, useQuery } from '@apollo/client';
import { useEffect, useMemo, useState } from 'react';
import { Address, Hex, toHex } from 'viem';

export interface TokenDTO {
  decimals: number;
  logoURI: string;
  name: string;
  symbol: string;
  tokenBalance: Hex;
  price: number;
  contractAddress: string;
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
  const tokens_query = useMemo(
    () => gql`
      query TokensQuery($address: String!, $chainId: String!) {
        tokens(address: $address, chainID: $chainId) {
          decimals
          logoURI
          name
          symbol
          tokenBalance
          price
          contractAddress
        }
      }
    `,
    []
  );

  useEffect(() => {
    if (address && chainId) {
      refetch();
    }
  }, [address, chainId]);

  const [isRefetching, setIsRefetching] = useState(false);

  const { loading, data, refetch } = useQuery<TokenQueryDTO>(tokens_query, {
    variables: { address, chainId: toHex(chainId as number) },
    skip: !address || !chainId,
  });

  const refetchTokens = async () => {
    setIsRefetching(true);
    await refetch();
    setIsRefetching(false);
  };

  // TODO: separate loading and refetching
  return {
    tokens: data?.tokens || [],
    loadingTokens: loading || isRefetching,
    refetchTokens,
  };
}
