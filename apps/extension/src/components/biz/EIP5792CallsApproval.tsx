import React from 'react';
import { useApproval } from '@/contexts/approval-context';
import { EIP5792Call } from '@/types/eip5792';
import { formatAddress, formatHex } from '@/utils/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Copy, CheckCircle, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface EIP5792CallsApprovalProps {
  calls: EIP5792Call[];
  callId: string;
  dApp: TDAppInfo;
}

export const EIP5792CallsApproval: React.FC<EIP5792CallsApprovalProps> = ({ calls, callId, dApp }) => {
  const { resolve, reject } = useApproval();

  const handleApprove = async () => {
    try {
      await resolve({ callId, approved: true });
    } catch (error) {
      console.error('Error approving EIP-5792 calls:', error);
      toast({
        title: 'Failed to approve calls',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async () => {
    try {
      await reject(new Error('User rejected EIP-5792 calls'));
    } catch (error) {
      console.error('Error rejecting EIP-5792 calls:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      variant: 'constructive',
    });
  };

  const formatValue = (value?: string) => {
    if (!value || value === '0x0' || value === '0') return '0 ETH';
    try {
      const wei = BigInt(value);
      const eth = Number(wei) / 1e18;
      return `${eth.toFixed(6)} ETH`;
    } catch {
      return `${value} wei`;
    }
  };

  const getCallType = (call: EIP5792Call) => {
    if (call.data === '0x' || call.data === '0x0') {
      return 'Transfer';
    }
    return 'Contract Call';
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-500" />
            Batch Transaction Request
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">From DApp:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm">{dApp.name || dApp.origin}</span>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(dApp.origin)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Call ID:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm">{callId.slice(0, 8)}...</span>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(callId)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Calls:</span>
            <Badge variant="secondary">{calls.length}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Call Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {calls.map((call, index) => (
            <div key={index} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Call {index + 1}</span>
                <Badge variant="outline">{getCallType(call)}</Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">To:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{formatAddress(call.to)}</span>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(call.to)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {call.value && call.value !== '0x0' && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Value:</span>
                    <span className="font-mono">{formatValue(call.value)}</span>
                  </div>
                )}

                {call.gas && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Gas Limit:</span>
                    <span className="font-mono">{formatHex(call.gas)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Data:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">{call.data.slice(0, 20)}...</span>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(call.data)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {index < calls.length - 1 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={handleReject} className="flex-1">
          <XCircle className="h-4 w-4 mr-2" />
          Reject
        </Button>
        <Button onClick={handleApprove} className="flex-1">
          <CheckCircle className="h-4 w-4 mr-2" />
          Approve Batch
        </Button>
      </div>
    </div>
  );
};
