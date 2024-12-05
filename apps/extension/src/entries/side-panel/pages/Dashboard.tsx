import BasicAccountInfo from '../components/BasicAccountInfo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Spin from '@/components/Spin';
import Activities from '../components/Activities';
import { useAccount } from '../contexts/account-context';
import Assets from '../components/Assets';

export default function Dashboard() {
  const { loading } = useAccount();

  return (
    <div className="w-full h-full flex flex-col gap-2xl bg-gray-50 px-2">
      <Spin isLoading={loading} />

      {/* Account Basic Info */}
      <BasicAccountInfo />

      <div className="h-full">
        <div className="h-full bg-white rounded-3xl ">
          <Tabs defaultValue="assets" className="px-4">
            <TabsList>
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
      </div>
    </div>
  );
}
