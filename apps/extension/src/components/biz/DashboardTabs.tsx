import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCcw } from 'lucide-react';
import Activities from '@/components/biz/Activities';
import Assets from '@/components/biz/Assets';
import useSearchParams from '@/hooks/use-search-params';
import { useState } from 'react';
import Apps from './Apps';

interface DashboardTabsProps {
  loading: boolean;
  onReload: () => void;
}

export const TABS_KEYS = {
  ASSETS: 'assets',
  ACTIVITIES: 'activities',
  APPS: 'apps',
};

const TabsConfig = [
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
];

export default function DashboardTabs({ loading, onReload }: DashboardTabsProps) {
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState(searchParams.tab || TABS_KEYS.ASSETS);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Silently update URL without triggering a page reload
    const newUrl = new URL(window.location.href);
    newUrl.search = '';
    window.history.replaceState({}, '', newUrl.toString());
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col flex-1 h-full box-border">
      <TabsList className="px-5 relative">
        {TabsConfig.map((tab) => (
          <TabsTrigger key={tab.key} value={tab.key}>
            {tab.label}
          </TabsTrigger>
        ))}
        <div className="absolute right-4 mt-1">
          <RefreshCcw
            className={`elytro-clickable-icon ${loading ? 'animate-spin' : ''}`}
            color="gray"
            onClick={onReload}
            aria-label="Refresh account data"
          />
        </div>
      </TabsList>
      <div className="flex flex-col flex-1 h-full overflow-auto box-border scrollbar-thin">
        {TabsConfig.map((tab) => (
          <TabsContent key={tab.key} value={tab.key}>
            {tab.component}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}
