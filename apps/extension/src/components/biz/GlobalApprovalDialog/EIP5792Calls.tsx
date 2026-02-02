import { useApproval } from '@/contexts/approval-context';
import { useWallet } from '@/contexts/wallet';
import { ethErrors } from 'eth-rpc-errors';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Spin } from '@elytro/ui';
import { EIP5792Call } from '@/types/eip5792';
import ShortedAddress from '@/components/ui/ShortedAddress';

export default function EIP5792Calls() {
  const { wallet } = useWallet();
  const { approval, resolve, reject } = useApproval();

  if (!approval || !approval.data) {
    return <Spin isLoading />;
  }

  const {
    data: { dApp, calls, callId },
  } = approval;

  const handleApprove = async () => {
    try {
      if (!callId) {
        throw new Error('Call ID is missing');
      }
      await wallet.processEIP5792Calls(callId);
      resolve({ id: callId });
    } catch (error) {
      reject(error as Error);
    }
  };

  const handleReject = () => {
    reject(ethErrors.provider.userRejectedRequest());
  };

  return (
    <div className="w-full h-full bg-white flex flex-col p-4 max-w-2xl mx-auto">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>批量交易确认</CardTitle>
          <CardDescription>来自: {dApp?.name || dApp?.origin || 'Unknown DApp'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">交易数量</Badge>
            <span className="font-semibold">{calls?.length || 0}</span>
          </div>

          {/* Display calls list */}
          <div className="max-h-96 overflow-y-auto space-y-2 border rounded-lg p-3">
            {calls?.map((call: EIP5792Call, index: number) => (
              <div key={index} className="p-3 border rounded bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">调用 {index + 1}</span>
                  {call.value && call.value !== '0x0' && <Badge variant="outline">{call.value}</Badge>}
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">To:</span>{' '}
                    {call.to ? (
                      <ShortedAddress
                        address={call.to}
                        showChainIcon={false}
                        hideTooltip
                        className="!bg-transparent !p-0 font-mono"
                      />
                    ) : (
                      <span className="font-mono">--</span>
                    )}
                  </div>
                  <div>
                    <span className="text-gray-500">Data:</span>{' '}
                    <span className="font-mono break-all">{call.data?.slice(0, 20)}...</span>
                  </div>
                  {call.gas && (
                    <div>
                      <span className="text-gray-500">Gas:</span> <span className="font-mono">{call.gas}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleApprove} className="flex-1">
              批准
            </Button>
            <Button onClick={handleReject} variant="secondary" className="flex-1">
              拒绝
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
