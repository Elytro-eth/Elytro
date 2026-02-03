import { Button, cn, CardWrapper } from '@elytro/ui';

export enum ActivateStepStatus {
  NonReady,
  Ready,
  Finished,
}

interface IActivateStepProps {
  status: ActivateStepStatus;
  stepIndex: number;
  title: string;
  description: string;
  buttonText: string;
  onClick: () => void;
}

export default function ActivateStep({
  status,
  stepIndex,
  title,
  description,
  buttonText,
  onClick,
}: IActivateStepProps) {
  const isFinished = status === ActivateStepStatus.Finished;

  return (
    <CardWrapper className={cn(isFinished && 'bg-[#335457]')}>
      <div className="flex items-center gap-2 font-medium">
        <span
          className={cn(
            'rounded-full w-6 h-6 flex items-center justify-center text-black',
            isFinished ? 'bg-green-50' : 'bg-gray-50'
          )}
        >
          {isFinished ? '✓' : stepIndex}
        </span>
        <span className={cn('text-lg', isFinished ? 'text-[#D4F4C1]' : 'text-gray-900')}>{title}</span>
      </div>
      <div className={cn('text-sm my-4', isFinished ? 'text-[#D4F4C1]' : 'text-gray-500')}>{description}</div>
      {status === ActivateStepStatus.Ready && (
        <Button className="rounded-full" onClick={onClick}>
          {buttonText}
        </Button>
      )}
    </CardWrapper>
  );
}
