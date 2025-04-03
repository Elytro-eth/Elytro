import BasicAccountInfo from '@/components/biz/BasicAccountInfo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Spin from '@/components/ui/Spin';
import Activities from '@/components/biz/Activities';
import { useAccount } from '@/contexts/account-context';
import Assets from '@/components/biz/Assets';
import { Plus, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { navigateTo } from '@/utils/navigation';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import BetaNotice from '@/components/ui/BetaNotice';
import {
  PageLayout,
  PageLayoutBody,
  PageLayoutFooter,
  PageLayoutHeader,
} from '@/components/ui/PageLayout';
// import { Button } from '@/components/ui/button';
// import { Plus } from 'lucide-react';

export default function Dashboard() {
  const { loading, reloadAccount } = useAccount();

  const handleReload = () => {
    reloadAccount(true);
  };

  return (
    <div className="w-full h-screen bg-gray-150">
      <PageLayout>
        <PageLayoutHeader className="p-2">
          <Spin isLoading={loading} />
          {/* Account Basic Info */}
          <BasicAccountInfo />
        </PageLayoutHeader>
        <PageLayoutBody className="px-2">
          <div className="rounded-3xl rounded-xl bg-white h-full">
            <Tabs
              defaultValue="assets"
              className=""
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                boxSizing: 'border-box',
              }}
            >
              <TabsList className="px-5 relative border-b-1">
                <TabsTrigger value="assets">Tokens</TabsTrigger>
                <TabsTrigger value="activities">Activity</TabsTrigger>
                <div className="absolute right-4 mt-1">
                  <RefreshCcw
                    className="elytro-clickable-icon"
                    color="gray"
                    onClick={handleReload}
                  />
                </div>
              </TabsList>
              <div
                className="flex flex-col"
                style={{
                  flex: '1',
                  height: '100%',
                  overflow: 'auto',
                  boxSizing: 'border-box',
                }}
              >
                <TabsContent value="assets">
                  <Assets />
                </TabsContent>
                <TabsContent className="flex-1" value="activities">
                  <Activities />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </PageLayoutBody>
        <PageLayoutFooter>
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
          <BetaNotice
            text="We're in beta. Please keep deposits small."
            closeable
          />
        </PageLayoutFooter>
      </PageLayout>
    </div>
  );
}
