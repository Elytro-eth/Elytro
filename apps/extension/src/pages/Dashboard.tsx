import BasicAccountInfo from '@/components/biz/BasicAccountInfo';
import Spin from '@/components/ui/Spin';
import { useAccount } from '@/contexts/account-context';
import { CheckCircle2Icon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { navigateTo } from '@/utils/navigation';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import BetaNotice from '@/components/ui/BetaNotice';
import PageLayout from '@/components/ui/PageLayout';
import DashboardTabs from '@/components/biz/DashboardTabs';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { getLocalContactsSetting } from '@/utils/contacts';
import { useWallet } from '@/contexts/wallet';
import { toast } from '@/hooks/use-toast';
import dayjs from 'dayjs';
import { writeFile } from '@/utils/file';

export default function Dashboard() {
  const { loading, reloadAccount, currentAccount } = useAccount();
  const [isPrivacyMode] = useLocalStorage('isPrivacyMode', false);
  const { wallet } = useWallet();

  const handleReload = () => {
    reloadAccount(true);
  };

  const handleDownloadRecoveryContacts = async () => {
    const { contacts, threshold } = await getLocalContactsSetting(currentAccount.address);

    const isOnchainContactsChanged = await wallet.checkRecoveryContactsSettingChanged(
      contacts.map((contact) => contact.address),
      Number(threshold)
    );

    if (isOnchainContactsChanged) {
      toast({
        title: 'Local recovery contacts setting is not the same as onchain',
        description:
          'We are not able to download the recovery contacts because the local setting is not the same as onchain.',
      });
      return;
    }

    const date = dayjs().format('YYYY-MM-DD-HH-mm');
    const data = {
      address: currentAccount.address,
      chainId: currentAccount.chainId,
      contacts,
      threshold: String(threshold),
    };
    writeFile(JSON.stringify(data), `${currentAccount.address}-elytro-recovery-contacts-${date}.json`);
    toast({
      title: 'Recovery contacts downloaded',
      description: 'You can find it in the Downloads folder',
    });
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
          <div className="absolute bottom-0 rounded-md left-0 right-0 flex justify-center pt-2 bg-white flex-col">
            <Button
              variant="secondary"
              size="tiny"
              className="m-auto mb-2"
              onClick={() => {
                navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.ImportToken);
              }}
            >
              <Plus className="w-3 h-3 mr-1 duration-100 group-hover:stroke-white" />
              Import token
            </Button>
            <BetaNotice text="We're in beta. Please keep deposits small." closeable />
          </div>
        </div>
      </PageLayout.Body>
      <PageLayout.Footer>
        {currentAccount.isRecoveryEnabled && (
          <div className="h-9 p-2 flex flex-row justify-between items-center bg-[#CEE2EB]">
            <div className="flex flex-row items-center">
              <CheckCircle2Icon className="w-4 h-4 mr-1 fill-white stroke-dark-blue" />
              Social Recovery {isPrivacyMode ? '(Privacy)' : ''} enabled
            </div>
            {isPrivacyMode && (
              <div className="flex flex-row items-center" onClick={handleDownloadRecoveryContacts}>
                Recovery file
              </div>
            )}
          </div>
        )}
      </PageLayout.Footer>
    </PageLayout>
  );
}
