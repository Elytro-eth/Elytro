import React from 'react';
import { cn } from '../utils';

interface ICardWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export default function CardWrapper({ children, className }: ICardWrapperProps) {
  return <div className={cn('bg-white rounded-2xl p-6', className)}>{children}</div>;
}
