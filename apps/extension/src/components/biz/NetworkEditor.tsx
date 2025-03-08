import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { TChainItem } from '@/constants/chains';
import { LabelInput } from './LabelInput';
import { useWallet } from '@/contexts/wallet';

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
      <div className="space-y-2">
        <LabelInput
          label="RPC"
          placeholder="Input address"
          value={editedChain.endpoint}
          onChange={(e) =>
            setEditedChain((prev) => ({
              ...prev,
              endpoint: e?.target?.value,
              rpcUrls: {
                default: {
                  http: [
                    e?.target?.value,
                    ...(editedChain.rpcUrls?.default?.http || []),
                  ],
                },
              },
            }))
          }
        />
      </div>
      <div className="space-y-2">
        <LabelInput
          label="Bundler"
          placeholder="Input address"
          value={editedChain.bundler}
          onChange={(e) =>
            setEditedChain((prev) => ({
              ...prev,
              bundler: e?.target?.value,
            }))
          }
        />
      </div>
      {/*
      <div className="space-y-2">
        <Label className="font-normal">Bundler</Label>
        <div className="flex flex-row gap-x-md items-center">
        <Select value={bundler} onValueChange={(value) => setBundler(value)}>
          <SelectTrigger className="">
            <SelectValue placeholder="Select a bundler" />
          </SelectTrigger>
          <SelectContent>
            {mockBundlers.map((item) => (
              <SelectItem
                key={item.name}
                value={item.name}
                className="py-4 cursor-pointer"
              >
                {item.name}
              </SelectItem>
            ))}
            <SelectSeparator />
            <SelectItem value="customize" className="py-4 cursor-pointer">
              Customize
            </SelectItem>
          </SelectContent>
        </Select>
        </div>
      </div>
      {bundler === 'customize' ? (
        <div className="space-y-2">
          <div className="py-3 rounded-md border-none flex flex-row items-center font-medium text-lg">
            <Input
              className="rounded-md py-sm px-lg h-auto"
              placeholder="Input address"
              value={customBundler}
              onChange={(e) => setCustomBundler(e.target.value)}
            />
          </div>
        </div>
      ) : null}
      */}
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
          disabled={!newRpc || !editedChain.bundler || !formChanged}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
