import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  toast,
  ProcessingTip,
  HelperText,
  ErrorTip,
  cn,
} from '@elytro/ui';
import { useWallet } from '@/contexts/wallet';
import { useEffect, useRef, useState } from 'react';
import ContactItem from '@/components/biz/ContactItem';
import { safeClipboard } from '@/utils/clipboard';
import { Check, Copy as CopyIcon, ExternalLink } from 'lucide-react';
import ShortedAddress from '@/components/ui/ShortedAddress';
import Copy from '@/components/ui/Copy';
import { walletImage } from '@elytro/ui/assets';
import { RecoveryStatusEn } from '@/constants/recovery';
import { safeOpen } from '@/utils/safeOpen';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { navigateTo } from '@/utils/navigation';
import { formatErrorMsg } from '@/utils/format';
import { getRecoveryRecord as fetchRecoveryRecordFromApi } from '@/utils/ethRpc/recovery';

const RECOVERY_APP_URL = 'https://recovery.elytro.com/';

type StepState = 'completed' | 'active' | 'inactive';

function StepIndicator({ state, stepNumber }: { state: StepState; stepNumber: number }) {
  if (state === 'completed') {
    return (
      <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-green-300 text-blue-900">
        <Check className="w-3.5 h-3.5" />
      </div>
    );
  }
  if (state === 'active') {
    return (
      <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-sm font-bold bg-brown-600 text-white">
        {stepNumber}
      </div>
    );
  }
  return (
    <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-sm font-bold bg-gray-450 text-white">
      {stepNumber}
    </div>
  );
}

