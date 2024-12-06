import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useState } from 'react';
import GuardianIcon from '@/assets/icons/guardian.svg';
import NetworkIcon from '@/assets/icons/network.svg';
import LockIcon from '@/assets/icons/lock.svg';
import { BackArrow } from '@/assets/icons/BackArrow';
import ReceiveAddress from '../ReceiveAddress';
import { useAccount } from '../../contexts/account-context';
import NetworkSetting from './NetworkSetting';
import { useKeyring } from '@/contexts/keyring';
import { Chain } from 'viem';

interface IProps {
  open: boolean;
  onOpenChange: () => void;
}

export default function SettingModal({ open, onOpenChange }: IProps) {
  const {
    accountInfo: { address },
    currentChain,
  } = useAccount();
  const [currentSetting, setCurrentSetting] = useState('');
  const { lock } = useKeyring();
  const handleOnOpenChange = () => {
    setCurrentSetting('');
    onOpenChange();
  };

  const settingList = [
    {
      icon: GuardianIcon,
      label: 'Account Settings',
      action: () => setCurrentSetting('Account Settings'),
    },
    {
      icon: NetworkIcon,
      label: 'Network',
      action: () => setCurrentSetting('Network'),
    },
    {
      icon: LockIcon,
      label: 'Lock Wallet',
      action: async () => {
        await lock();
        setCurrentSetting('');
      },
    },
  ];

  const renderContent = () => {
    switch (currentSetting) {
      case 'Account Settings':
        return (
          <>
            <div
              className="absolute top-6 left-6 cursor-pointer"
              onClick={() => setCurrentSetting('')}
            >
              <BackArrow />
            </div>
            <h3 className="text-3xl mb-10">Setting</h3>
            <div className="flex justify-center">
              <ReceiveAddress
                address={address as string}
                currentChain={currentChain as Chain}
              />
            </div>
          </>
        );
      case 'Network':
        return <NetworkSetting onBack={() => setCurrentSetting('')} />;
      default:
        return (
          <>
            <h3 className="text-3xl mb-10">Setting</h3>
            <ul className="space-y-4 ">
              {settingList.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center cursor-pointer"
                  onClick={item.action}
                >
                  <img
                    className="w-8 h-8 mr-2"
                    src={item.icon}
                    alt={item.label}
                  />
                  <div className="text-lg font-medium">{item.label}</div>
                </li>
              ))}
            </ul>
          </>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOnOpenChange}>
      <DialogContent className="h-screen">
        <div className="mt-10">{renderContent()}</div>
      </DialogContent>
    </Dialog>
  );
}
