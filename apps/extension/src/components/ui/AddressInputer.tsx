import { getIconByChainId } from '@/constants/chains';
import { Input } from '@/components/ui/input';

interface IAddressInputWithChainIconProps {
  chainId: number;
  address: string;
  onChange: (address: string) => void;
}

export default function AddressInputWithChainIcon({
  chainId,
  address,
  onChange,
}: IAddressInputWithChainIconProps) {
  return (
    <div className="w-full flex flex-row items-center  bg-gray-150 rounded-md px-lg py-sm elytro-text-body text-gray-600">
      <img src={getIconByChainId(chainId)} className=" size-8" />
      <Input
        className="border-none bg-transparent text-lg"
        placeholder="Enter wallet address"
        value={address}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