function PageContent() {
  const { wallet } = useWallet();
  const [loading, setLoading] = useState(false);
  const [recoveryRecord, setRecoveryRecord] = useState<TRecoveryRecord | null>(null);
  const [sharedLink, setSharedLink] = useState<string>('');
  const [leftTime, setLeftTime] = useState({ hours: 48, minutes: 0, seconds: 0 });
  const prevStatusRef = useRef<RecoveryStatusEn | undefined>(undefined);
  const [targetTimeMs, setTargetTimeMs] = useState<number | null>(null);

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

  // When RECOVERY_STARTED: fetch validTime from API so countdown stays in sync with recovery app
  useEffect(() => {
    if (recoveryRecord?.status !== RecoveryStatusEn.RECOVERY_STARTED || !recoveryRecord?.recoveryID) return;
    let cancelled = false;
    fetchRecoveryRecordFromApi(recoveryRecord.recoveryID).then((apiRecord) => {
      if (cancelled || !apiRecord?.validTime) return;
      setTargetTimeMs(apiRecord.validTime * 1000);
    });
    return () => {
      cancelled = true;
    };
  }, [recoveryRecord?.status, recoveryRecord?.recoveryID]);

  // Reset when leaving RECOVERY_STARTED or when RECOVERY_READY
  useEffect(() => {
    const s = recoveryRecord?.status;
    if (s === RecoveryStatusEn.RECOVERY_READY) {
      setLeftTime({ hours: 0, minutes: 0, seconds: 0 });
      setTargetTimeMs(null);
    } else if (s === RecoveryStatusEn.RECOVERY_STARTED && prevStatusRef.current !== RecoveryStatusEn.RECOVERY_STARTED) {
      setLeftTime({ hours: 48, minutes: 0, seconds: 0 });
    } else if (s !== RecoveryStatusEn.RECOVERY_STARTED) {
      setTargetTimeMs(null);
    }
    prevStatusRef.current = s;
  }, [recoveryRecord?.status]);

  // Countdown tick: when RECOVERY_STARTED use targetTimeMs (synced) or local 48h fallback
  useEffect(() => {
    if (recoveryRecord?.status !== RecoveryStatusEn.RECOVERY_STARTED) return;

    const tick = () => {
      if (targetTimeMs != null) {
        const left = Math.max(0, targetTimeMs - Date.now());
        if (left <= 0) {
          setLeftTime({ hours: 0, minutes: 0, seconds: 0 });
          return;
        }
        setLeftTime({
          hours: Math.floor(left / (1000 * 60 * 60)),
          minutes: Math.floor((left % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((left % (1000 * 60)) / 1000),
        });
      } else {
        setLeftTime((prev) => {
          if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
          if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
          if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
          return prev;
        });
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [recoveryRecord?.status, targetTimeMs]);

  const generateShareLink = (path = '') => {
    const { recoveryID, address, chainId, approveHash: hash, fromBlock, owner, contacts, threshold } = recoveryRecord!;
    const params = new URLSearchParams({
      id: recoveryID,
      address,
      chainId: chainId.toString(),
      hash,
      from: fromBlock,
      owner,
      contacts: contacts.map((contact) => contact.address).join(','),
      threshold: threshold.toString(),
    });
    const base = RECOVERY_APP_URL.replace(/\/$/, '');
    return `${base}${path}?${params.toString()}`;
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
          <ProcessingTip body="Getting recovery contacts" subBody="" className="flex-1" />
        ) : (
          <ErrorTip title="Sorry we didn't find any recovery contact or failed to initiate recovery" />
        )}

        <div className="flex flex-row w-full mt-md gap-x-sm">
          <Button variant="secondary" onClick={() => history.back()} className="flex-1 bg-blue-300">
            Cancel
          </Button>
          {!loading && (
            <Button onClick={() => getRecoveryRecord()} className="flex-1">
              Retry
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (recoveryRecord?.status === RecoveryStatusEn.RECOVERY_COMPLETED) {
    const handleNext = async () => {
      await wallet.clearRecoveryRecord();
      navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Dashboard, { fromRecovery: '1' });
    };
    return (
      <div className="h-full flex flex-col justify-center items-center gap-y-xl text-center">
        <img src={walletImage} alt="Wallet" className="size-36 mt-10" />
        <div className="flex flex-col gap-y-sm">
          <h1 className="elytro-text-title mb-sm">Recovery completed</h1>
          <Button onClick={handleNext}>Enter wallet</Button>
        </div>
      </div>
    );
  }

  const status = recoveryRecord?.status;
  const isStep1Completed = status !== undefined && status !== RecoveryStatusEn.WAITING_FOR_SIGNATURE;
  const isStep2Completed = status === RecoveryStatusEn.RECOVERY_READY || status === RecoveryStatusEn.RECOVERY_COMPLETED;
  const isStep2Active = status === RecoveryStatusEn.SIGNATURE_COMPLETED || status === RecoveryStatusEn.RECOVERY_STARTED;
  const isStep3Active = status === RecoveryStatusEn.RECOVERY_READY;
  const isStep3Completed = status === RecoveryStatusEn.RECOVERY_COMPLETED;

  const step1State: StepState = isStep1Completed
    ? 'completed'
    : status === RecoveryStatusEn.WAITING_FOR_SIGNATURE
      ? 'active'
      : 'inactive';
  const step2State: StepState = isStep2Completed ? 'completed' : isStep2Active ? 'active' : 'inactive';
  const step3State: StepState = isStep3Completed ? 'completed' : isStep3Active ? 'active' : 'inactive';

  const showCountdown = isStep2Active; // Show countdown whenever Step 2 is active (before and after starting)
  const showStep2CTA = isStep2Active || isStep2Completed;

  const stepTitleClass = 'elytro-text-bold-body';
  const stepTitleInactiveClass = 'elytro-text-bold-body text-gray-600';

  const confirmedCount = recoveryRecord?.contacts?.filter((c) => c.confirmed).length ?? 0;
  const threshold = recoveryRecord?.threshold ?? 0;
  const progressPercent = threshold > 0 ? (confirmedCount / threshold) * 100 : 0;

  return (
    <div className="flex flex-col gap-y-sm min-h-full">
      {/* Wallet in recovery */}
      <div className="rounded-md bg-white px-md py-3 flex flex-row items-center justify-between">
        <span className="elytro-text-small text-gray-750">Wallet in recovery</span>
        <div className="flex flex-row items-center gap-x-2">
          <ShortedAddress
            address={recoveryRecord?.address || ''}
            chainId={recoveryRecord?.chainId}
            className="bg-white"
          />
          <Copy text={recoveryRecord?.address || ''} size="sm" iconOnly />
        </div>
      </div>

      {/* Step 1: Confirm recovery — expand with progress + contacts when active */}
      <div
        className={cn(
          'rounded-md bg-white',
          step1State === 'active'
            ? 'px-md py-4 flex flex-col gap-y-md'
            : 'px-md py-4 flex flex-row items-center gap-x-md'
        )}
      >
        <div className="flex flex-row items-center gap-x-md">
          <StepIndicator state={step1State} stepNumber={1} />
          <span className={step1State === 'active' ? `${stepTitleClass} text-gray-900` : stepTitleInactiveClass}>
            Confirm recovery
          </span>
        </div>
        {step1State === 'active' && (
          <>
            <div className="flex flex-col gap-y-2">
              <span className="elytro-text-small-body text-gray-600">
                {confirmedCount}/{threshold} confirmations needed
              </span>
              <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gray-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            <h2 className="elytro-text-small text-gray-600">Recovery contacts</h2>
            <div className="rounded-md overflow-hidden">
              {recoveryRecord?.contacts.map((contact, index) => (
                <ContactItem
                  key={contact.address}
                  contact={contact}
                  isFirst={index === 0}
                  isLast={index === (recoveryRecord?.contacts?.length ?? 1) - 1}
                  rightContent={
                    contact.confirmed ? (
                      <span className="elytro-text-tiny-body bg-green-300 px-xs py-3xs rounded-xs">Confirmed</span>
                    ) : (
                      <Button
                        variant="secondary"
                        size="tiny"
                        className="bg-blue-300 hover:bg-blue-450"
                        onClick={handleShareContact}
                      >
                        <CopyIcon className="size-md mr-xs stroke-blue-600" />
                        Get link
                      </Button>
                    )
                  }
                />
              ))}
            </div>
            <HelperText description="Share above links with contacts to confirm." />
          </>
        )}
      </div>

      {/* Step 2: Start recovery - countdown + CTA */}
      <div className="rounded-md bg-white px-md py-4 flex flex-col gap-y-md ">
        <div className="flex flex-row items-center gap-x-md">
          <StepIndicator state={step2State} stepNumber={2} />
          <span className={step2State === 'active' ? `${stepTitleClass} text-gray-900` : stepTitleInactiveClass}>
            Start recovery
          </span>
        </div>
        {showCountdown && (
          <div
            className={cn(
              'flex flex-row justify-center gap-x-sm flex-nowrap transition-opacity duration-300',
              status === RecoveryStatusEn.RECOVERY_STARTED ? 'countdown-fade-in' : 'opacity-50'
            )}
            aria-hidden={status !== RecoveryStatusEn.RECOVERY_STARTED}
          >
            <div className="flex flex-col items-center gap-y-1">
              <div className="elytro-text-title leading-normal text-center p-md rounded-sm bg-gray-150 w-14">
                {String(leftTime.hours).padStart(2, '0')}
              </div>
              <div className="elytro-text-tiny-body text-gray-600">Hours</div>
            </div>
            <div className="flex flex-col items-center gap-y-1">
              <div className="elytro-text-title leading-normal text-center p-md rounded-sm bg-gray-150 w-14">
                {String(leftTime.minutes).padStart(2, '0')}
              </div>
              <div className="elytro-text-tiny-body text-gray-600">Minutes</div>
            </div>
            <div className="flex flex-col items-center gap-y-1">
              <div className="elytro-text-title leading-normal text-center p-md rounded-sm bg-gray-150 w-14">
                {String(leftTime.seconds).padStart(2, '0')}
              </div>
              <div className="elytro-text-tiny-body text-gray-600">Seconds</div>
            </div>
          </div>
        )}
        {showStep2CTA && status !== RecoveryStatusEn.RECOVERY_READY && (
          <Button variant="secondary" className="w-full" onClick={() => safeOpen(generateShareLink())}>
            <ExternalLink className="size-4 mr-xs stroke-blue-600" />
            Start in recovery app
          </Button>
        )}
      </div>

      {/* Step 3: Complete recovery + CTA when ready */}
      <div
        className={cn(
          'rounded-md bg-white',
          step3State === 'active'
            ? 'px-md py-md flex flex-col gap-y-md'
            : 'px-md py-4 flex flex-row items-center gap-x-md'
        )}
      >
        <div className="flex flex-row items-center gap-x-md">
          <StepIndicator state={step3State} stepNumber={3} />
          <div className="flex flex-col">
            <span className={step3State === 'active' ? `${stepTitleClass} text-gray-900` : stepTitleInactiveClass}>
              Complete recovery
            </span>
            {step3State === 'active' && (
              <span className="elytro-text-smaller-body text-gray-600 mt-1">
                This is the last step to regain wallet access
              </span>
            )}
          </div>
        </div>
        {status === RecoveryStatusEn.RECOVERY_READY && (
          <Button variant="secondary" className="w-full" onClick={() => safeOpen(generateShareLink('/start'))}>
            <ExternalLink className="size-4 mr-xs stroke-blue-600" />
            Complete in recovery app
          </Button>
        )}
      </div>

      <Dialog open={!!sharedLink}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Recovery link copied</DialogTitle>
            <DialogDescription>Send this link to your contact so they can confirm your recovery</DialogDescription>
          </DialogHeader>
          <pre
            className="elytro-text-code-body text-gray-500 w-full flex-grow px-lg py-md bg-gray-150 rounded-2xs transition-opacity whitespace-pre-wrap break-all"
            style={{ userSelect: 'text' }}
          >
            {sharedLink}
          </pre>
          <DialogFooter>
            <Button onClick={handleCloseShareDialog}>I&apos;ve done this</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function RetrieveContacts() {
  return (
    <SecondaryPageWrapper title="Recovery" showBack={false} noInnerCard>
      <PageContent />
    </SecondaryPageWrapper>
  );
}
