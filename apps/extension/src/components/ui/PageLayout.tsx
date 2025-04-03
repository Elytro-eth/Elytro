import { cn } from '@/utils/shadcn/utils';
import { ReactElement } from 'react';

export interface IPageLayoutProps {
  children: ReactElement | ReactElement[];
  className?: string;
}

export function PageLayout(props: IPageLayoutProps) {
  const { children } = props;
  return (
    <div
      className="page-layout"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        boxSizing: 'border-box',
      }}
    >
      {children}
    </div>
  );
}

export function PageLayoutBody(props: IPageLayoutProps) {
  const { children, className } = props;
  return (
    <div
      className={cn('page-layout-body', className)}
      style={{
        flex: '1',
        boxSizing: 'border-box',
        overflow: 'auto',
      }}
    >
      {children}
    </div>
  );
}

export function PageLayoutHeader(props: IPageLayoutProps) {
  const { children, className } = props;
  return (
    <div className={cn('page-layout-fixed-top', className)}>{children}</div>
  );
}

export function PageLayoutFooter(props: IPageLayoutProps) {
  const { children, className } = props;
  return (
    <div className={cn('page-layout-fixed-top', className)}>{children}</div>
  );
}
