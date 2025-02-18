import { cn } from '@/utils/shadcn/utils';

interface IErrorTipProps {
  title?: string;
  className?: string;
}

const ErrorTip = ({
  title = 'Oops! Something went wrong',
  className,
}: IErrorTipProps) => (
  <div
    className={cn(
      'w-full flex flex-1 flex-col items-center justify-center gap-y-sm py-2xl',
      className
    )}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="101"
      height="101"
      viewBox="0 0 101 101"
      fill="none"
    >
      <path
        d="M50.1667 91.8333C73.1785 91.8333 91.8333 73.1785 91.8333 50.1667C91.8333 27.1548 73.1785 8.5 50.1667 8.5C27.1548 8.5 8.5 27.1548 8.5 50.1667C8.5 73.1785 27.1548 91.8333 50.1667 91.8333Z"
        fill="#61203F"
      />
      <path
        d="M50.5 33.833V55.5M50.5 67.1663H50.5417"
        stroke="#FF7066"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
    <div className="elytro-text-bold-body text-center w-full">{title}</div>
  </div>
);

export default ErrorTip;
