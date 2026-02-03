import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';
import { Switch, toast, Spin } from '@elytro/ui';
import { useAccount } from '@/contexts/account-context';
import { useChain } from '@/contexts/chain-context';
import { getApproveErc20Tx, queryErc20Approvals } from '@/utils/tokenApproval';
import { Address } from 'viem';
import { CircleDollarSignIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Transaction } from '@elytro/sdk';
import { TxRequestTypeEn, useTx } from '@/contexts/tx-context';
import { CoinLogoNameMap } from '@/constants/token';
import { useWallet } from '@/contexts/wallet';

const StablecoinsGas = () => {
  const {
    currentAccount: { address, chainId },
  } = useAccount();
  const { wallet } = useWallet();
  const { currentChain, getCurrentChain } = useChain();
  const { handleTxRequest } = useTx();
  const [approvedStablecoins, setApprovedStablecoins] = useState<{ name: string; address: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleApproveStablecoins = async () => {
    const stablecoins = currentChain?.stablecoins || [];

    if (stablecoins.length === 0) {
      toast({
        title: 'No supported stablecoins found',
        description: '',
        variant: 'destructive',
      });
      return;
    }

    const txs: Partial<Transaction>[] = [];
    const targetStablecoinsAddresses = stablecoins?.map((coin: { name: string; address: string[] }) => coin.address[0]);

    const entryPointAddress = await wallet.getEntryPoint();
    if (!entryPointAddress) {
      toast({
        title: 'EntryPoint not found',
        description: '',
        variant: 'destructive',
      });
      return;
    }

    targetStablecoinsAddresses?.forEach(async (coinAddress: string) => {
      const tx = getApproveErc20Tx(coinAddress as Address, entryPointAddress as Address);
      txs.push(tx);
    });

    handleTxRequest(TxRequestTypeEn.ApproveTransaction, txs as Transaction[]);
  };

  const queryAllowance = async () => {
    setIsLoading(true);
    try {
      const stablecoins = currentChain?.stablecoins || [];

      if (stablecoins.length === 0) {
        toast({
          title: 'No supported stablecoins found',
          description: '',
          variant: 'destructive',
        });
        return;
      }

      const entryPointAddress = await wallet.getEntryPoint();
      if (!entryPointAddress) {
        console.warn('EntryPoint not found for allowance query');
        return;
      }

      const approvedStablecoins: { name: string; address: string }[] = [];

      await Promise.all(
        stablecoins?.map(async (coin: { name: string; address: string[] }) => {
          const allowance = await queryErc20Approvals(address as Address, {
            chainId,
            customRpc: currentChain?.endpoint,
          });

          const tokenAllowances = allowance.filter(
            (approval) =>
              approval.token.toLowerCase() === coin.address[0].toLowerCase() &&
              approval.spender.toLowerCase() === entryPointAddress.toLowerCase()
          );

          if (tokenAllowances.length > 0) {
            approvedStablecoins.push({ name: coin.name, address: coin.address[0] });
          }
        })
      );

      setApprovedStablecoins(approvedStablecoins);
    } catch (error) {
      console.error('Error querying allowance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getCurrentChain();
  }, []);

  useEffect(() => {
    if (address && currentChain) {
      queryAllowance();
    }
  }, [address, currentChain]);

  const handleToggleStablecoinsGas = () => {
    if (approvedStablecoins.length === 0) {
      handleApproveStablecoins();
    }
  };

  return (
    <SecondaryPageWrapper title="Pay with Stablecoins">
      <Spin isLoading={isLoading} />
      <div className="flex flex-row justify-between gap-x-lg items-center border border-gray-300 rounded-md p-lg">
        <div className="flex flex-row items-center gap-2">
          <CircleDollarSignIcon className="size-4" />
          <span className="elytro-text-small text-gray-900">Pay with Stablecoins</span>
        </div>

        <Switch
          id="stablecoins-gas"
          checked={approvedStablecoins.length > 0}
          onCheckedChange={handleToggleStablecoinsGas}
        />
      </div>

      {approvedStablecoins.length > 0 && (
        <div className="flex flex-col gap-y-sm mt-sm">
          <div className="text-gray-600 elytro-text-smaller-body">Pre-approved token allowance</div>

          <div className="flex flex-col gap-y-sm">
            {approvedStablecoins.map((coin) => (
              <div
                className="flex flex-row items-center gap-x-sm border border-gray-300 rounded-md p-lg"
                key={coin.name}
              >
                <img
                  src={CoinLogoNameMap[coin.name as keyof typeof CoinLogoNameMap]}
                  alt={coin.name}
                  className="size-6 rounded-full"
                />
                <span className="elytro-text-small text-gray-900">{coin.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </SecondaryPageWrapper>
  );
};

export default StablecoinsGas;
