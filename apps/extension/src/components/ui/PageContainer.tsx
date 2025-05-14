import React, { useEffect, useRef } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);

  // Update the min-width based on the zoom and root font size. This is a workaround for browser zoom. Not always working but better than nothing.
  useEffect(() => {
    // ! DO NOT REMOVE this, it's the minimum width of the side panel
    function updateMinWidth() {
      const zoom = window.outerWidth / window.innerWidth;
      const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const minWidth = 360 / (zoom * rootFontSize);
      if (containerRef.current) {
        containerRef.current.style.minWidth = `${minWidth}px`;
      }
    }
    updateMinWidth();
    window.addEventListener('resize', updateMinWidth);
    return () => window.removeEventListener('resize', updateMinWidth);
  }, []);

  return (
    <>
      <ErrorBoundary>
        <div
          ref={containerRef}
          data-page-container
          className={cn('w-screen min-h-screen flex justify-center mx-auto max-w-screen-md relative', className)}
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
