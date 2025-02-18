import { LucideProps } from 'lucide-react';

interface ITipItemProps {
  title: string;
  description: string;
  Icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>
  >;
  index?: number;
}

export default function TipItem({
  title,
  description,
  Icon,
  index,
}: ITipItemProps) {
  return (
    <div className="flex flex-row gap-x-2xs py-xs px-lg">
      <Icon className="size-4 mt-1 flex-shrink-0" />

      <div className="flex flex-col gap-y-2xs leading-none ml-md">
        <span className="elytro-text-bold-body">
          {index ? index : ''} {title}
        </span>
        <span className="elytro-text-tiny-body text-gray-600">
          {description}
        </span>
      </div>
    </div>
  );
}
