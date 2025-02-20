import React, { useState } from 'react';
import { PasswordSetter } from '@/components/ui/PasswordSetter';
import IconPasscode from '@/assets/passcode.png';
import FullPageWrapper from '@/components/biz/FullPageWrapper';
import { navigateTo } from '@/utils/navigation';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { toast } from '@/hooks/use-toast';
import { useWallet } from '@/contexts/wallet';
import useSearchParams from '@/hooks/use-search-params';

const Create: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { wallet } = useWallet();
  const params = useSearchParams();
  const handleCreatePassword = async (pwd: string) => {
    try {
      setLoading(true);
      await wallet.createNewOwner(pwd);
      navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.YouAreIn, params);
    } catch (error) {
      toast({
        title: 'Oops! Something went wrong. Try again later.',
        description: error?.toString(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <FullPageWrapper showBack>
      <div className="flex justify-center">
        <img src={IconPasscode} alt="Passcode" width={144} />
      </div>
      <h1 className="elytro-text-title text-center">Create a passcode</h1>
      <h2 className="text-sm text-muted-foreground text-center -mt-4">
        This is for access your accounts on this device
      </h2>
      <PasswordSetter
        onSubmit={(pwd) => handleCreatePassword(pwd)}
        loading={loading}
      />
    </FullPageWrapper>
  );
};

export default Create;
