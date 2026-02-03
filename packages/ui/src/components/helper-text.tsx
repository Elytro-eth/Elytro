import { cn } from '../utils';

interface IHelperTextProps {
  description: string;
  className?: string;
}

export default function HelperText({ description, className }: IHelperTextProps) {
  return (
    <div className={cn('flex flex-col rounded-sm bg-brown-300 py-sm px-md w-full text-brown-600', className)}>
      <p className="elytro-text-tiny-body text-brown-750">{description}</p>
    </div>
  );
}
