import type { Metadata } from 'next';
import './globals.css';
import { cookieToInitialState } from 'wagmi';

import { headers } from 'next/headers';
import { getConfig } from '../wagmi';
import { Providers } from './providers';
import ConnectControl from '@/components/ConnectControl';
import { LogoHeader } from '@/components/LogoHeader';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'Elytro Recovery',
  description: "Help you recover your or your friend's Elytro accounts",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const resolvedHeaders = await headers();
  const initialState = cookieToInitialState(
    getConfig(),
    resolvedHeaders.get('cookie')
  );

  return (
    <html lang="en">
      <body className="antialiased w-screen h-screen screen-bg min-w-[800px]">
        <Providers initialState={initialState}>
          <Toaster />
          <header className="fixed top-0 left-0 right-0 flex items-center justify-between gap-2 px-xl py-lg">
            <LogoHeader />

            <div className="flex flex-row items-center gap-2">
              <ConnectControl />
            </div>
          </header>
          <main className=" h-full flex flex-col items-center flex-grow">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
