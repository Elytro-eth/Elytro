import { useAccount } from '@/contexts/account-context';
import { query } from '@/requests';
import { query_has_sponsored } from '@/requests/query';
import { useEffect, useState } from 'react';
import { toHex } from 'viem';

export const useSponsor = () => {
  const { currentAccount } = useAccount();
  const [canSponsor, setCanSponsor] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getLeftSponsoredCount = async () => {
    setIsLoading(true);
    try {
      const res = (await query(query_has_sponsored, {
        input: { address: currentAccount.address, chainID: toHex(currentAccount.chainId) },
      })) as SafeAny;
      setCanSponsor(res.sponsorOpCheck.sponsorCountLeft > 0);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!currentAccount.address || !currentAccount.chainId) return;
    getLeftSponsoredCount();
  }, [currentAccount.address, currentAccount.chainId]);

  return {
    canSponsor,
    isLoading,
  };
};
