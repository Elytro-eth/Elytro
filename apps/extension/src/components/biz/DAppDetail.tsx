import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface IDAppDetail {
  dapp: TDAppInfo;
}

export default function DAppDetail({ dapp }: IDAppDetail) {
  return (
    <div className="flex flex-col items-center gap-y-2 py-2 w-full">
      {/* DApp Icon */}
      <Avatar className="size-16 border border-gray-300 bg-white flex items-center justify-center">
        <AvatarImage src={dapp.icon} alt={`${dapp.name} logo`} className="size-10" />
        <AvatarFallback className="text-xl">{dapp.name.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>

      {/* DApp Name & Origin */}
      <div className="flex flex-col items-center">
        <h2 className="elytro-text-bold-body text-center">{dapp.name}</h2>
        {dapp.origin && <span className="text-sm text-gray-450">{new URL(dapp.origin).hostname}</span>}
      </div>
    </div>
  );
}
