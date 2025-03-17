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
// import { Button } from '@/components/ui/button';
// import { Plus } from 'lucide-react';

export default function Dashboard() {
  const { loading, reloadAccount } = useAccount();

  return (
    <div className="w-full h-full flex flex-col gap-2xl bg-gray-150 p-sm">
      <Spin isLoading={loading} />
      {/* Account Basic Info */}
      <BasicAccountInfo />

      <div className="h-full bg-white rounded-3xl ">
        <Tabs defaultValue="assets">
          <TabsList className="px-5">
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="activities">Activity</TabsTrigger>
            <div className="absolute right-8 mt-1">
              <RefreshCcw
                className="elytro-clickable-icon"
                color="gray"
                onClick={reloadAccount}
              />
            </div>
          </TabsList>
          <div className="flex flex-col">
            <TabsContent value="assets">
              <Assets />
            </TabsContent>
            <TabsContent className="flex-1" value="activities">
              <Activities />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <Button
        variant="secondary"
        size="tiny"
        className="fixed bottom-12 left-1/2 transform -translate-x-1/2"
        onClick={() => {
          navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.ImportToken);
        }}
      >
        <Plus className="w-3 h-3 mr-1 duration-100 group-hover:stroke-white" />
        Import token
      </Button>

      <BetaNotice text="We're in beta. Please keep deposits small." closeable />
    </div>
  );
}
