import ProcessingTip from '@/components/ui/ProcessingTip';
import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';
import { Button } from '@/components/ui/button';
import HelperText from '@/components/ui/HelperText';
import ShortedAddress from '@/components/ui/ShortedAddress';
import { useWallet } from '@/contexts/wallet';
import { useEffect, useState } from 'react';
import ErrorTip from '@/components/ui/ErrorTip';
import ContactItem from '@/components/biz/ContactItem';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from '@/components/ui/dialog';
import { safeClipboard } from '@/utils/clipboard';
import { Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import WalletImg from '@/assets/wallet.png';
import { RecoveryStatusEn } from '@/constants/recovery';
import { safeOpen } from '@/utils/safeOpen';
import { useChain } from '@/contexts/chain-context';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { navigateTo } from '@/utils/navigation';
import { formatErrorMsg } from '@/utils/format';

const RECOVERY_APP_URL = 'https://recovery.elytro.com/';

function PageContent() {
  const { wallet } = useWallet();
  const { currentChain } = useChain();
  const [loading, setLoading] = useState(false);
  const [recoveryRecord, setRecoveryRecord] = useState<TRecoveryRecord | null>(null);
  const [sharedLink, setSharedLink] = useState<string>('');

  const getRecoveryRecord = async () => {
    try {
      setLoading(true);
      const recoveryRecord = await wallet.getRecoveryRecord();
      if (recoveryRecord) {
        setRecoveryRecord(recoveryRecord);
      } else {
        throw new Error('No recovery record found');
      }
    } catch (error) {
      toast({
        title: 'Failed to get recovery record',
        description: formatErrorMsg(error),
      });
      navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Home);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getRecoveryRecord();
  }, []);

  useEffect(() => {
    if (!recoveryRecord) {
      return;
    }

    const interval = setInterval(async () => {
      const newRecoveryRecord = await wallet.getRecoveryRecord();
      setRecoveryRecord((prev) => {
        if (prev?.status !== newRecoveryRecord?.status) {
          return newRecoveryRecord;
        }
        return prev;
      });
    }, 5_000);
    return () => clearInterval(interval);
  }, [recoveryRecord, wallet]);

  const generateShareLink = () => {
    const { recoveryID, address, chainId, approveHash: hash, fromBlock, owner } = recoveryRecord!;
    const params = new URLSearchParams({
      id: recoveryID,
      address,
      chainId: chainId.toString(),
      hash,
      from: fromBlock,
      owner,
    });

    return `${RECOVERY_APP_URL}?${params.toString()}`;
  };

  const handleShareContact = () => {
    const shareContent = generateShareLink();
    if (shareContent) {
      setSharedLink(shareContent);
      safeClipboard(shareContent);
    }
  };

  const handleCloseShareDialog = () => {
    setSharedLink('');
  };

  if (!recoveryRecord?.contacts?.length) {
    return (
      <div className="flex flex-col items-center justify-between gap-y-sm">
        {loading ? (
          <ProcessingTip body="Fetching" subBody="" className="flex-1" />
        ) : (
          <ErrorTip title="Sorry we didn't find any recovery contact or failed to initiate recovery" />
        )}

        <div className="flex flex-row w-full mt-md gap-x-sm">
          <Button variant="secondary" onClick={() => history.back()} className="flex-1">
            Cancel
          </Button>
          <Button onClick={() => getRecoveryRecord()} className="flex-1">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (recoveryRecord?.status === RecoveryStatusEn.RECOVERY_COMPLETED) {
    const handleNext = () => {
      navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Dashboard);
    };
    return (
      <div className="h-full flex flex-col justify-center items-center gap-y-xl text-center">
        <img src={WalletImg} alt="Wallet" className="size-36 mt-10" />
        <div className="flex flex-col gap-y-sm">
          <h1 className="elytro-text-title mb-sm">Recovery completed</h1>
          <Button onClick={handleNext}>Enter wallet</Button>
        </div>
      </div>
    );
  }

  if (recoveryRecord?.status === RecoveryStatusEn.SIGNATURE_COMPLETED) {
    return (
      <div className="h-full flex flex-col items-center gap-y-xl text-center">
        <img src={WalletImg} alt="Wallet" className="size-36 mt-10" />
        <div className="flex flex-col gap-y-sm">
          <h1 className="elytro-text-title">Enough signatures collected</h1>
          <p className="text-gray-600 elytro-text-smaller-body">Complete your recovery in recovery app</p>
        </div>
        <Button
          onClick={() => {
            safeOpen(generateShareLink());
          }}
        >
          Launch recovery app
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-y-md">
      <h1 className="elytro-text-bold-body ">Wallet recovery</h1>

      <HelperText
        title={`${recoveryRecord?.threshold} signatures required`}
        description="This requirement was set up by you"
        className="bg-light-green text-gray-750"
      />

      <ShortedAddress address={recoveryRecord?.address} chainId={currentChain?.id} />

      <div className="flex flex-col gap-y-sm">
        {recoveryRecord?.contacts.map((contact) => (
          <ContactItem
            key={contact.address}
            contact={contact}
            rightContent={
              // TODO: use confirm status to decide whether to show the copy button
              contact.confirmed ? (
                <span className="elytro-text-tiny-body bg-light-green px-xs py-3xs rounded-xs">Signed</span>
              ) : (
                <Button variant="secondary" size="tiny" className="group" onClick={handleShareContact}>
                  <Copy className="size-md mr-xs group-hover:stroke-white" />
                  Share link
                </Button>
              )
            }
          />
        ))}
      </div>

      <Dialog open={!!sharedLink}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Recovery link copied</DialogTitle>
            <DialogDescription>Send this link to your contact so they can sign your recovery.</DialogDescription>
          </DialogHeader>

          <pre
            className="elytro-text-code-body text-gray-500 w-full flex-grow px-lg py-md bg-gray-150 rounded-2xs
              transition-opacity whitespace-pre-wrap break-all"
            style={{ userSelect: 'text' }}
          >
            {sharedLink}
          </pre>

          <DialogFooter>
            <Button size="small" onClick={handleCloseShareDialog}>
              I&apos;ve done this
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function RetrieveContacts() {
  return (
    <SecondaryPageWrapper title="Recovery" showBack={false}>
      <PageContent />
    </SecondaryPageWrapper>
  );
}
