import './globals.css';
import { Providers } from './providers';
import ConnectControl from '@/components/ConnectControl';
import { LogoHeader } from '@/components/LogoHeader';
import { Toaster } from '@/components/ui/toaster';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Elytro Recovery',
  description: "Help you recover your or your friend's Elytro accounts",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased w-screen h-screen screen-bg min-w-[800px]">
        <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
          <Providers>
            <Toaster />
            <header className="min-w-[800px] fixed top-0 left-0 right-0 flex items-center justify-between gap-2 px-xl py-lg">
              <LogoHeader />

              <div className="flex flex-row items-center gap-2">
                <ConnectControl />
              </div>
            </header>

            <main className="h-full flex flex-col items-center flex-grow">{children}</main>
          </Providers>
        </Suspense>
      </body>
    </html>
  );
}
