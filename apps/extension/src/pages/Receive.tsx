import { useAccount } from '@/contexts/account-context';
import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';
import { Copy, Check } from 'lucide-react';
import ReceiveAddressBadge from '@/components/biz/ReceiveAddressBadge';
import { CircleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { safeClipboard } from '@/utils/clipboard';
import { useChain } from '@/contexts/chain-context';
import Spin from '@/components/ui/Spin';
import { useCallback, useState } from 'react';

export default function Receive() {
  const {
    currentAccount: { address },
  } = useAccount();
  const { currentChain } = useChain();
  const [isCopied, setIsCopied] = useState(false);

  // const handleClickChainSelector = () => {
  //   alert('TODO: Chain selector?');
  // };

  const onCopied = useCallback((error?: Error) => {
    if (!error) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1000);
    }
  }, []);

  const onCopy = useCallback(() => {
    safeClipboard(address!, false, onCopied);
  }, [address]);

  if (!currentChain) {
    return <Spin isLoading />;
  }

  return (
    <SecondaryPageWrapper title="Receive">
      <div className="flex flex-col gap-y-5 items-center w-full relative">
        {/* Chain info */}
        <div className="flex flex-row items-center justify-between w-full">
          <div className="flex flex-row items-center gap-2  ">
            <img
              src={currentChain.icon}
              alt={currentChain?.name}
              className="size-8 rounded-full border border-gray-50"
            />
            <div className="flex flex-col">
              <div className="elytro-text-bold-body">{currentChain?.name}</div>
              <div className="elytro-text-tiny-body text-gray-600">
                This address only accepts {currentChain?.name} assets.
              </div>
            </div>
          </div>

          {/* <ChevronDown
            className="elytro-clickable-icon"
            onClick={handleClickChainSelector}
          /> */}
        </div>

        <ReceiveAddressBadge address={address!} chainId={currentChain.id} />

        <div className="flex flex-row items-center gap-2 w-full text-left">
          <CircleAlert className="elytro-clickable-icon size-3" />
          <div className="elytro-text-tiny-body text-gray-600">
            Copy address & paste it to your sender to receive tokens.
          </div>
        </div>

        {/* Copy Address */}
        <Button
          variant="secondary"
          size="large"
          className="w-full group hover:stroke-white"
          onClick={onCopy}
        >
          {isCopied ? (
            <>
              <Check className="elytro-clickable-icon mr-2xs group-hover:stroke-white" />
              Address copied
            </>
          ) : (
            <>
              <Copy className="elytro-clickable-icon mr-2xs group-hover:stroke-white" />
              Copy address
            </>
          )}
        </Button>
      </div>
    </SecondaryPageWrapper>
  );
}
