import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import LogoWithCircle from '@/assets/logoWithCircle.svg';
import { CheckIcon } from 'lucide-react';

interface IProps {
  dApp: TDAppInfo;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConnectionConfirmation({ dApp, onConfirm, onCancel }: IProps) {
  const tips = ['Access to your balance and activities', 'Send you requests for transactions'];

  return (
    <Card className="w-full h-full p-1 flex flex-col border-none rounded-none shadow-none">
      <div className="flex justify-center mt-10 ">
        <Avatar className="size-5xl left-2 z-10 rounded-full">
          <AvatarImage src={LogoWithCircle} alt="Elytro" />
          <AvatarFallback>Elytro</AvatarFallback>
        </Avatar>
        <Avatar className="size-5xl z-0 rounded-full mr-4">
          <AvatarImage src={dApp.icon} alt={`${dApp.name} icon`} />
          <AvatarFallback>{dApp.name}</AvatarFallback>
        </Avatar>
      </div>

      <div className="text-center my-8">
        <h2 title={dApp.name} className="elytro-text-bold-body truncate w-[300px] mx-auto text-ellipsis">
          Connect to {dApp.name}
        </h2>
        <p
          title={dApp.origin ? dApp.origin.replace(/^https:\/\//, '') : ''}
          className="elytro-text-small mt-sm text-gray-600 truncate max-w-full px-4"
        >
          {dApp.origin ? dApp.origin.replace(/^https:\/\//, '') : ''}
        </p>
      </div>

      <div className="mb-8">
        <ul className="space-y-2xs">
          {tips.map((tip) => (
            <li className="flex items-start text-sm  align-center" key={tip}>
              <CheckIcon className="bg-light-green p-1 w-5 h-5 rounded-full text-green-100 mr-sm flex-shrink-0 size-lg my-auto" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex space-x-4">
        <Button variant="outline" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button className="flex-1" onClick={onConfirm}>
          Connect
        </Button>
      </div>
    </Card>
  );
}
