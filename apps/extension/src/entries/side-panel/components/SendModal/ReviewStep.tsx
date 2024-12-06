import { Label } from '@/components/ui/label';
import { useAccount } from '../../contexts/account-context';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import questionIcon from '@/assets/icons/question.svg';
import { TxData } from '.';
import { ChevronRight } from 'lucide-react';
import SplitedGrayAddress from '@/components/SplitedGrayAddress';
import { Address, formatEther, Hex, parseEther, toHex } from 'viem';
import { useElytroStep } from '@/components/steps/StepProvider';
import { Button } from '@/components/ui/button';
import useDialogStore from '@/stores/dialog';

export default function ReviewStep({ onConfirm }: { onConfirm: () => void }) {
  const {
    accountInfo: { address },
    currentChain,
  } = useAccount();
  const { stepData } = useElytroStep() as { stepData: TxData };
  const { openSendTxDialog, closeSendTxDialog } = useDialogStore();
  const afterConfirm = () => {
    closeSendTxDialog();
    onConfirm();
  };
  const handleComfirm = () => {
    if (!address) {
      console.error('Address is undefined');
      return;
    }
    const txParams = {
      from: address,
      to: stepData.to,
      value: toHex(parseEther(stepData.amount ?? '0')),
      gasPrice: '0x0',
    };
    openSendTxDialog(txParams, afterConfirm);
  };
  return (
    <div className="space-y-4">
      <h3 className="text-3xl">Review</h3>
      <div className="space-y-2">
        {stepData ? (
          <>
            <Label className="text-gray-400 font-normal">Token</Label>
            <div className="py-3 flex flex-row items-center font-medium text-lg">
              <img
                className="h-10 w-10 mr-4"
                src={stepData.token?.logoURI}
                alt={stepData.token?.name}
              />
              <div className="text-2xl">
                {formatEther(BigInt(stepData.token?.tokenBalance as Hex))} ETH
              </div>
            </div>
          </>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label className="text-gray-400 font-normal">To</Label>
        <SplitedGrayAddress
          className="text-2xl font-medium"
          address={stepData?.to as Address}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-gray-400 font-normal">Network</Label>
        <div className="flex flex-row items-center font-medium text-lg space-x-2">
          <div>{currentChain?.name}</div>
          <Tooltip>
            <TooltipTrigger>
              <img src={questionIcon} alt="question icon" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Network tooltip</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-gray-400 font-normal">Fee</Label>
        <div className="text-2xl font-medium break-all">
          <div className="flex items-center">
            <span className="text-gray-300 line-through">0.02 ETH</span>
            <ChevronRight />
          </div>
          <div className="text-sm font-normal text-gray-700">
            Sponsored by Soul Wallet
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0">
        <Button
          onClick={handleComfirm}
          className="w-full p-8 rounded-full bg-[#0E2D50]"
        >
          Confirm
        </Button>
      </div>
    </div>
  );
}
