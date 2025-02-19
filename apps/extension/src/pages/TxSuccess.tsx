import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';
import { Button } from '@/components/ui/button';
import { useChain } from '@/contexts/chain-context';
import useSearchParams from '@/hooks/use-search-params';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { navigateTo } from '@/utils/navigation';
import { ExternalLink } from 'lucide-react';

export default function TxSuccess() {
  const { openExplorer } = useChain();
  const handleClose = () => {
    if (history.length > 1) {
      navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Dashboard);
    } else {
      window.close();
    }
  };

  const opHash = useSearchParams()['opHash'];

  return (
    <SecondaryPageWrapper
      title="Success"
      showBack={false}
      closeable
      onClose={handleClose}
    >
      <div className="flex flex-col items-center justify-center h-full gap-y-sm">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="101"
          height="101"
          viewBox="0 0 101 101"
          fill="none"
        >
          <path
            d="M50.1667 91.8333C73.1785 91.8333 91.8333 73.1785 91.8333 50.1667C91.8333 27.1548 73.1785 8.5 50.1667 8.5C27.1548 8.5 8.5 27.1548 8.5 50.1667C8.5 73.1785 27.1548 91.8333 50.1667 91.8333Z"
            fill="#234759"
          />
          <path
            d="M32.5 50.5L44.5 62.5L68.5 38.5"
            stroke="#CEF2B9"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="elytro-text-bold-body">Confirmed successfully</span>
        <Button
          variant="outline"
          size="tiny"
          onClick={() => {
            openExplorer(opHash);
          }}
        >
          <ExternalLink className="size-3 mr-2xs" />
          Transaction details
        </Button>
        <Button size="large" className="w-full" onClick={handleClose}>
          Close
        </Button>
      </div>
    </SecondaryPageWrapper>
  );
}
