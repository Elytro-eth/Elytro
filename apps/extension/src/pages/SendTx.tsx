import { encodeFunctionData, isAddress, parseUnits, zeroAddress } from 'viem';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Transaction } from '@elytro/sdk';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';
import { useAccount } from '@/contexts/account-context';
import TokenSelector from '@/components/biz/TokenSelector';
import AmountInput from '@/components/biz/AmountInput';
import { useTx } from '@/contexts/tx-context';
import { TxRequestTypeEn } from '@/contexts/tx-context';
import { ABI_ERC20_TRANSFER } from '@/constants/abi';
import { toast } from '@/hooks/use-toast';
import { formatTokenAmount } from '@/utils/format';
import { useEffect, useState, useCallback, useMemo } from 'react';
import AddressInput from '@/components/biz/AddressInput';
import { saveRecentAddress } from '@/utils/recentAddresses';
import { getChainNameByChainId, getIconByChainId } from '@/constants/chains';
import { useWallet } from '@/contexts/wallet';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import ShortedAddress from '@/components/ui/ShortedAddress';

export default function SendTx() {
  const { wallet } = useWallet();
  const {
    tokenInfo: { tokens, loading: tokensLoading },
    currentAccount: { address, chainId },
    updateTokens,
  } = useAccount();
  const { handleTxRequest } = useTx();
  const [openToContractConfirmModal, setOpenToContractConfirmModal] = useState(false);

  const [isPreparing, setIsPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredTokens = useMemo(() => {
    return tokens.filter((token) => {
      const balance = Number(token.balance);
      if (token.address !== zeroAddress && (!balance || Number.isNaN(balance))) {
        return false;
      }

      return true;
    });
  }, [tokens]);

  const formResolverConfig = z.object({
    token: z.object({
      name: z.string(),
      logoURI: z.union([z.string(), z.null(), z.undefined()]).optional(),
      balance: z.union([z.string(), z.null(), z.undefined(), z.number()]).optional(),
      decimals: z.number(),
      symbol: z.string(),
      address: z.string(),
    }),
    amount: z
      .string()
      .optional()
      .superRefine((data, ctx) => {
        const token = form.getValues('token');

        if (data && (data === '' || isNaN(Number(data)) || Number(data) <= 0)) {
          ctx.addIssue({
            code: 'custom',
            message: 'Please input a valid amount',
          });
        }

        const maxAmount = token
          ? Number(formatTokenAmount(form.getValues('token').balance, form.getValues('token').decimals))
          : 0;

        if (Number(data) > maxAmount) {
          ctx.addIssue({
            code: 'custom',
            message: 'Insufficient balance',
          });
        }
      }),
    to: z.string().superRefine((targetAddress, ctx) => {
      if (!isAddress(targetAddress)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Please give a valid address.',
        });
      }

      if (targetAddress.toLowerCase() === address.toLowerCase()) {
        ctx.addIssue({
          code: 'custom',
          message: 'You cannot send to yourself',
        });
      }
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

  const handleOpenTx = useCallback(async () => {
    const token = form.getValues('token');
    const to = form.getValues('to');
    const amount = form.getValues('amount');

    const txParams: Transaction = { to };
    const formattedMaxAmount = formatTokenAmount(token.balance || 0, token.decimals);
    const parsedAmount =
      amount === formattedMaxAmount
        ? BigInt(token.balance || 0).toString()
        : parseUnits(amount || '0', token.decimals).toString();

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

    saveRecentAddress(to);
    handleTxRequest(TxRequestTypeEn.SendTransaction, [txParams], {
      to,
      method: {
        name: 'transfer',
        params: [to, parsedAmount],
      } as SafeAny,
      toInfo: { ...token } as SafeAny,
    });
  }, [form]);

  const handleContinue = useCallback(async () => {
    if (!form.formState.isValid || !address) {
      form.trigger();
      return;
    }

    try {
      setIsPreparing(true);
      setError(null);

      const to = form.getValues('to');

      if (to.toLowerCase() === address.toLowerCase()) {
        toast({
          title: 'Cannot send to yourself',
          // description: 'Please enter a different address',
          variant: 'destructive',
        });
        return;
      }

      const isToContract = await wallet.isContractAddress(to);

      if (isToContract) {
        setOpenToContractConfirmModal(true);
      } else {
        handleOpenTx();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to prepare transaction';
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
    return form.formState.isValid && !isPreparing && !tokensLoading && !!form.getValues('amount');
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
            <h3 className="text-lg font-bold px-4 pt-3">Sending</h3>
            {/* Token selector */}
            <FormField
              control={form.control}
              name="token"
              render={() => (
                <div className="relative py-2">
                  <FormItem>
                    <FormControl>
                      <TokenSelector className="h-16 px-4" tokens={filteredTokens} onTokenChange={handleTokenSelect} />
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
                <FormItem className="flex flex-col gap-1 bg-white px-lg py-md rounded-md space-y-0">
                  <div className="flex items-center flex-row gap-x-2xs">
                    <img src={getIconByChainId(chainId)} alt="chain" className="size-4 rounded-full" />
                    <span className="text-sm text-gray-750 ">{getChainNameByChainId(chainId)}</span>
                  </div>
                  <FormControl>
                    <AddressInput field={field} chainId={chainId} />
                  </FormControl>
                  <FormMessage className="pb-2" />
                </FormItem>
              )}
            />
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

      <Dialog open={openToContractConfirmModal} onOpenChange={setOpenToContractConfirmModal}>
        <DialogContent>
          <div className="flex flex-col items-center gap-y-xl pt-3xl">
            <img src={getIconByChainId(chainId)} alt="chain" className="size-10 rounded-full" />
            <ShortedAddress address={form.getValues('to')} hideTooltip />
            <div className="text-center text-gray-750">
              <p className="elytro-text-bold-body">
                It&apos;s a contract address, so it must be on {getChainNameByChainId(chainId)}
              </p>
              <p className="elytro-text-body mt-sm text-gray-600">otherwise, you will lose your assets.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-xl">
            <Button variant="outline" size="medium" onClick={() => setOpenToContractConfirmModal(false)}>
              Back
            </Button>
            <Button size="medium" onClick={handleOpenTx}>
              I understand
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </SecondaryPageWrapper>
  );
}
