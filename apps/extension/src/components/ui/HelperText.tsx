import { cn } from '@/utils/shadcn/utils';

interface IHelperTextProps {
  // title: string;
  description: string;
  className?: string;
}

export default function HelperText({
  // title,
  description,
  className,
}: IHelperTextProps) {
  return (
    <div className={cn('flex flex-col rounded-xs bg-light-purple py-sm px-md w-full text-purple', className)}>
      {/* <h2 className="elytro-text-small-bold text-purple">{title}</h2> */}
      <p className="elytro-text-tiny-body text-purple">{description}</p>
    </div>
  );
}
