import { useChainId } from 'wagmi';
import { useRecoveryRecord } from '@/contexts';
import { useEffect, useState } from 'react';
export function useCurrentChain() {
  const chainId = useChainId();
  const { recoveryRecord } = useRecoveryRecord();
  const [isWrongChain, setIsWrongChain] = useState(true);

  useEffect(() => {
    if (chainId && recoveryRecord?.chainID) {
      setIsWrongChain(chainId !== Number(recoveryRecord?.chainID));
    }
  }, [chainId, recoveryRecord?.chainID]);

  return { chainId, isWrongChain };
}
