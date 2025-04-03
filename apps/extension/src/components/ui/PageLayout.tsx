import { cn } from '@/utils/shadcn/utils';
import { ReactNode } from 'react';

interface IPageLayoutProps {
  children: ReactNode;
  className?: string;
}

function PageLayout({ children, className }: IPageLayoutProps) {
  return (
    <div className={cn('flex flex-col h-screen box-border', className)}>
      {children}
    </div>
  );
}

function PageLayoutBody({ children, className }: IPageLayoutProps) {
  return (
    <div className={cn('flex-1 box-border overflow-auto', className)}>
      {children}
    </div>
  );
}

function PageLayoutHeader({ children, className }: IPageLayoutProps) {
  return <div className={className}>{children}</div>;
}

function PageLayoutFooter({ children, className }: IPageLayoutProps) {
  return <div className={className}>{children}</div>;
}

PageLayout.Body = PageLayoutBody;
PageLayout.Header = PageLayoutHeader;
PageLayout.Footer = PageLayoutFooter;
export default PageLayout;
