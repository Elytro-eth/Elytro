import BasicAccountInfo from '@/components/biz/BasicAccountInfo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Spin from '@/components/ui/Spin';
import Activities from '@/components/biz/Activities';
import { useAccount } from '@/contexts/account-context';
import Assets from '@/components/biz/Assets';
// import { Button } from '@/components/ui/button';
// import { Plus } from 'lucide-react';
import { useEffect } from 'react';

export default function Dashboard() {
  const { loading, getAccounts, updateAccount } = useAccount();

  useEffect(() => {
    getAccounts();
    updateAccount();
  }, []);

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

      {/* <Button
        variant="secondary"
        size="tiny"
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2"
      >
        <Plus className="w-3 h-3 mr-1 duration-100 group-hover:stroke-white" />
        Import token
      </Button> */}
    </div>
  );
}
