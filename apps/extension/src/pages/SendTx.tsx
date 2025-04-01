import {
  encodeFunctionData,
  formatUnits,
  isAddress,
  parseUnits,
  zeroAddress,
} from 'viem';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleHelp, AlertCircle, Loader2 } from 'lucide-react';
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
import AddressInput from '@/components/biz/AddressInput';
import TokenSelector from '@/components/biz/TokenSelector';
import AmountInput from '@/components/biz/AmountInput';
import { useTx } from '@/contexts/tx-context';
import { TxRequestTypeEn } from '@/contexts/tx-context';
import { ABI_ERC20_TRANSFER } from '@/constants/abi';
import { toast } from '@/hooks/use-toast';
import { formatTokenAmount } from '@/utils/format';
import { useEffect, useState, useCallback, useMemo } from 'react';

export default function SendTx() {
  const {
    tokenInfo: { tokens, loading: tokensLoading },
    currentAccount: { address, chainId },
    updateTokens,
  } = useAccount();
  const { handleTxRequest } = useTx();

  const [isPreparing, setIsPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredTokens = useMemo(() => {
    return tokens.filter((token) => {
      if (token.balance === undefined || token.balance === null) {
        return false;
      }

      try {
        const formattedBalance = formatUnits(
          BigInt(token.balance),
          token.decimals
        );
        const numericBalance = parseFloat(formattedBalance);

        return numericBalance > 0.000001; //
      } catch (error) {
        console.error(`Error filtering token ${token.symbol}:`, error);
        return false;
      }
    });
  }, [tokens]);

  const formResolverConfig = z.object({
    token: z.object({
      name: z.string(),
      logoURI: z.union([z.string(), z.null(), z.undefined()]).optional(),
      balance: z.union([z.number(), z.null(), z.undefined()]).optional(),
      decimals: z.number(),
      symbol: z.string(),
      address: z.string(),
    }),
    amount: z
      .string()
      .optional()
      .superRefine((data, ctx) => {
        const token = form.getValues('token');

        if (data === '' || isNaN(Number(data)) || Number(data) <= 0) {
          ctx.addIssue({
            code: 'custom',
            message: 'Please input a valid amount',
          });
        }

        const maxAmount = token
          ? Number(
              formatTokenAmount(
                form.getValues('token').balance,
                form.getValues('token').decimals
              )
            )
          : 0;

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

  useEffect(() => {
    if (!tokens.length && !tokensLoading) {
      updateTokens();
    }
  }, [tokens, tokensLoading, updateTokens]);

  const changeAmountField = useCallback(
    (amount: string) => {
      form.setValue('amount', amount.trim());
      form.trigger('amount');
    },
    [form]
  );

  const handleFillMax = () => {
    const token = form.getValues('token');
    changeAmountField(formatTokenAmount(token?.balance || 0, token?.decimals));
  };

  const handleTokenSelect = useCallback(
    (token: TTokenInfo) => {
      form.setValue('token', token);
      form.trigger('token');
      form.trigger('amount');
    },
    [form]
  );

  const handleContinue = useCallback(async () => {
    if (!form.formState.isValid || !address) {
      form.trigger();
      return;
    }

    try {
      setIsPreparing(true);
      setError(null);

      const token = form.getValues('token');
      const to = form.getValues('to');
      const amount = form.getValues('amount');

      if (to.toLowerCase() === address.toLowerCase()) {
        toast({
          title: 'Cannot send to yourself',
          description: 'Please enter a different address',
          variant: 'destructive',
        });
        return;
      }

      const txParams: Transaction = { to };
      const parsedAmount = parseUnits(amount || '0', token.decimals).toString();

      if (token.address === zeroAddress) {
        txParams.value = parsedAmount;
      } else if (token.address) {
        txParams.to = token.address;
        txParams.data = encodeFunctionData({
          abi: ABI_ERC20_TRANSFER,
          functionName: 'transfer',
          args: [to, parsedAmount],
        });
      } else {
        throw new Error('Invalid token address');
      }

      handleTxRequest(TxRequestTypeEn.SendTransaction, [txParams]);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to prepare transaction';
      setError(errorMessage);
      toast({
        title: 'Transaction Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsPreparing(false);
    }
  }, [form, address, handleTxRequest]);

  // Check if the form is valid
  const isFormValid = useMemo(() => {
    return form.formState.isValid && !isPreparing && !tokensLoading;
  }, [form.formState.isValid, isPreparing, tokensLoading]);

  return (
    <SecondaryPageWrapper title="Send">
      <div>
        {/* Error display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 mr-2" />
              <div>
                <h3 className="font-medium">Error</h3>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        <Form {...form}>
          <div className="bg-light-green rounded-sm pb-4 mb-4">
            <h3 className="text-lg font-bold px-4 py-3">Sending</h3>
            {/* Token selector */}
            <FormField
              control={form.control}
              name="token"
              render={() => (
                <div className="relative py-2">
                  <FormItem>
                    <FormControl>
                      <TokenSelector
                        className="h-16 px-4"
                        tokens={filteredTokens}
                        onTokenChange={handleTokenSelect}
                      />
                    </FormControl>
                    <FormMessage />

                    <Button
                      disabled={!form.getValues('token')}
                      className="absolute right-4 top-4 bg-green !text-white !py-2"
                      size="tiny"
                      onClick={handleFillMax}
                    >
                      Max
                    </Button>
                  </FormItem>
                </div>
              )}
            />
            {/* Amount input */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <div className="">
                  <FormItem className=" px-4">
                    <FormControl>
                      <AmountInput
                        field={field}
                        isDisabled={filteredTokens.length < 1}
                        token={form.getValues('token') as TTokenInfo}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </div>
              )}
            />
          </div>

          <div className="bg-light-blue p-4 pt-3 rounded-sm mb-4">
            <h3 className="text-lg font-bold mb-3">To</h3>
            {/* Address input */}
            <FormField
              control={form.control}
              name="to"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <AddressInput field={field} chainId={chainId} />
                  </FormControl>
                  <FormMessage className="pb-2" />
                </FormItem>
              )}
            />

            {/* Warning message */}
            <div className="flex text-gray-750">
              <CircleHelp className="w-4 h-4 text-gray-750 mr-2" />
              Tokens will be lost if sent to a different network.
            </div>
          </div>
        </Form>

        {/* Continue button */}
        <Button
          variant="secondary"
          size="large"
          className="w-full gap-xl"
          disabled={!isFormValid}
          onClick={handleContinue}
        >
          {isPreparing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Preparing...
            </>
          ) : (
            'Continue'
          )}
        </Button>
      </div>
    </SecondaryPageWrapper>
  );
}
