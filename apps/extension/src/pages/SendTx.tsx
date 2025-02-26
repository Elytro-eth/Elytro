import { encodeFunctionData, isAddress, parseEther } from 'viem';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleHelp } from 'lucide-react';
import { Transaction } from '@soulwallet/sdk';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';
import { useAccount } from '@/contexts/account-context';
import { useChain } from '@/contexts/chain-context';
import FragmentedAddress from '@/components/biz/FragmentedAddress';
import AddressInput from '@/components/biz/AddressInput';
import TokenSelector from '@/components/biz/TokenSelector';
import AmountInput from '@/components/biz/AmountInput';
import { useTx } from '@/contexts/tx-context';
import { UserOpType } from '@/contexts/tx-context';
import { ABI_ERC20_TRANSFER } from '@/constants/abi';
import { toast } from '@/hooks/use-toast';
import { formatTokenAmount } from '@/utils/format';
import { useEffect } from 'react';

export default function SendTx() {
  const {
    tokenInfo: { tokens },
    currentAccount: { address },
    updateTokens,
  } = useAccount();
  const { currentChain } = useChain();
  const { openUserOpConfirmTx } = useTx();

  useEffect(() => {
    if (!tokens.length) {
      updateTokens();
    }
  }, [tokens]);

  const formResolverConfig = z.object({
    token: z.object({
      name: z.string(),
      logoURI: z.string(),
      balance: z.number(),
      decimals: z.number(),
      symbol: z.string(),
      address: z.string().nullable(),
    }),
    amount: z.string().superRefine((data, ctx) => {
      if (data === '' || isNaN(Number(data)) || Number(data) <= 0) {
        ctx.addIssue({
          code: 'custom',
          message: 'Please input a valid amount',
        });
      }
      const maxAmount = Number(
        formatTokenAmount(
          form.getValues('token').balance,
          form.getValues('token').decimals
        )
      );
      if (Number(data) > maxAmount) {
        ctx.addIssue({
          code: 'custom',
          message: 'Insufficient balance',
        });
      }
    }),
    to: z.string().refine((address) => isAddress(address), {
      message: 'Please give a valid address.',
    }),
  });

  const form = useForm<z.infer<typeof formResolverConfig>>({
    resolver: zodResolver(formResolverConfig),
    mode: 'onChange',
  });

  const changeAmountField = (amount: string) => {
    form.setValue('amount', amount);
    form.trigger('amount');
  };

  const handleFillMax = () => {
    const token = form.getValues('token');
    if (token) {
      changeAmountField(formatTokenAmount(token.balance, token.decimals));
    }
  };

  const handleTokenSelect = (item: TTokenInfo) => {
    form.setValue('token', {
      ...item,
      balance: item.balance ?? 0,
      address: item.address || '0x0000000000000000000000000000000000000000',
    });
    form.trigger('token');
  };

  const handleContinue = () => {
    if (!address) {
      console.error('Address is undefined');
      return;
    }

    const token = form.getValues('token');
    const to = form.getValues('to');

    if (to.toLowerCase() === address.toLowerCase()) {
      toast({
        title: 'Cannot send to yourself',
        description: 'Please input a valid address.',
      });
      return;
    }

    const txParams: Transaction = { to };

    const amount = parseEther(form.getValues('amount')).toString();
    if (token.symbol === 'ETH') {
      txParams.value = amount;
    } else {
      txParams.to = token.address!;
      txParams.data = encodeFunctionData({
        abi: ABI_ERC20_TRANSFER,
        functionName: 'transfer',
        args: [to, amount],
      });
    }

    openUserOpConfirmTx(UserOpType.SendTransaction, [txParams]);
  };

  return (
    <SecondaryPageWrapper title="Send">
      <div>
        <Form {...form}>
          <div className="bg-light-green rounded-sm">
            <h3 className="text-lg font-bold px-4 py-3">Sending</h3>
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem className="px-4">
                  <FormControl>
                    <AmountInput
                      field={field}
                      isDisabled={!form.getValues('token')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="token"
              render={() => (
                <div className="relative mb-4 py-2">
                  <FormItem>
                    <FormControl>
                      <TokenSelector
                        className="h-16 px-4"
                        tokens={tokens}
                        onTokenChange={handleTokenSelect}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                  <Button
                    disabled={!form.getValues('token')}
                    className="absolute right-4 top-6 bg-green !text-white !py-2"
                    size="tiny"
                    onClick={() => handleFillMax()}
                  >
                    Max
                  </Button>
                </div>
              )}
            />
          </div>
          <div className="bg-light-blue p-4 pt-3 rounded-sm mb-4">
            <h3 className="text-lg font-bold mb-3">To</h3>
            <FormField
              control={form.control}
              name="to"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <AddressInput field={field} currentChain={currentChain} />
                  </FormControl>
                  <FormMessage className="pb-2" />
                </FormItem>
              )}
            />
            <div className="flex text-gray-750">
              <CircleHelp className="w-4 h-4 text-gray-750 mr-2" />
              You tokens will be lost if the recipient is not on the same
              network.
            </div>
          </div>
        </Form>
        <div className="p-4 bg-gray-150 rounded-sm space-y-2 mb-4">
          <div className="flex justify-between items-center">
            <div className="font-bold text-base text-gray-750">
              From account
            </div>
            <FragmentedAddress
              address={address}
              chainId={currentChain?.id || 1}
            />
          </div>
          <div className="flex justify-between items-center">
            <div className="font-bold text-base text-gray-750">
              Network cost
            </div>
            <div className="text-gray-600 text-sm font-normal">
              To be calculated
            </div>
          </div>
        </div>

        <Button
          variant="secondary"
          size="large"
          className="w-full gap-xl"
          disabled={!form.formState.isValid}
          onClick={handleContinue}
        >
          Continue
        </Button>
      </div>
    </SecondaryPageWrapper>
  );
}
