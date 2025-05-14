import React from 'react';
import ReactDOM from 'react-dom/client';
import HashRouter from '@/components/ui/HashRouter';
import PageContainer from '@/components/ui/PageContainer';
import { bootstrap } from '@/utils/bootstrap';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ApprovalProvider } from '@/contexts/approval-context';
import { AccountProvider } from '@/contexts/account-context';
import { ApolloProvider } from '@apollo/client';
import { routes } from '@/routes';
import { client } from '@/requests';
import { TxProvider } from '@/contexts/tx-context';
import { AlerterProvider } from '@/components/ui/alerter';
import { initializeSecurity } from '@/utils/security';
import ApprovalDialog from './components/biz/ApprovalDialog';

initializeSecurity({ isUI: true });

const main = () => {
  const SidePanelApp: React.FC = () => (
    <ApolloProvider client={client}>
      <PageContainer>
        <AccountProvider>
          <ApprovalProvider>
            <TxProvider>
              {/*  according to chrome dev team. the minimum width of the side panel is 360px */}
              <TooltipProvider>
                <AlerterProvider>
                  <HashRouter routes={routes} />
                  <ApprovalDialog />
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
