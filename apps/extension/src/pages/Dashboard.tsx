import BasicAccountInfo from '@/components/biz/BasicAccountInfo';
import Spin from '@/components/ui/Spin';
import { useAccount } from '@/contexts/account-context';
import { Check, Plus, AlertTriangle } from 'lucide-react';
import { navigateTo } from '@/utils/navigation';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { useState, useEffect } from 'react';
import PageLayout from '@/components/ui/PageLayout';
import DashboardTabs, { TABS_KEYS } from '@/components/biz/DashboardTabs';
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState(TABS_KEYS.ASSETS);
  const [recoveryStatus, setRecoveryStatus] = useState<{
    /* Recovery setup detection */ isEnabled: boolean;
    hasLocalSettings: boolean;
    isInSync: boolean;
  }>({
    isEnabled: false,
    hasLocalSettings: false,
    isInSync: true,
  });

  useEffect(() => {
    const checkRecoveryStatus = async () => {
      if (!currentAccount?.address) return;

      try {
        const recoveryData = await wallet.queryRecoveryContactsByAddress(currentAccount.address);
        console.log('Recovery Data:', recoveryData);

        const onchainInfo = await wallet.getRecoveryInfo(currentAccount.address);
        const zeroHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
        const onchainEnabled = !!onchainInfo?.contactsHash && onchainInfo.contactsHash !== zeroHash;

        const isEnabled = (!!recoveryData && recoveryData.contacts.length > 0) || onchainEnabled;

        const { contacts, threshold } = await getLocalContactsSetting(currentAccount.address);
        const hasLocalSettings = contacts.length > 0 && Number(threshold) > 0;

        let isInSync = true;
        if (hasLocalSettings && isEnabled) {
          if (recoveryData) {
            isInSync = !(await wallet.checkRecoveryContactsSettingChanged(
              recoveryData.contacts,
              recoveryData.threshold
            ));
          } else {
            isInSync = !(await wallet.checkRecoveryContactsSettingChanged(
              contacts.map((c) => c.address),
              Number(threshold)
            ));
          }
        }

        setRecoveryStatus({
          isEnabled,
          hasLocalSettings,
          isInSync,
        });
      } catch (error) {
        console.error('Failed to check recovery status:', error);
        setRecoveryStatus({
          isEnabled: false,
          hasLocalSettings: false,
          isInSync: true,
        });
      }
    };

    checkRecoveryStatus();
  }, [currentAccount?.address, wallet]);

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
        title: 'Local recovery records expired',
        description: '',
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
      description: '',
    });
  };

  return (
    <PageLayout className="w-full h-screen bg-fade-green">
      <PageLayout.Header className="p-2">
        <Spin isLoading={loading} />
        <BasicAccountInfo />
      </PageLayout.Header>
      <PageLayout.Body className="px-2 py-2">
        <div className="rounded-xl bg-white h-full flex flex-col relative">
          <div className="flex-1 overflow-auto pb-[52px]">
            <DashboardTabs onReload={handleReload} onTabChange={setActiveTab} />
          </div>

          <div className="absolute bottom-0 rounded-md left-0 right-0 flex justify-center pt-2 flex-col">
            {activeTab === TABS_KEYS.ASSETS && (
              <button
                type="button"
                className="m-auto mb-2 flex flex-row items-center group cursor-pointer text-gray-450 hover:text-gray-600 transition-colors"
                onClick={() => {
                  navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.ImportToken);
                }}
                aria-label="Import token"
              >
                <Plus
                  className="w-3 h-3 mr-1 duration-100 stroke-gray-450 group-hover:stroke-gray-600"
                  aria-hidden="true"
                />
                Import token
              </button>
            )}

            {/* Recovery Status */}
            {
              <button
                type="button"
                className={`text-xs text-left cursor-pointer h-8 transition-all duration-200 ${
                  recoveryStatus.isEnabled ? 'bg-light-green' : 'bg-yellow-100'
                } ${isExpanded ? 'w-full rounded-b-sm ' : 'w-[50px] rounded-bl-sm'}`}
                onClick={() => setIsExpanded(!isExpanded)}
                aria-label={isExpanded ? 'Collapse recovery status' : 'Expand recovery status'}
                aria-expanded={isExpanded}
              >
                {isExpanded ? (
                  <div className="px-4 py-2 flex items-center w-full animate-in fade-in duration-150 delay-200 fill-mode-backwards">
                    <div className="flex flex-row justify-between items-center w-full">
                      <div className="flex flex-row items-center">
                        {recoveryStatus.isEnabled ? (
                          <>
                            <Check className="w-4 h-4 p-0.5 mr-2 bg-white rounded-full" />
                            <span>Recovery {isPrivacyMode ? '(Private)' : ''} enabled</span>
                            {!recoveryStatus.isInSync && (
                              <span className="ml-2 text-xs text-yellow-600">(Settings out of sync)</span>
                            )}
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 mr-1 stroke-yellow-600" />
                            <span className="text-yellow-700">Recovery not set up</span>
                            <button
                              type="button"
                              className="flex flex-row items-center cursor-pointer text-yellow-600 bg-white hover:text-yellow-700 rounded-full px-2 ml-2 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.RecoverySetting);
                              }}
                              aria-label="Set up recovery"
                            >
                              Set up now
                            </button>
                          </>
                        )}
                      </div>
                      {isPrivacyMode && recoveryStatus.hasLocalSettings && recoveryStatus.isEnabled && (
                        <button
                          type="button"
                          className="flex flex-row items-center cursor-pointer bg-white hover:bg-light-blue rounded-full px-2 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadRecoveryContacts();
                          }}
                          aria-label="Download recovery contacts file"
                        >
                          Recovery file
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-2 flex items-center">
                    {recoveryStatus.isEnabled ? (
                      <Check className="w-4 h-4 p-0.5 mt-[1px] bg-white rounded-full" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 mt-[1px] stroke-yellow-600" />
                    )}
                  </div>
                )}
              </button>
            }

            {/* <BetaNotice text="We're in beta. Please keep deposits small." closeable /> */}
          </div>
        </div>
      </PageLayout.Body>
    </PageLayout>
  );
}
