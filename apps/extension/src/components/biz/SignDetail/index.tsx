import { Button } from '@/components/ui/button';
import DAppDetail from '../DAppDetail';
import { useWallet } from '@/contexts/wallet';
import { toast } from '@/hooks/use-toast';
import { SignTypeEn, getProcessingFromSignType } from './utils';
import DomainDetail from './DomainDetail';
import { WalletController } from '@/background/walletController';

interface ISendTxProps {
  signData: TSignData;
  dapp: TDAppInfo;
  onConfirm: (signature: string) => void;
  onCancel: () => void;
  chainId: number;
}

export default function SignDetail({
  onConfirm,
  onCancel,
  dapp,
  chainId,
  signData: { method, params },
}: ISendTxProps) {
  const { wallet } = useWallet();
  const signType = method as SignTypeEn;

  const { title, format, messageIdx, showDetail, signMethod } =
    getProcessingFromSignType(signType);

  const handleConfirm = async () => {
    try {
      let signature;

      if (signMethod && params[messageIdx]) {
        signature = await (
          wallet[signMethod] as
            | WalletController['signMessage']
            | WalletController['signTypedData']
        )(params[messageIdx]);
      }

      if (signature) {
        onConfirm(signature);
      } else {
        throw new Error('Sign failed');
      }
    } catch {
      toast({
        title: 'Sign failed',
        description: 'Please try again',
      });
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <div className="w-full mx-auto">
      <div className="mb-2 border-b">
        <DAppDetail dapp={dapp} chainId={chainId} />
      </div>

      <div className="space-4">
        <div className="rounded-2xl p-4">
          {/* TODO: 区分 */}
          <div className="text-lg font-bold mb-3">{title}</div>

          {showDetail && <DomainDetail message={params[messageIdx]} />}

          <pre
            className="
              w-full
              whitespace-normal
              bg-gray-200 rounded-2xl p-4 
              text-sm text-gray-500 
              min-h-40 max-h-[calc(100vh-400px)] !overflow-auto
            "
            style={{ wordBreak: 'break-word' }}
          >
            {format(params)}
          </pre>
        </div>
      </div>

      <div className="flex flex-col gap-y-4">
        <div className="text-xs text-gray-300 my-4 border-gray-200">
          <div className="px-4">
            By confirming, you will allow the smart contract to access your fund
            and make transactions.
          </div>
        </div>
        <div className="flex w-full justify-between gap-x-2 px-4">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="flex-1 rounded-md border border-gray-200"
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="flex-1 rounded-md">
            Sign
          </Button>
        </div>
      </div>
    </div>
  );
}
