import { navigateTo, SidePanelRoutePath } from '@/utils/navigation';
import LogoIcon from '@/assets/logo.svg';
import CheckedIcon from '@/assets/icons/checked.svg';
import { useAccount } from '@/contexts/account-context';
import { useEffect, useState } from 'react';
import { useWallet } from '@/contexts/wallet';

const AddOns = [
  {
    name: 'Social Recovery',
    logo: LogoIcon,
    url: '/recovery-setting' as SidePanelRoutePath,
  },
  {
    name: 'Sign with 2FA',
    logo: LogoIcon,
    url: '/settings/security-hook' as SidePanelRoutePath,
  },
];

const Item = ({ name, logo, url, installed }: { name: string; logo: string; url: string; installed?: boolean }) => {
  return (
    <div
      className="flex flex-col gap-y-2 cursor-pointer bg-gray-50 rounded-md p-lg hover:bg-gray-150"
      onClick={() => navigateTo('side-panel', url as SidePanelRoutePath)}
    >
      <div className="flex flex-row items-center justify-between">
        <img src={logo} alt={name} className="size-10 rounded-full p-1 bg-white" />
        {installed && <img src={CheckedIcon} alt="checked" className="size-6" />}
      </div>

      <div className="flex flex-col gap-y-2">
        <div className="elytro-text-small-bold">{name}</div>
      </div>
    </div>
  );
};

export default function AddOnsTab() {
  const { currentAccount } = useAccount();
  const { wallet } = useWallet();
  const [is2FAInstalled, setIs2FAInstalled] = useState(false);
  const [isRecoveryInstalled, setIsRecoveryInstalled] = useState(false);

  useEffect(() => {
    wallet
      .getSecurityHookStatus()
      .then((status) => {
        setIs2FAInstalled(status.isInstalled);
      })
      .catch(() => {
        setIs2FAInstalled(false);
      });

    if (currentAccount?.address) {
      wallet
        .queryRecoveryContactsByAddress(currentAccount.address as `0x${string}`)
        .then((res) => {
          setIsRecoveryInstalled((res?.contacts?.length || 0) > 0);
        })
        .catch(() => {
          setIsRecoveryInstalled(false);
        });
    }
  }, [wallet, currentAccount]);

  const checkedIntalledAddOns = AddOns.map((addOn) => {
    let installed = false;

    if (addOn.name === 'Social Recovery') {
      installed = isRecoveryInstalled;
    } else if (addOn.name === 'Sign with 2FA') {
      installed = is2FAInstalled;
    }

    return {
      ...addOn,
      installed,
    };
  });

  return (
    <>
      <div className="grid grid-cols-3 gap-x-2 gap-y-2 px-lg">
        {checkedIntalledAddOns.map((addOn) => (
          <Item key={addOn.name} {...addOn} />
        ))}
      </div>

      <div className="elytro-text-tiny-body mt-2xl text-center text-gray-450">
        <a href="https://t.me/+l9coqJq9QHgyYjI1" target="_blank" rel="noopener noreferrer">
          Interested in developing new Add-ons?
        </a>
      </div>
    </>
  );
}
