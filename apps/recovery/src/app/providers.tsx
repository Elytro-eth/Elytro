'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useMemo, useState } from 'react';
import { type State, WagmiProvider } from 'wagmi';

import { getConfig } from '@/wagmi';
import { ApolloProvider } from '@apollo/client';
import { client } from '@/requests/client';
import { RecoveryRecordProvider } from '@/contexts';
import { useRpc } from '@/contexts/rpc-context';
import { useSearchParams } from 'next/navigation';
import { TooltipProvider } from '@elytro/ui';

export function Providers(props: { children: ReactNode; initialState?: State }) {
  const { rpc } = useRpc();
  const searchParams = useSearchParams();
  const chainId = searchParams.get('chainId');
  const [queryClient] = useState(() => new QueryClient());

  const config = useMemo(() => getConfig(rpc, chainId), [rpc, chainId]);

  return (
    <WagmiProvider config={config} initialState={props.initialState} key={rpc}>
      <QueryClientProvider client={queryClient}>
        <ApolloProvider client={client}>
          <TooltipProvider>
            <RecoveryRecordProvider>{props.children}</RecoveryRecordProvider>
          </TooltipProvider>
        </ApolloProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
