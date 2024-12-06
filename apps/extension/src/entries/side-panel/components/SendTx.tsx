import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import DAppDetail from './DAppDetail';
import TxDetail, { SendTxTypeEn } from './TxDetail';
import GasEstimation, { TGasEstimate } from './GasEstimation';
import { useEffect, useRef, useState } from 'react';
import { useWallet } from '@/contexts/wallet';
import { elytroSDK } from '@/background/services/sdk';
import { useAccount } from '../contexts/account-context';
import { Transaction } from '@soulwallet/sdk';
import Spin from '@/components/Spin';
import { DecodeResult } from '@soulwallet/decoder';
import { toast } from '@/hooks/use-toast';
import { Loader } from 'lucide-react';
import { formatUserOperation } from '@/utils/format';

interface ISendTxProps {
  txParams: TTransactionInfo;
  dapp: TDAppInfo;
  onConfirm: () => void;
  onCancel: () => void;
  chainName: string;
}

export default function SendTx({
  txParams,
  onConfirm,
  onCancel,
  dapp,
  chainName,
}: ISendTxProps) {
  const gasEstimationRef = useRef<TGasEstimate>();
  const wallet = useWallet();
  const {
    accountInfo: { address },
  } = useAccount();
  const userOpRef = useRef<ElytroUserOperation>();
  const [isLoading, setIsLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [decodedDetail, setDecodedDetail] = useState<DecodeResult[]>([]);

  const [needDeposit, setNeedDeposit] = useState(false);

  const getUserOpFromTx = async () => {
    setIsLoading(true);
    try {
      const res = await elytroSDK.createUserOpFromTxs(address!, [
        { ...txParams } as Transaction,
      ]);

      const decodeRes = await elytroSDK.getDecodedUserOperation(res);

      if (!decodeRes) {
        throw new Error('Failed to decode user operation');
      }

      const { needDeposit = true } = await elytroSDK.getRechargeAmountForUserOp(
        res,
        decodeRes[0].value
      );

      setDecodedDetail(decodeRes);
      userOpRef.current = res;
      setNeedDeposit(needDeposit);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (txParams && address) {
      getUserOpFromTx();
    }
  }, [txParams, address]);

  const onGasChange = (gasEstimate: TGasEstimate) => {
    gasEstimationRef.current = gasEstimate;
  };

  const handleSendTx = async () => {
    try {
      setSending(true);

      // TODO: check this logic
      if (!userOpRef.current?.paymaster) {
        await elytroSDK.estimateGas(userOpRef.current!);
      }

      const { signature, opHash } = await wallet.signUserOperation(
        formatUserOperation(userOpRef.current!)
      );

      userOpRef.current!.signature = signature;

      await elytroSDK.sendUserOperation(userOpRef.current!);

      // TODO: what to do if op is a batch of txs?
      wallet.addNewHistory({
        opHash,
        timestamp: Date.now(),
        from: decodedDetail[0].from,
        to: decodedDetail[0].to,
        method: decodedDetail[0].method,
        value: decodedDetail[0].value.toString(),
      });

      await toast({
        title: 'Transaction sent successfully',
        description: 'User operation hash: ',
      });

      onConfirm();
    } catch (error) {
      toast({
        title: 'Failed to send transaction',
        description: (error as Error).message,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto flex-grow flex flex-col min-w-[430px]">
      <Spin isLoading={isLoading} />
      <CardHeader>
        <DAppDetail dapp={dapp} chainName={chainName} />
      </CardHeader>

      <CardContent className="space-y-4 flex-grow">
        {!isLoading ? (
          <TxDetail
            tx={decodedDetail[0]}
            type={txParams.to ? SendTxTypeEn.SEND : SendTxTypeEn.DEPLOY}
          />
        ) : null}
      </CardContent>

      <CardFooter className="flex flex-col gap-y-4">
        <GasEstimation onGasChange={onGasChange} />
        <div className="flex justify-between mt-auto w-full space-x-4">
          <Button variant="outline" onClick={onCancel} className="w-1/2">
            Cancel
          </Button>
          <Button
            onClick={handleSendTx}
            className="w-1/2"
            disabled={needDeposit || sending}
          >
            {needDeposit ? (
              'Not Enough Balance'
            ) : sending ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              'Send'
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
