import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';
import AddressInputWithChainIcon from '@/components/ui/AddressInputer';
import { useWallet } from '@/contexts/wallet';
import { Button } from '@/components/ui/button';
import { useChain } from '@/contexts/chain-context';
import { navigateTo } from '@/utils/navigation';
import { Box, Clock, Search, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { isAddress } from 'viem';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import WalletImg from '@/assets/wallet.png';
import TipItem from '@/components/biz/TipItem';
import { TChainItem } from '@/constants/chains';
import NetworkSelection from '@/components/biz/NetworkSelection';
import { toast } from '@/hooks/use-toast';

export default function AccountRecovery() {
  const [address, setAddress] = useState('');
  const { currentChain } = useChain();
  const [selectedChain, setSelectedChain] = useState<TChainItem | null>(
    currentChain
  );
  const { wallet } = useWallet();
  const [checked, setChecked] = useState(false);
  const [isChainConfirmed, setIsChainConfirmed] = useState(false);

  // TODO: check this logic
  useEffect(() => {
    wallet.localRecoveryAddress().then((address) => {
      if (address) {
        navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.RetrieveContacts, {
          address,
        });
      }
    });
  }, [wallet]);

  if (!checked) {
    return (
      <SecondaryPageWrapper
        title="Recover"
        footer={
          <Button className="w-full" onClick={() => setChecked(true)}>
            Start recover
          </Button>
        }
        onBack={() => {
          navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Home);
        }}
      >
        <div className="flex flex-col items-center space-y-2xl mt-3xl">
          <img src={WalletImg} alt="Wallet" className="size-36" />
          <h1 className="elytro-text-title">How recovery works</h1>
          <div>
            <TipItem
              title="1. Enter your account details"
              description="You need  the network & address of your account"
              Icon={Search}
            />
            <TipItem
              title="2. Ask your contacts to recover"
              description="Once we retrieved your recovery contacts, you will notified your contact to help you recover."
              Icon={Shield}
            />
            <TipItem
              title="3. Wait 48 hours until recovered "
              description="Once your required number of contacts have approved, you will need to wait 48 hours before the account is accessible."
              Icon={Clock}
            />
          </div>
        </div>
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
        title: 'Failed to switch chain',
        description: 'Please try again',
      });
    }
  };

  if (!isChainConfirmed) {
    return (
      <SecondaryPageWrapper
        title="Recovery"
        footer={
          <div className="w-full grid grid-cols-2 gap-x-sm">
            <Button variant="outline" onClick={() => setChecked(false)}>
              Cancel
            </Button>
            <Button disabled={!selectedChain} onClick={handleNext}>
              Next
            </Button>
          </div>
        }
      >
        <NetworkSelection
          selectedChain={selectedChain}
          handleSelectChain={handleSelectChain}
        />
      </SecondaryPageWrapper>
    );
  }

  const handleRetrieveContacts = () => {
    navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.RetrieveContacts, {
      address,
    });
  };

  return (
    <SecondaryPageWrapper
      title="Recovery"
      closeable
      footer={
        <Button
          className="w-full"
          disabled={!isAddress(address)}
          onClick={handleRetrieveContacts}
        >
          <Box className="size-4 mr-sm" color="#cce1ea" />
          Retrieve my contacts
        </Button>
      }
    >
      <div className="flex flex-col gap-y-sm mb-md">
        <h1 className="elytro-text-bold-body">Account Address</h1>
        <p className="elytro-text-smaller-body text-gray-600">
          Enter your account address for us to retrieve your recovery contacts
        </p>
      </div>

      <AddressInputWithChainIcon
        chainId={selectedChain!.id}
        address={address}
        onChange={setAddress}
      />
    </SecondaryPageWrapper>
  );
}
