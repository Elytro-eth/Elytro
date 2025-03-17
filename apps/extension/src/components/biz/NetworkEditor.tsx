import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { TChainItem } from '@/constants/chains';
import { LabelInput } from './LabelInput';
import { useWallet } from '@/contexts/wallet';
import { createPublicClient, http } from 'viem';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Bundler } from '@soulwallet/sdk';

type TEditedChain = Pick<
  TChainItem,
  'id' | 'name' | 'icon' | 'endpoint' | 'bundler' | 'nativeCurrency' | 'rpcUrls'
>;

export default function NetworkEditor({
  chain,
  onChanged,
}: {
  chain: TChainItem;
  onChanged: () => void;
}) {
  const { toast } = useToast();
  const { wallet } = useWallet();
  const [editedChain, setEditedChain] = useState<TEditedChain>({
    id: chain.id,
    name: chain.name,
    icon: chain.icon,
    endpoint: chain.endpoint,
    bundler: chain.bundler,
    nativeCurrency: chain.nativeCurrency,
    rpcUrls: chain.rpcUrls,
  });

  const checkRpc = async (rpc: string) => {
    try {
      const client = createPublicClient({
        transport: http(rpc),
      });
      const chainId = await client.getChainId();
      if (chainId === editedChain.id) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const checkBundler = async (bundler: string) => {
    try {
      const b = new Bundler(bundler);
      const bundle_hash =
        '0x7c1f4cca45de6c34781f628667ccf071b1992d00ef74b68c2bfa276af84ae2c7';
      const r = await b.eth_getUserOperationReceipt(bundle_hash);
      return !r.isErr();
    } catch {
      return false;
    }
  };

  const networkFormSchema = z.object({
    endpoint: z.string().refine(
      async (/*value*/) => {
        try {
          return await checkRpc(editedChain.endpoint);
        } catch {
          return false;
        }
      },
      {
        message: 'Invalid RPC',
      }
    ),
    bundler: z.string().refine(
      async (/*value*/) => {
        try {
          return await checkBundler(editedChain.bundler);
        } catch {
          return false;
        }
      },
      {
        message: 'Invalid Bundler',
      }
    ),
  });

  const form = useForm<z.infer<typeof networkFormSchema>>({
    resolver: zodResolver(networkFormSchema),
    defaultValues: editedChain,
    mode: 'onBlur',
  });

  const onSave = async () => {
    try {
      await wallet.updateChainConfig(editedChain.id, editedChain);
      onChanged();
      toast({
        description: `${chain.name} Network updated`,
      });
    } catch (error) {
      toast({
        title: 'Oops! Something went wrong. Try again later.',
        description: error?.toString(),
      });
    }
  };

  const originRpc = chain?.endpoint;
  const newRpc = editedChain?.endpoint;
  const formChanged =
    originRpc !== newRpc || editedChain.bundler !== chain.bundler;

  return (
    <div className="space-y-4">
      <div className="flex flex-row items-center mb-4">
        <img
          src={chain?.icon}
          alt={chain?.name}
          className="size-8 rounded-full"
        />
        <div className="elytro-text-small-bold ml-4 text-bold">
          {chain?.name}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSave)}>
          <FormField
            control={form.control}
            name="endpoint"
            render={({ field }) => {
              const { ref: _ref, ...rest } = field;
              return (
                <FormItem>
                  <FormControl>
                    <LabelInput
                      {...rest}
                      label="RPC"
                      placeholder="Input RPC"
                      value={editedChain.endpoint}
                      onChange={(e) => {
                        setEditedChain((prev) => ({
                          ...prev,
                          endpoint: e?.target?.value,
                          rpcUrls: {
                            default: {
                              http: [e?.target?.value],
                            },
                          },
                        }));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <FormField
            control={form.control}
            name="bundler"
            render={({ field }) => {
              const { ref: _ref, ...rest } = field;
              return (
                <FormItem>
                  <FormControl>
                    <LabelInput
                      {...rest}
                      label="Bundler"
                      placeholder="Input bundler"
                      value={editedChain?.bundler}
                      onChange={(e) =>
                        setEditedChain((prev) => ({
                          ...prev,
                          bundler: e?.target?.value,
                        }))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </form>
      </Form>

      <div className="space-y-2">
        <LabelInput
          label="Chian ID"
          placeholder="Input address"
          value={editedChain.id}
          disabled
        />
      </div>
      <div className="space-y-2">
        <LabelInput
          label="Currency Symbol"
          className="bg-gray-150 rounded-md py-sm px-lg h-auto"
          placeholder="Input address"
          value={editedChain.nativeCurrency.symbol}
          disabled
        />
      </div>
      <div className="flex space-x-2">
        <Button
          className="flex-1 rounded-full"
          onClick={onSave}
          disabled={
            !newRpc ||
            !editedChain.bundler ||
            !formChanged ||
            !form.formState.isValid
          }
        >
          Save
        </Button>
      </div>
    </div>
  );
}
