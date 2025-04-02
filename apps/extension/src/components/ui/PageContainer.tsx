import React from 'react';
import RequestProvider from './RequestProvider';
import '@/index.css';
import { Toaster } from './toaster';
import { WalletProvider } from '@/contexts/wallet';
import ErrorBoundary from './ErrorBoundary';
import { cn } from '@/utils/shadcn/utils';
import { ChainProvider } from '@/contexts/chain-context';

interface IPageContainerProps {
  children: React.ReactNode;
  className?: string;
}

function PageContainer({ children, className }: IPageContainerProps) {
  return (
    <>
      <ErrorBoundary>
        <div
          className={cn(
            'w-screen h-screen flex justify-center mx-auto max-w-screen-md',
            className
          )}
        >
          <WalletProvider>
            <ChainProvider>
              <RequestProvider>{children}</RequestProvider>
            </ChainProvider>
          </WalletProvider>
        </div>
      </ErrorBoundary>
      <Toaster />
    </>
  );
}

export default PageContainer;
