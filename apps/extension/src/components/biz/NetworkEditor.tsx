import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectSeparator,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { TChainItem } from '@/constants/chains';
import { LabelInput } from './LabelInput';
import { useWallet } from '@/contexts/wallet';

export default function NetworkEditor({
  chain,
  onChanged,
}: {
  chain: TChainItem;
  onChanged: () => void;
}) {
  const { toast } = useToast();
  const { wallet } = useWallet();
  console.log('debug change', chain);
  const [currChain, setCurrChain] = useState<TChainItem>(chain);

  // const mockBundlers = [
  //   {
  //     name: 'Bundler 01',
  //   },
  //   {
  //     name: 'Bundler 02',
  //   },
  // ];

  const onSave = async () => {
    try {
      await wallet.updateChainConfig(currChain.id, currChain);
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

  const originRpc = chain?.rpcUrls?.default?.http?.[0];
  const newRpc = currChain?.rpcUrls?.default?.http?.[0];
  const formChanged =
    originRpc !== newRpc || currChain.bundler !== chain.bundler;

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
          value={currChain.rpcUrls.default.http[0]}
          onChange={(e) =>
            setCurrChain((prev) => ({
              ...prev,
              rpcUrls: {
                default: {
                  http: [e?.target?.value],
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
          value={currChain.bundler}
          onChange={(e) =>
            setCurrChain((prev) => ({
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
          value={currChain.id}
          disabled
        />
      </div>
      <div className="space-y-2">
        <LabelInput
          label="Currency Symbol"
          className="bg-gray-150 rounded-md py-sm px-lg h-auto"
          placeholder="Input address"
          value={currChain.nativeCurrency.symbol}
          disabled
        />
      </div>
      <div className="flex space-x-2">
        <Button
          className="flex-1 rounded-full"
          onClick={onSave}
          disabled={!newRpc || !currChain.bundler || !formChanged}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
