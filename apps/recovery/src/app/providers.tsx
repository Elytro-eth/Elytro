'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { WagmiProvider } from 'wagmi';

import { getConfig } from '@/wagmi';
import { ApolloProvider } from '@apollo/client';
import { client } from '@/requests/client';
import { RecoveryRecordProvider } from '@/contexts';

export function Providers({ children }: { children: ReactNode }) {
  const [config] = useState(() => getConfig());
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ApolloProvider client={client}>
          <RecoveryRecordProvider>{children}</RecoveryRecordProvider>
        </ApolloProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
