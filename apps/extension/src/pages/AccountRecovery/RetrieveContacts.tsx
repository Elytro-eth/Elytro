import ProcessingTip from '@/components/ui/ProcessingTip';
import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';
import { Button } from '@/components/ui/button';
import HelperText from '@/components/ui/HelperText';
import ShortedAddress from '@/components/ui/ShortedAddress';
import { useWallet } from '@/contexts/wallet';
import useSearchParams from '@/hooks/use-search-params';
import { useState } from 'react';
import { useEffect } from 'react';
import { Address, isAddress } from 'viem';
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
import { IRecoveryRecord } from '@/utils/ethRpc/recovery';
import { toast } from '@/hooks/use-toast';
import WalletImg from '@/assets/wallet.png';
import { TRecoveryStatus } from '@/constants/recovery';
import { safeOpen } from '@/utils/safeOpen';
import { useChain } from '@/contexts/chain-context';

type TShareInfo = {
  type: 'link' | 'email';
  content: string;
};

const RECOVERY_APP_URL = 'https://elytro.vercel.app/';

function PageContent() {
  const { wallet } = useWallet();
  const { address } = useSearchParams();
  const { currentChain } = useChain();
  const [loading, setLoading] = useState(false);
  const [recoveryContacts, setRecoveryContacts] = useState<TRecoveryContact[]>(
    []
  );
  const [shareInfo, setShareInfo] = useState<Nullable<TShareInfo>>(null);
  const [recoveryRecord, setRecoveryRecord] = useState<IRecoveryRecord | null>(
    null
  );

  const getRecoveryRecord = async () => {
    try {
      setLoading(true);
      if (loading) return;
      const recoveryRecord = await wallet.getRecoveryRecord(address as Address);

      setRecoveryRecord(recoveryRecord || null);
      setRecoveryContacts(
        (recoveryRecord?.guardianInfo?.guardians || []).map((c) => ({
          address: c,
          confirmed: recoveryRecord?.guardianSignatures?.some(
            (s) => s.guardian === c
          ),
        }))
      );
    } catch (err) {
      console.error('Elytro: getRecoveryRecord error', err);
      setRecoveryContacts([]);
      setRecoveryRecord(null);
      toast({
        title: 'Failed to retrieve recovery contacts',
        description: 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (Number(currentChain?.id)) {
      getRecoveryRecord();
    }
  }, [address, currentChain?.id]);

  const handleShareContact = (contact: TRecoveryContact) => {
    if (!recoveryRecord || !recoveryRecord.recoveryRecordID) {
      toast({
        title: 'No recovery record found',
        description: 'Please try again later',
        variant: 'destructive',
      });
      return;
    }

    const isAddressContact = isAddress(contact.address);

    // TODO: change this to real link
    const shareContent = isAddressContact
      ? `${RECOVERY_APP_URL}?id=${recoveryRecord?.recoveryRecordID}`
      : `from: ${contact.address}\nto:guardian-dev@institution.soulwallet.io\nsubject: Approve address ${address} for hash ${recoveryRecord?.recoveryRecordID}\nbody: 可为空或者任意内容`;

    safeClipboard(shareContent, false);
    setShareInfo({
      type: isAddressContact ? 'link' : 'email',
      content: shareContent,
    });
  };

  if (!recoveryContacts.length) {
    return (
      <div className="flex flex-col items-center justify-between gap-y-sm">
        {loading ? (
          <ProcessingTip body="Fetching" subBody="" className="flex-1" />
        ) : (
          <ErrorTip title="Sorry we didn’t find any recovery contact" />
        )}
        <Button className="w-full mt-8" onClick={() => history.back()}>
          Cancel
        </Button>
      </div>
    );
  }

  if (recoveryRecord?.status === TRecoveryStatus.RECOVERY_COMPLETED) {
    return (
      <div className="h-full flex flex-col justify-center items-center gap-y-xl text-center">
        <img src={WalletImg} alt="Wallet" className="size-36" />
      </div>
    );
  }

  if (recoveryRecord?.status === TRecoveryStatus.SIGNATURE_COMPLETED) {
    return (
      <div className="h-full flex flex-col items-center gap-y-xl text-center">
        <img src={WalletImg} alt="Wallet" className="size-36" />
        <div className="flex flex-col gap-y-sm">
          <h1 className="elytro-text-title ">Enough signatures collected</h1>
          <p className="text-gray-600 elytro-text-smaller-body">
            Begin your recovery in recovery app
          </p>
        </div>
        <Button
          onClick={() => {
            safeOpen(
              `${RECOVERY_APP_URL}start?id=${recoveryRecord?.recoveryRecordID}`
            );
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
        title={`${recoveryRecord?.guardianInfo?.threshold} confirmations required`}
        description="This minimum requirement was set up by you"
        className="bg-light-green text-gray-750"
      />

      <ShortedAddress address={address} chainId={currentChain?.id} />

      <div className="flex flex-col gap-y-sm">
        {recoveryContacts.map((contact) => (
          <ContactItem
            key={contact.address}
            contact={contact}
            rightContent={
              // TODO: use confirm status to decide whether to show the copy button
              contact.confirmed ? (
                <span className="elytro-text-tiny-body bg-light-green px-xs py-3xs rounded-xs">
                  Confirmed
                </span>
              ) : (
                <Button
                  variant="secondary"
                  size="tiny"
                  className="group"
                  onClick={() => handleShareContact(contact)}
                >
                  <Copy className="size-md mr-xs group-hover:stroke-white" />
                  Copy {isAddress(contact.address) ? 'link' : 'email'}
                </Button>
              )
            }
          />
        ))}
      </div>

      <Dialog open={!!shareInfo}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Recovery {shareInfo?.type || '--'} copied</DialogTitle>
            <DialogDescription>
              Send this link to your contact so they can confirm.
            </DialogDescription>
          </DialogHeader>

          <pre
            className="elytro-text-code-body text-gray-500 w-full flex-grow px-lg py-md bg-gray-150 rounded-2xs
              transition-opacity whitespace-pre-wrap break-all"
            style={{ userSelect: 'text' }}
          >
            {shareInfo?.content || '--'}
          </pre>

          <DialogFooter>
            <Button size="small" onClick={() => setShareInfo(null)}>
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
