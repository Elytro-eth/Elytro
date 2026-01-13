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
    <div className={cn('flex flex-col rounded-sm bg-fade-brown py-sm px-md w-full text-brown', className)}>
      {/* <h2 className="elytro-text-small-bold text-brown">{title}</h2> */}
      <p className="elytro-text-tiny-body text-brown">{description}</p>
    </div>
  );
}
