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
      <PageLayout.Body className="px-2 py-2">
        <div className="rounded-xl bg-white h-full flex flex-col relative">
          <div className="flex-1 overflow-auto pb-[52px]">
            <DashboardTabs loading={loading} onReload={handleReload} />
          </div>
          <div className="absolute bottom-2 left-2 right-2 flex justify-center py-2 bg-white">
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
        </div>
      </PageLayout.Body>
      <PageLayout.Footer>
        <BetaNotice text="We're in beta. Please keep deposits small." closeable />
      </PageLayout.Footer>
    </PageLayout>
  );
}
