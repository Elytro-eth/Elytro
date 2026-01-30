import { Tabs, TabsContent, TabsList, TabsTrigger } from '@elytro/ui';
import { RefreshCcw } from 'lucide-react';
import Activities from '@/components/biz/Activities';
import Assets from '@/components/biz/Assets';
import useSearchParams from '@/hooks/use-search-params';
import { useEffect, useState } from 'react';
import Apps from './Apps';
import SetupTab from './SetupTab';
import { useAccount } from '@/contexts/account-context';
import { useLocalStorage } from '@/hooks/use-local-storage';
import AddOnsTab from './AddOnsTab';

interface DashboardTabsProps {
  onReload: () => void;
  onTabChange?: (tab: string) => void;
}

export const TABS_KEYS = {
  SETUP: 'setup',
  ASSETS: 'assets',
  ACTIVITIES: 'activities',
  APPS: 'apps',
  ADD_ONS: 'add-ons',
};

const TabsConfig = [
  {
    key: TABS_KEYS.SETUP,
    label: 'Setup',
    component: <SetupTab />,
  },
  {
    key: TABS_KEYS.ASSETS,
    label: 'Tokens',
    component: <Assets />,
  },
  {
    key: TABS_KEYS.ACTIVITIES,
    label: 'Activity',
    component: <Activities />,
  },
  {
    key: TABS_KEYS.APPS,
    label: 'Apps',
    component: <Apps />,
  },
  {
    key: TABS_KEYS.ADD_ONS,
    label: 'Add-ons',
    component: <AddOnsTab />,
  },
];

const UNDEPLOY_TABS_KEYS = [TABS_KEYS.SETUP, TABS_KEYS.ASSETS, TABS_KEYS.ACTIVITIES];
const DEPLOYED_TABS_KEYS = [TABS_KEYS.APPS, TABS_KEYS.ACTIVITIES, TABS_KEYS.ASSETS, TABS_KEYS.ADD_ONS];

export default function DashboardTabs({ onReload, onTabChange }: DashboardTabsProps) {
  const searchParams = useSearchParams();
  const { currentAccount } = useAccount();

  const [hasSetupPassed] = useLocalStorage(`hasSetupPassed_${currentAccount.address}`, false);
  const tabKeys = hasSetupPassed || currentAccount.isRecoveryEnabled ? DEPLOYED_TABS_KEYS : UNDEPLOY_TABS_KEYS;
  const tabs = TabsConfig.filter((tab) => tabKeys.includes(tab.key));

  const [activeTab, setActiveTab] = useState(searchParams.tab || TABS_KEYS.ASSETS);
  const [loading, setLoading] = useState(false);

  const handleReload = () => {
    setLoading(true);
    onReload();
    setTimeout(() => setLoading(false), 500);
  };

  useEffect(() => {
    const newTab = searchParams.tab || tabKeys[0];
    setActiveTab(newTab);
    onTabChange?.(newTab);
  }, [searchParams.tab, tabKeys.length]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    onTabChange?.(value);
    // Silently update URL without triggering a page reload
    const newUrl = new URL(window.location.href);
    newUrl.search = '';
    window.history.replaceState({}, '', newUrl.toString());
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col flex-1 h-full box-border">
      <TabsList className="pl-4 pr-4 relative">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.key} value={tab.key}>
            {tab.label}
          </TabsTrigger>
        ))}
        <button
          type="button"
          onClick={handleReload}
          aria-label="Refresh account data"
          disabled={loading}
          className="ml-auto"
        >
          <RefreshCcw
            className="elytro-clickable-icon stroke-gray-450"
            aria-hidden="true"
            style={{
              animation: loading ? 'spin 1s linear infinite' : 'none',
            }}
          />
        </button>
      </TabsList>
      <div className="flex flex-col flex-1 h-full overflow-auto box-border scrollbar-thin">
        {tabs.map((tab) => (
          <TabsContent key={tab.key} value={tab.key}>
            {tab.component}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}
