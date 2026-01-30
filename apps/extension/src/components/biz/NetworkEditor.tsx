import { Button, Form, FormControl, FormField, FormItem, FormMessage, useToast } from '@elytro/ui';
import { TChainItem } from '@/constants/chains';
import { LabelInput } from './LabelInput';
import { useWallet } from '@/contexts/wallet';
import { createPublicClient, http } from 'viem';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { maskApiKeyInUrl } from '@/utils/url';

type NetworkFormValues = Pick<TChainItem, 'name' | 'endpoint' | 'bundler'>;

const createNetworkFormSchema = (chainId: number) => {
  return z.object({
    name: z.string().min(1, "Name can't be empty"),
    endpoint: z
      .string()
      .min(1, 'RPC URL is required')
      .superRefine(async (value, ctx) => {
        try {
          if (!value.startsWith('https://')) {
            ctx.addIssue({
              code: 'custom',
              message: 'RPC URL must use HTTPS protocol for security',
            });
            return;
          }

          const client = createPublicClient({
            transport: http(value),
          });
          const id = await client.getChainId();

          if (id !== chainId) {
            ctx.addIssue({
              code: 'custom',
              message: `RPC URL chain ID (${id}) does not match expected chain ID (${chainId})`,
            });
          }
        } catch {
          ctx.addIssue({
            code: 'custom',
            message: 'Can’t connect, please check if the URL is correct and accessible.',
          });
        }
      }),
    bundler: z
      .string()
      .min(1, 'Bundler URL is required')
      .refine(
        async (value) => {
          try {
            if (!value) return false;
            const client = createPublicClient({
              transport: http(value),
            });
            const entryPoints = (await client.request({
              method: 'eth_supportedEntryPoints' as SafeAny,
            })) as `0x${string}`[];

            return entryPoints.length > 0;
          } catch {
            return false;
          }
        },
        {
          message: 'Can’t connect or no supported entry points found',
        }
      ),
  });
};

export default function NetworkEditor({ chain, onChanged }: { chain: TChainItem; onChanged: () => void }) {
  const { toast } = useToast();
  const { wallet } = useWallet();
  const [displayedBundlerUrl, setDisplayedBundlerUrl] = useState<string>(maskApiKeyInUrl(chain.bundler));

  const form = useForm<NetworkFormValues>({
    resolver: zodResolver(createNetworkFormSchema(chain.id)),
    defaultValues: {
      name: chain.name,
      endpoint: chain.endpoint,
      bundler: chain.bundler,
    },
    mode: 'onChange',
  });

  useEffect(() => {
    form.reset({
      name: chain.name,
      endpoint: chain.endpoint,
      bundler: chain.bundler,
    });
  }, [chain, form]);

  const formValues = form.watch();
  const formChanged = formValues.endpoint !== chain.endpoint || formValues.bundler !== chain.bundler;

  const onSubmit = async (data: NetworkFormValues) => {
    try {
      const updatedChain = {
        name: data.name,
        endpoint: data.endpoint,
        bundler: data.bundler,
        rpcUrls: {
          default: {
            http: chain?.rpcUrls?.default?.http ? [...chain.rpcUrls.default.http, data.endpoint] : [data.endpoint],
          },
        },
      };

      await wallet.updateChainConfig(chain.id, updatedChain);
      onChanged();
      toast({
        description: `${chain.name} network updated`,
      });
    } catch (error) {
      toast({
        title: 'Oops! Something went wrong. Try again later.',
        description: error?.toString(),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-row items-center mb-4">
        <img src={chain?.icon} alt={chain?.name} className="size-8 rounded-full" />
        <div className="elytro-text-bold-body ml-2 text-bold">{chain?.name}</div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="endpoint"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <LabelInput label="RPC" placeholder="Input RPC URL" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bundler"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <LabelInput
                    label="Bundler"
                    placeholder="Input bundler URL"
                    {...field}
                    value={displayedBundlerUrl}
                    onChange={(e) => {
                      setDisplayedBundlerUrl(e.target.value);
                    }}
                    onBlur={(e) => {
                      field.onChange(e.target.value);
                      setDisplayedBundlerUrl(maskApiKeyInUrl(e.target.value));
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex space-x-2 pt-2">
            <Button
              type="submit"
              className="flex-1 rounded-full"
              disabled={!formChanged || form.formState.isSubmitting || !form.formState.isValid}
            >
              {form.formState.isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
