import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import DAppDetail from '../DAppDetail';
import { SupportedChainTypeEn } from '@/constants/chains';
import { useWallet } from '@/contexts/wallet';
import { toast } from '@/hooks/use-toast';
import { SignTypeEn, getProcessingFromSignType } from './utils';
import DomainDetail from './DomainDetail';

interface ISendTxProps {
  signData: TSignData;
  dapp: TDAppInfo;
  onConfirm: (signature: string) => void;
  onCancel: () => void;
  chainType: SupportedChainTypeEn;
}

export default function SignDetail({
  onConfirm,
  onCancel,
  dapp,
  chainType,
  signData: { method, params },
}: ISendTxProps) {
  const wallet = useWallet();
  const signType = method as SignTypeEn;

  const { title, format, messageIdx, showDetail } =
    getProcessingFromSignType(signType);

  const handleConfirm = async () => {
    try {
      const signature = await wallet.signMessage(params[messageIdx] as string);

      onConfirm(signature);
    } catch (error) {
      console.error(error);
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
    <Card className="w-full max-w-md mx-auto flex-grow flex flex-col min-w-[430px]">
      <CardHeader>
        <DAppDetail dapp={dapp} chainType={chainType} />
      </CardHeader>

      <CardContent className="space-y-4 flex-grow">
        <div className="rounded-2xl">
          {/* TODO: 区分 */}
          <div className="text-lg font-bold mb-3">{title}</div>

          {showDetail && <DomainDetail message={params[messageIdx]} />}

          <pre
            className="
              border-gray-500 bg-gray-200  rounded-2xl p-4 
              text-sm text-gray-500 
              w-full min-h-40 max-h-[calc(100vh-400px)] overflow-auto
            "
          >
            {format(params)}
          </pre>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-y-4">
        <div className="text-xs text-gray-300 mb-4 border-t border-gray-200">
          <div className="mt-4">
            By confirming, you will allow the smart contract to access your fund
            and make transactions.
          </div>
        </div>
        <div className="flex w-full justify-between gap-x-2">
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
      </CardFooter>
    </Card>
  );
}
