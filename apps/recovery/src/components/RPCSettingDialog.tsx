'use client';
import { useEffect, useState } from 'react';
import { Dialog, DialogHeader, DialogContent, DialogTitle, Button } from '@elytro/ui';
import { useRecoveryRecord } from '@/contexts';
import { SUPPORTED_CHAINS } from '@/constants/chains';
import { Settings } from 'lucide-react';
import { useRpc } from '@/contexts/rpc-context';
import { createPublicClient, http } from 'viem';

export function RPCSettingDialog() {
  const { chainId } = useRecoveryRecord();
  const { rpc, setRpc } = useRpc();
  const [open, setOpen] = useState(false);
  const [rpcInput, setRpcInput] = useState('');
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (chainId) {
      setRpcInput(rpc || SUPPORTED_CHAINS.find((chain) => chain.id === chainId)?.rpcUrls.default.http[0] || '');
    }
  }, [chainId, rpc]);

  const handleSave = async () => {
    if (!rpcInput.trim()) {
      setError('RPC address cannot be empty');
      return;
    }
    try {
      const provider = createPublicClient({
        chain: SUPPORTED_CHAINS.find((chain) => chain.id === chainId),
        transport: http(rpcInput.trim()),
      });
      const blockNumber = await provider.getBlockNumber();
      if (blockNumber === null) {
        setError('Failed to connect to the RPC');
        return;
      }
      setError('');
      setRpc(rpcInput.trim());
      setOpen(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to connect to the RPC');
      return;
    }
  };

  return (
    <div>
      <Settings className="w-4 h-4 cursor-pointer" onClick={() => setOpen(true)} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md min-h-fit">
          <DialogHeader>
            <DialogTitle>Network setting</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">RPC</div>
              <input
                className="w-full rounded-lg border px-3 py-2 text-lg font-bold bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-450"
                value={rpcInput}
                onChange={(e) => setRpcInput(e.target.value)}
                placeholder="Enter RPC URL"
                autoFocus
              />
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Chain ID</div>
              <input
                className="w-full rounded-lg border px-3 py-2 text-lg font-bold bg-gray-50 text-gray-450"
                value={chainId?.toString() || ''}
                readOnly
              />
            </div>
            {error && <div className="text-red-750 text-sm mt-1">{error}</div>}
            <Button className="w-full mt-2" size="regular" onClick={handleSave}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
