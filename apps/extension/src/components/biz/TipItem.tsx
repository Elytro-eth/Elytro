import { LucideProps } from 'lucide-react';

interface ITipItemProps {
  title: string;
  description: string;
  Icon: React.ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>>;
  index?: number;
}

export default function TipItem({ title, description: _description, Icon, index: _index }: ITipItemProps) {
  return (
    <div className="flex items-center gap-x-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-fade-brown flex items-center justify-center">
        <Icon className="w-4 h-4 stroke-dark-brown" strokeWidth={2} />
      </div>
      <span className="text-base text-gray-750">{title}</span>
    </div>
  );
}
