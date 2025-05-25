import { useAccount } from 'wagmi';
import { useRecoveryRecord } from '@/contexts';
import { useEffect, useState } from 'react';
export function useCurrentChain() {
  const { chainId } = useAccount();
  const { chainId: recoveryChainId } = useRecoveryRecord();
  const [isWrongChain, setIsWrongChain] = useState(true);

  useEffect(() => {
    if (chainId && recoveryChainId) {
      setIsWrongChain(chainId !== recoveryChainId);
    }
  }, [chainId, recoveryChainId]);

  return { chainId, isWrongChain };
}
