import { Button } from '@/components/ui/button';
import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';
import { useAccount } from '@/contexts/account-context';
import WalletImg from '@/assets/wallet.png';
import FragmentedAddress from '@/components/biz/FragmentedAddress';
import { VERSION_MODULE_ADDRESS_MAP } from '@/constants/versions';
import {
  getInstallModuleTx,
  getUpgradeModuleTx,
  getUninstallModuleTx,
} from '@/utils/contracts/upgrade';
import { TxRequestTypeEn, useTx } from '@/contexts/tx-context';
import type { Transaction } from '@elytro/sdk';
import { toast } from '@/hooks/use-toast';
import { formatErrorMsg } from '@/utils/format';
import { useWallet } from '@/contexts/wallet';

export default function UpgradeContract() {
  const {
    currentAccount: { address, chainId },
  } = useAccount();
  const { wallet } = useWallet();
  const { handleTxRequest } = useTx();
  const handleStartUpgrade = async () => {
    try {
      const versionInfo = VERSION_MODULE_ADDRESS_MAP[chainId];
      if (!versionInfo) {
        throw new Error('Version info not found for current chain');
      }

      const latestVersionContractAddress =
        versionInfo.versionModuleAddress[versionInfo.latestVersion];
      if (!latestVersionContractAddress) {
        throw new Error('Latest version contract address not found');
      }

      const installedUpgradeModuleAddresses =
        await wallet.getInstalledUpgradeModules();

      const txs: Partial<Transaction>[] = [
        getInstallModuleTx(address, latestVersionContractAddress),
        getUpgradeModuleTx(address, latestVersionContractAddress),
      ];

      if (installedUpgradeModuleAddresses.length > 0) {
        for (const module of installedUpgradeModuleAddresses) {
          txs.push(getUninstallModuleTx(address, module));
        }
      }

      handleTxRequest(TxRequestTypeEn.UpgradeContract, txs as Transaction[]);
    } catch (error) {
      console.error('Upgrade contract failed:', error);
      toast({
        title: 'Failed to upgrade contract',
        description: formatErrorMsg(error),
      });
    }
  };

  return (
    <SecondaryPageWrapper title="Update contract">
      <div className="flex flex-col gap-y-md">
        <h1 className="elytro-text-bold-body">You are updating</h1>
        <div className="flex flex-row justify-between">
          <FragmentedAddress
            address={address}
            chainId={chainId}
            className="p-xs rounded-2xs bg-gray-150"
          />
        </div>
        <div>
          <img src={WalletImg} alt="Wallet" className="size-[144px] mx-auto" />
        </div>
        <div className="elytro-text-bold-body text-center">Update contract</div>
        <div className="bg-gray-150 p-lg rounded-sm space-y-2">
          Version {VERSION_MODULE_ADDRESS_MAP[chainId]?.latestVersion}
        </div>
        <div className="flex text-gray-750 text-center">
          You may not be able to access funds until the update is successful.
        </div>

        <Button
          variant="secondary"
          size="large"
          className="w-full gap-xl"
          onClick={handleStartUpgrade}
        >
          Start update
        </Button>
      </div>
    </SecondaryPageWrapper>
  );
}
