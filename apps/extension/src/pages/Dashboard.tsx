import BasicAccountInfo from '@/components/biz/BasicAccountInfo';
import Spin from '@/components/ui/Spin';
import { useAccount } from '@/contexts/account-context';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { navigateTo } from '@/utils/navigation';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import BetaNotice from '@/components/ui/BetaNotice';
import PageLayout from '@/components/ui/PageLayout';
import DashboardTabs from '@/components/biz/DashboardTabs';

export default function Dashboard() {
  const { loading, reloadAccount } = useAccount();

  const handleReload = () => {
    reloadAccount(true);
  };

  return (
    <PageLayout className="w-full h-screen bg-gray-150">
      <PageLayout.Header className="p-2">
        <Spin isLoading={loading} />
        <BasicAccountInfo />
      </PageLayout.Header>
      <PageLayout.Body className="px-2">
        <div className="rounded-xl bg-white h-full">
          <DashboardTabs loading={loading} onReload={handleReload} />
        </div>
      </PageLayout.Body>
      <PageLayout.Footer>
        <div className="flex justify-center m-2">
          <Button
            variant="secondary"
            size="tiny"
            className="m-auto"
            onClick={() => {
              navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.ImportToken);
            }}
          >
            <Plus className="w-3 h-3 mr-1 duration-100 group-hover:stroke-white" />
            Import token
          </Button>
        </div>
        <BetaNotice text="We're in beta. Please keep deposits small." closeable />
      </PageLayout.Footer>
    </PageLayout>
  );
}
