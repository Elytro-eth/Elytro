import { cn } from '@/utils/shadcn/utils';
import Spin from './Spin';

interface IProcessingTipProps {
  body?: string;
  subBody?: string;
  className?: string;
}

const ProcessingTip = ({ body = 'Preparing...', subBody = '', className }: IProcessingTipProps) => (
  <div
    className={cn('flex flex-col items-center justify-center gap-y-sm h-48 my-16', className)}
    role="status"
    aria-live="polite"
    aria-label={body}
  >
    <div className="rounded-pill p-md">
      <Spin size="lg" color="text-white" isLoading inline className="opacity-90" />
    </div>
    <div className="elytro-text-bold-body">{body}</div>
    {subBody ? <div className="elytro-text-tiny-body text-gray-600">{subBody}</div> : null}
  </div>
);

export default ProcessingTip;
