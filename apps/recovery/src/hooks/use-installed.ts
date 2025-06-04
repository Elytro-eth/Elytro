import { useEffect } from 'react';

import { useState } from 'react';
import { useConnectors } from 'wagmi';

// check if current browser installed elytro
export const useIsInstalled = () => {
  const [isInstalled, setIsInstalled] = useState(false);
  const connectors = useConnectors();

  useEffect(() => {
    const checkInstalled = async () => {
      const isInstalled = connectors.some((connector) => connector.name === 'Elytro');
      setIsInstalled(isInstalled);
    };
    checkInstalled();
  }, [connectors]);

  return isInstalled;
};
