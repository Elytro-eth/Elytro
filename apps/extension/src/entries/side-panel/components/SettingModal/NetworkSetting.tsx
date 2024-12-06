import { BackArrow } from '@/assets/icons/BackArrow';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Chain } from 'viem/chains';
import NetworkEditor from './NetworkEditor';
import { useAccount } from '../../contexts/account-context';

export default function NetworkSetting({ onBack }: { onBack: () => void }) {
  // TODO: change it to supported networks
  const { chains: networks } = useAccount();
  const [editingNetwork, setEditingNetwork] = useState<Chain | null>(null);
  return (
    <>
      {editingNetwork ? null : (
        <div className="absolute top-6 left-6 cursor-pointer" onClick={onBack}>
          <BackArrow />
        </div>
      )}
      <h3 className="text-3xl mb-10">
        {editingNetwork ? editingNetwork.name : 'Network'}
      </h3>
      {editingNetwork ? (
        <NetworkEditor
          network={editingNetwork}
          onCancel={() => setEditingNetwork(null)}
        />
      ) : (
        <ul className="space-y-2">
          {networks.map((item) => (
            <li
              key={item.id}
              className="bg-gray-50 rounded-md px-4 py-6 flex items-center justify-between cursor-pointer"
              onClick={() => setEditingNetwork(item)}
            >
              <div className="text-lg font-medium">{item.name}</div>
              <ChevronRight />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
