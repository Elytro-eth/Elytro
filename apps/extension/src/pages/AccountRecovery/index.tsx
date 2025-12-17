import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';
import AddressInputWithChainIcon from '@/components/ui/AddressInputer';
import { useWallet } from '@/contexts/wallet';
import { Button } from '@/components/ui/button';
import { useChain } from '@/contexts/chain-context';
import { navigateTo } from '@/utils/navigation';
import { Box, Clock, Search, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Address, isAddress } from 'viem';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import WalletImg from '@/assets/wallet.png';
import TipItem from '@/components/biz/TipItem';
import { TChainItem } from '@/constants/chains';
import NetworkSelection from '@/components/biz/NetworkSelection';
import { toast } from '@/hooks/use-toast';
import RecoveryFileUploadDialog from './RecoveryFileUploadDialog';

export default function AccountRecovery() {
  const [address, setAddress] = useState('');
  const { currentChain } = useChain();
  const [selectedChain, setSelectedChain] = useState<TChainItem | null>(currentChain);
  const { wallet } = useWallet();
  const [checked, setChecked] = useState(false);
  const [isChainConfirmed, setIsChainConfirmed] = useState(false);
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);

  useEffect(() => {
    const checkRecoveryRecord = async () => {
      try {
        const hasRecoveryRecord = await wallet.hasRecoveryRecord();
        if (hasRecoveryRecord) {
          navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.RetrieveContacts);
        }
      } catch {
        // do nothing
      }
    };

    checkRecoveryRecord();
  }, [wallet]);

  if (!checked) {
    const handleFileUpload = async (file: File) => {
      try {
        const content = await file.text();
        const data = JSON.parse(content);
        if (!data || !data.address || !data.chainId || !data.contacts || !data.threshold) {
          throw new Error('Invalid backup file');
        }

        await wallet.switchChain(data.chainId);
        await wallet.importRecoveryRecord(data.address as Address, data.chainId, data.contacts, data.threshold);
        navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.RetrieveContacts);
      } catch (error) {
        console.error(error);
        toast({
          title: 'Failed to create recovery record',
          // description: 'Please try again',
        });
      }
    };
    return (
      <SecondaryPageWrapper
        title="Recover"
        onBack={() => {
          navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Home);
        }}
      >
        <div className="flex flex-col items-center space-y-2xl mt-10">
          <img src={WalletImg} alt="Wallet" className="size-36" />
          <h1 className="elytro-text-title">How to recover</h1>
          <div>
            <TipItem title="Enter your wallet details" description="" Icon={Search} />
            <TipItem title="Ask your contacts to confirm" description="" Icon={Shield} />
            <TipItem title="Wait 48 hrs until recovered" description="" Icon={Clock} />
          </div>

          <div className="flex flex-col gap-y-sm w-full">
            <Button className="w-full" onClick={() => setChecked(true)}>
              Start Recovery
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => setIsFileDialogOpen(true)}>
              I have a recovery file
            </Button>
          </div>
        </div>
        <RecoveryFileUploadDialog
          open={isFileDialogOpen}
          onOpenChange={setIsFileDialogOpen}
          onFileUpload={handleFileUpload}
        />
      </SecondaryPageWrapper>
    );
  }

  const handleSelectChain = (chain: TChainItem) => {
    setSelectedChain(chain);
  };

  const handleNext = async () => {
    try {
      await wallet.switchChain(selectedChain!.id);
      setIsChainConfirmed(true);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Failed to switch network',
        // description: 'Please try again',
      });
    }
  };

  if (!isChainConfirmed) {
    return (
      <SecondaryPageWrapper
        title="Recovery"
        onBack={() => {
          setAddress('');
          setSelectedChain(null);
        }}
      >
        <NetworkSelection selectedChain={selectedChain} handleSelectChain={handleSelectChain} />
        <div className="w-full grid grid-cols-2 gap-x-sm mt-10">
          <Button variant="tertiary" onClick={() => setChecked(false)}>
            Cancel
          </Button>
          <Button disabled={!selectedChain} onClick={handleNext}>
            Next
          </Button>
        </div>
      </SecondaryPageWrapper>
    );
  }

  const handleStartRecovery = async () => {
    // navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.RetrieveContacts, {
    //   address,
    // });
    try {
      await wallet.createRecoveryRecord(address as Address);
      navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.RetrieveContacts);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Failed to create recovery record',
        // description: 'Please try again',
      });
    }
  };

  return (
    <SecondaryPageWrapper title="Recovery">
      <div className="flex flex-col gap-y-sm mb-md">
        <h1 className="elytro-text-bold-body">Wallet Address</h1>
        <p className="elytro-text-smaller-body text-gray-600">We need it to find your recovery contacts</p>
      </div>

      <AddressInputWithChainIcon chainId={selectedChain!.id} address={address} onChange={setAddress} />
      <Button className="w-full mt-10" disabled={!isAddress(address)} onClick={handleStartRecovery}>
        <Box className="size-4 mr-sm" color="#cce1ea" />
        Retrieve my contacts
      </Button>
    </SecondaryPageWrapper>
  );
}
