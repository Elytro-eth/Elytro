import TipItem from '@/components/biz/TipItem';
import { Button } from '@/components/ui/button';
import { LucideProps } from 'lucide-react';

interface GuideProps {
  img: string;
  title: string;
  action: string;
  onAction: () => void;
  tips: {
    title: string;
    description: string;
    Icon: React.ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>>;
  }[];
}

export default function Guide({ img, title, action, onAction, tips }: GuideProps) {
  return (
    <div className="flex flex-col gap-y-xl items-center mt-10 h-full justify-between">
      <img src={img} className="size-36" />
      <div className="elytro-text-subtitle text-center text-dark-blue">{title}</div>
      <div>
        {tips.map((tip) => (
          <TipItem key={tip.title} title={tip.title} description={tip.description} Icon={tip.Icon} />
        ))}
      </div>
      <Button onClick={onAction} className="w-full">
        {action}
      </Button>
    </div>
  );
}
