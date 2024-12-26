import React from 'react';
import ReactDOM from 'react-dom/client';
import HashRouter from '@/components/HashRouter';
import PageContainer from '@/components/PageContainer';
import { bootstrap } from '@/utils/bootstrap';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ApprovalProvider } from './contexts/approval-context';
import { AccountProvider } from './contexts/account-context';
import { ApolloProvider } from '@apollo/client';
import { routes } from './routes';
import SignTxModal from '@/entries/side-panel/components/SignTxModal';
import { client } from '@/requests';
import SendTxModal from './components/SendTxModal';
import { TxProvider } from './contexts/tx-context';
import { AlerterProvider } from '@/components/ui/alerter';
import AutoLockProvider from './components/AutoLockProvider';

const main = () => {
  const SidePanelApp: React.FC = () => (
    <ApolloProvider client={client}>
      <PageContainer className="max-w-screen-md min-w-[360px]">
        <AccountProvider>
          <ApprovalProvider>
            <TxProvider>
              {/*  according to chrome dev team. the minimum width of the side panel is 360px */}
              <TooltipProvider>
                <AlerterProvider>
                  <AutoLockProvider>
                    <HashRouter routes={routes} />
                    <SignTxModal />
                    <SendTxModal />
                  </AutoLockProvider>
                </AlerterProvider>
                {/* <UserOpConfirmDialog /> */}
              </TooltipProvider>
            </TxProvider>
          </ApprovalProvider>
        </AccountProvider>
      </PageContainer>
    </ApolloProvider>
  );

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <SidePanelApp />
    </React.StrictMode>
  );
};

bootstrap(main);
