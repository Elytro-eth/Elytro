import { Button, ButtonProps } from '@/components/ui/button';
import React from 'react';

interface ActionButtonProps extends ButtonProps {
  icon: React.ReactNode;
  label: string;
}

export default function ActionButton({ icon, label, ...props }: ActionButtonProps) {
  return (
    <Button key={label} {...props} variant="secondary">
      {icon}
      {label}
    </Button>
  );
}
