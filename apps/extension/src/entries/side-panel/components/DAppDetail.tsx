import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface IDAppDetail {
  dapp: TDAppInfo;
  chainName: string;
}

export default function DAppDetail({ dapp, chainName }: IDAppDetail) {
  return (
    <div className="flex items-center mb-2 w-full flex-grow">
      {/* DApp Icon & Chain Icon */}
      <div className="relative mr-4">
        <Avatar className="h-12 w-12  ">
          <AvatarImage src={dapp.icon} alt={`${dapp.name} logo`} />
          <AvatarFallback>{dapp.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>

        <Avatar className="h-6 w-6 absolute -bottom-2 -right-2 ">
          <AvatarImage
            src={
              'https://assets.coingecko.com/coins/images/25244/standard/Optimism.png'
            }
            alt={`${chainName} logo`}
          />
          <AvatarFallback>
            {chainName?.slice(0, 2)?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* DApp Name & Origin */}
      <div className="flex flex-col">
        <h2 className="text-xl font-bold">{dapp.name}</h2>
        {dapp.origin && (
          <a
            href={dapp.origin}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-500 hover:underline"
          >
            {dapp.origin}
          </a>
        )}
      </div>
    </div>
  );
}
