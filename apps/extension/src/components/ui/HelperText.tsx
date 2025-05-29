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
    <div className={cn('flex flex-col rounded-sm bg-light-purple py-md px-lg text-purple', className)}>
      {/* <h2 className="elytro-text-small-bold text-purple">{title}</h2> */}
      <p className="elytro-text-tiny-body text-purple">{description}</p>
    </div>
  );
}
