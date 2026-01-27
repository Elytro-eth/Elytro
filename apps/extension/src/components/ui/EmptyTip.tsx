import emptyImage from '@/assets/bg-images/coin_eth.png';
import { PropsWithChildren } from 'react';

interface IProps extends PropsWithChildren {
  tip: string;
}

export default function EmptyTip({ tip, children }: IProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full flex-grow">
      <img src={emptyImage} alt="empty" className="size-36" />
      <p className="text-lg text-gray-400 my-6">{tip}</p>
      {children || null}
    </div>
  );
}
