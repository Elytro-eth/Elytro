import { BackArrow } from '@/assets/icons/BackArrow';
import ReceiveAddress from '../components/ReceiveAddress';
import { useAccount } from '../contexts/account-context';

export default function Receive() {
  const {
    accountInfo: { address },
    currentChain,
  } = useAccount();

  return (
    <div className="flex flex-col flex-grow w-full bg-gray-50 p-4">
      <BackArrow
        className="w-4 h-4"
        onClick={() => {
          history.back();
        }}
      />
      <h1 className="text-2xl text-gray-900 font-medium my-8">Receive</h1>
      <ReceiveAddress address={address!} currentChain={currentChain!} />
    </div>
  );
}
