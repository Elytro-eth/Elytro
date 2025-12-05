import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';
import { useEffect, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import CurrentAddress from '@/components/biz/CurrentAddress';
import HelperText from '@/components/ui/HelperText';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/wallet';
import { toast } from '@/hooks/use-toast';
import { formatErrorMsg } from '@/utils/format';
import { Loader2 } from 'lucide-react';

// Trusted dApp type
type TrustedDapp = {
  name: string;
  label: string;
  url: string;
  icon: string;
  enabled: boolean;
};

export default function FastSigningSettings() {
  const { wallet } = useWallet();

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [fastSigningEnabled, setFastSigningEnabled] = useState(false);
  const [trustedDapps, setTrustedDapps] = useState<TrustedDapp[]>([]);
  const [expiryDate, setExpiryDate] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialDappsState, setInitialDappsState] = useState<TrustedDapp[]>([]);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settings = await wallet.getFastSigningSettings();
      setFastSigningEnabled(settings.enabled);
      setTrustedDapps(settings.trustedDapps);
      setInitialDappsState(JSON.parse(JSON.stringify(settings.trustedDapps))); // deep copy
      setExpiryDate(settings.expiryDate);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to load fast signing settings:', error);
      toast({
        title: 'Failed to load settings',
        description: formatErrorMsg(error),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFastSigning = async (checked: boolean) => {
    try {
      setUpdating(true);
      await wallet.setFastSigningEnabled(checked);

      // Reload settings to get new expiry date
      await loadSettings();

      toast({
        title: checked ? 'Fast Signing enabled' : 'Fast Signing disabled',
        description: checked ? `Expires in 3 days` : undefined,
      });
    } catch (error) {
      console.error('Failed to toggle fast signing:', error);
      toast({
        title: 'Failed to update fast signing',
        description: formatErrorMsg(error),
        variant: 'destructive',
      });
      // Reload to revert UI
      await loadSettings();
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleDapp = (dappName: string) => {
    if (!fastSigningEnabled) return;

    const updatedDapps = trustedDapps.map((dapp) =>
      dapp.name === dappName ? { ...dapp, enabled: !dapp.enabled } : dapp
    );
    setTrustedDapps(updatedDapps);

    // Check if there are changes compared to initial state
    const changed = JSON.stringify(updatedDapps) !== JSON.stringify(initialDappsState);
    setHasChanges(changed);
  };

  const handleUpdate = async () => {
    try {
      setUpdating(true);
      await wallet.updateFastSigningTrustedDapps(trustedDapps);

      // Update initial state after successful save
      setInitialDappsState(JSON.parse(JSON.stringify(trustedDapps)));
      setHasChanges(false);

      toast({
        title: 'Settings updated',
        description: 'Trusted dApps settings have been saved',
      });
    } catch (error) {
      console.error('Failed to update trusted dApps:', error);
      toast({
        title: 'Failed to update settings',
        description: formatErrorMsg(error),
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const formatExpiryDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <SecondaryPageWrapper
        title="Fast Signing"
        onBack={() => {
          history.back();
        }}
      >
        <div className="flex items-center justify-center p-6">
          <Loader2 className="size-8 animate-spin text-gray-400" />
        </div>
      </SecondaryPageWrapper>
    );
  }

  return (
    <SecondaryPageWrapper
      title="Fast Signing"
      onBack={() => {
        history.back();
      }}
    >
      <div className="flex flex-col gap-y-md">
        {/* Your wallet section */}
        <div className="flex flex-row justify-between items-center">
          <div className="elytro-text-bold-body text-gray-600">Your wallet</div>
          <CurrentAddress className="bg-gray-150 rounded-2xs" />
        </div>

        {/* Info banner */}
        <HelperText description="Skip repeated signing with trusted dapps" />

        {/* Fast Signing Toggle */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-base font-normal">Fast Signing</span>
            <Switch checked={fastSigningEnabled} onCheckedChange={handleToggleFastSigning} disabled={updating} />
          </div>
        </div>

        {/* Expiry date */}
        {fastSigningEnabled && expiryDate && (
          <div className="text-xs text-gray-400">Expires: {formatExpiryDate(expiryDate)}</div>
        )}

        {/* Trusted Dapps Section */}
        <div className="elytro-text-bold-body text-gray-600 mt-4">Trusted Dapps</div>

        <div className="flex flex-col gap-y-2">
          {trustedDapps.map((dapp) => (
            <div
              key={dapp.name}
              className={`flex flex-row items-center justify-between border border-gray-300 rounded-lg p-4 bg-white transition-opacity ${
                !fastSigningEnabled ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            >
              <div className="flex flex-row items-center gap-x-3">
                <div className="size-8 flex items-center justify-center text-xl">
                  <img src={dapp.icon} alt={dapp.name} />
                </div>
                <span className="text-base font-normal">{dapp.name}</span>
              </div>
              <Switch
                checked={dapp.enabled}
                onCheckedChange={() => handleToggleDapp(dapp.name)}
                disabled={!fastSigningEnabled || updating}
              />
            </div>
          ))}
        </div>

        {/* Update button */}
        <Button
          variant="secondary"
          size="regular"
          className="w-full mt-4"
          onClick={handleUpdate}
          disabled={!fastSigningEnabled || !hasChanges || updating}
        >
          {updating ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2" />
              Updating...
            </>
          ) : (
            'Update'
          )}
        </Button>
      </div>
    </SecondaryPageWrapper>
  );
}
