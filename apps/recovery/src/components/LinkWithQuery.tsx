'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

interface ILinkWithIDProps {
  href: string;
  children: React.ReactNode;
}

const LinkWithQueryInner = ({ href, children }: ILinkWithIDProps) => {
  const params = useSearchParams();

  const newHref = params.toString() ? `${href}?${params.toString()}` : href.endsWith('/') ? href : `${href}/`;

  return (
    <a
      href={newHref}
      onClick={(e) => {
        // 如果不是在 IPFS 环境下，使用客户端路由
        if (!window.location.href.includes('ipfs')) {
          e.preventDefault();
          window.history.pushState({}, '', newHref);
        }
      }}
    >
      {children}
    </a>
  );
};

const LinkWithQuery = (props: ILinkWithIDProps) => {
  return (
    <Suspense fallback={<a href={props.href}>{props.children}</a>}>
      <LinkWithQueryInner {...props} />
    </Suspense>
  );
};

export default LinkWithQuery;
