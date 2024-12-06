import React, { useState } from 'react';
import TabLayout from '../components/TabLayout';
import { BackArrow } from '@/assets/icons/BackArrow';
import { PasswordSetter } from '../components/PasswordSetter';
import { navigateTo } from '@/utils/navigation';
import { toast } from '@/hooks/use-toast';
import { TAB_ROUTE_PATHS } from '../routes';
import { useKeyring } from '@/contexts/keyring';
import { SIDE_PANEL_ROUTE_PATHS } from '@/entries/side-panel/routes';
import { useWallet } from '@/contexts/wallet';

const Create: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const wallet = useWallet();
  const { createNewOwner } = useKeyring();
  const goBack = () => {
    history.back();
  };

  const handleCreatePassword = async (pwd: string) => {
    setLoading(true);
    try {
      await createNewOwner(pwd);
      // TODO: replace this when user can select a chain at create step.
      const currentChain = await wallet.getCurrentChain();
      await wallet.createNewSmartAccount(currentChain.id, true);
      // open side panel here, cause sidePanel.open() only can be called in response to a user gesture.
      navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.Dashboard);

      setTimeout(() => {
        navigateTo('tab', TAB_ROUTE_PATHS.Success);
      }, 400);
    } catch (error) {
      toast({
        title: 'Oops! Something went wrong. Try again later.',
        description: error?.toString(),
      });
    }
  };

  return (
    <TabLayout>
      {/* Back Arrow */}
      <BackArrow onClick={goBack} className="w-6 h-6" />
      {/* Create password */}
      <div className="flex flex-col  p-4 gay-y-8">
        <div className="text-3xl mb-4">Set Password</div>
        <PasswordSetter onSubmit={handleCreatePassword} loading={loading} />
      </div>
    </TabLayout>
  );
};

export default Create;
