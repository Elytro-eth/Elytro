import { cn } from '../utils';

const SLOGAN = 'Next-gen\nDecentralized\nEthereum wallet';

interface SloganProps {
  size?: 'md' | 'lg';
}

const textSizeMap = {
  lg: 'text-6xl',
  md: 'text-4xl',
};

const Slogan = ({ size = 'lg' }: SloganProps) => (
  <h1 className={cn('w-full whitespace-pre-wrap font-medium text-left', textSizeMap[size])}>{SLOGAN}</h1>
);

export default Slogan;
