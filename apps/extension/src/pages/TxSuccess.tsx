import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';
import { Button } from '@/components/ui/button';
import { useChain } from '@/contexts/chain-context';
import useSearchParams from '@/hooks/use-search-params';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { navigateTo } from '@/utils/navigation';
import { ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { useInterval } from 'usehooks-ts';

export default function TxSuccess() {
  const { openExplorer } = useChain();
  const [lastSeconds, setLastSeconds] = useState(5);

  const { fromAppCall, opHash } = useSearchParams();

  useInterval(() => {
    setLastSeconds((prev) => {
      if (prev === 1) {
        handleClose();
      }
      return prev - 1;
    });
  }, 1000);

  const handleClose = () => {
    if (fromAppCall === '1') {
      window.close();
    } else {
      navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Dashboard);
    }
  };

  return (
    <SecondaryPageWrapper
      title="Success"
      showBack={false}
      closeable
      onClose={handleClose}
    >
      <div className="flex flex-col items-center justify-center gap-y-sm">
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

        {fromAppCall === '1' && (
          <div className="w-full rounded-sm bg-gray-150 px-lg py-md">
            <p className="elytro-text-small-bold text-gray-750 mb-2xs">
              See an error?
            </p>
            <p className="elytro-text-tiny-body text-gray-600">
              Some apps are not yet adapted to new account standards. But don’t
              worry, the transaction was successful.
            </p>
          </div>
        )}

        <Button size="large" className="w-full mt-10" onClick={handleClose}>
          Close ({lastSeconds}s)
        </Button>
      </div>
    </SecondaryPageWrapper>
  );
}
