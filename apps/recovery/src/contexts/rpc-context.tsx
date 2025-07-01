'use client';

import { useSearchParams } from 'next/navigation';
import React, { createContext, useContext, useState, useEffect } from 'react';

interface RpcContextType {
  rpc: string;
  setRpc: (rpc: string) => void;
}

const RpcContext = createContext<RpcContextType>({
  rpc: '',
  setRpc: () => {},
});

export const RpcProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rpc, setRpcState] = useState<string>('');
  const searchParams = useSearchParams();
  const chainId = searchParams.get('chainId');

  useEffect(() => {
    if (chainId) {
      const stored = localStorage.getItem('custom_rpc_url' + chainId);
      if (stored) setRpcState(stored);
    }
  }, [chainId]);

  const setRpc = (newRpc: string) => {
    if (chainId) {
      setRpcState(newRpc);
      if (typeof window !== 'undefined') {
        localStorage.setItem('custom_rpc_url' + chainId, newRpc);
      }
    }
  };

  return <RpcContext.Provider value={{ rpc, setRpc }}>{children}</RpcContext.Provider>;
};

export const useRpc = () => useContext(RpcContext);
