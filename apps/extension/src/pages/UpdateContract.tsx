import { Button } from '@/components/ui/button';
import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';
import { useAccount } from '@/contexts/account-context';
import ShortedAddress from '@/components/ui/ShortedAddress';
import WalletImg from '@/assets/wallet.png';
import { useState } from 'react';
import ProcessingTip from '@/components/ui/ProcessingTip';
import { navigateTo } from '@/utils/navigation';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { RawData } from '@/components/ui/rawData';
import { UserOpDetail } from '@/components/biz/UserOpDetail';
import { useTx } from '@/contexts/tx-context';

interface IConfrmComponentProps {
  onConfirm?: () => void;
}

function ConfirmComponent(props: IConfrmComponentProps) {
  const { onConfirm = () => {} } = props;
  const {
    currentAccount: { chainId },
  } = useAccount();
  const { requestType, userOp, calcResult, decodedDetail } = useTx();
  return (
    <>
      <UserOpDetail
        requestType={requestType!}
        calcResult={calcResult}
        chainId={chainId!}
        decodedUserOp={decodedDetail}
        from={userOp?.sender}
      />
      <div className="flex text-gray-750 text-center">
        You may not be able to access funds until the update is successful.
      </div>

      <Button
        variant="secondary"
        size="large"
        className="w-full gap-xl"
        onClick={onConfirm}
      >
        Confirm
      </Button>
      <RawData>
        raw
        {'\n'}
        data
      </RawData>
    </>
  );
}

export default function UpdateContract() {
  const {
    currentAccount: { address, chainId },
  } = useAccount();

  enum STEPS {
    Start = 'start',
    Preparing = 'preparing',
    Confirm = 'confirm',
    Confirming = 'confirming',
  }

  const [step, setStep] = useState<STEPS>(STEPS.Start);

  const handleStart = () => {
    setStep(STEPS.Preparing);
    setTimeout(() => setStep(STEPS.Confirm), 1000);
  };
  const handleClose = () => {
    history.back();
  };
  const handleConfirm = () => {
    setStep(STEPS.Confirming);
    // TODO: goto dashboard when confirm successful.
    setTimeout(
      () => navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Dashboard),
      1000
    );
  };

  const Steps = {
    [STEPS.Start]: (
      <>
        <div>
          <img src={WalletImg} alt="Wallet" className="size-[144px] mx-auto" />
        </div>
        <div className="elytro-text-bold-body text-center">Update contract</div>
        <div className="bg-gray-150 p-lg rounded-sm space-y-2">Version ...</div>
        <div className="flex text-gray-750 text-center">
          You may not be able to access funds until the update is successful.
        </div>

        <Button
          variant="secondary"
          size="large"
          className="w-full gap-xl"
          onClick={handleStart}
        >
          Start update
        </Button>
      </>
    ),
    [STEPS.Preparing]: (
      <div className="flex flex-col items-center justify-between gap-y-sm">
        <ProcessingTip body="Preparing" subBody="" className="flex-1" />
        <Button variant="ghost" className="w-full mt-8" onClick={handleClose}>
          Cancel
        </Button>
      </div>
    ),
    [STEPS.Confirm]: <ConfirmComponent onConfirm={handleConfirm} />,
    [STEPS.Confirming]: (
      <div className="flex flex-col items-center justify-between gap-y-sm">
        <ProcessingTip body="Updating" subBody="" className="flex-1" />
        <Button variant="ghost" className="w-full mt-8" onClick={handleClose}>
          Cancel
        </Button>
      </div>
    ),
  };

  return (
    <SecondaryPageWrapper title="Update contract">
      <div className="flex flex-col gap-y-md">
        <h1 className="elytro-text-bold-body">You are updating</h1>
        <div className="flex flex-row justify-between">
          <ShortedAddress address={address} chainId={chainId} />
        </div>
        {Steps[step]}
      </div>
    </SecondaryPageWrapper>
  );
}
