import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface ILinkWithIDProps {
  href: string;
  children: React.ReactNode;
}

const LinkWithQuery = ({ href, children }: ILinkWithIDProps) => {
  const params = useSearchParams();

  const newHref = params.toString() ? `${href}?${params.toString()}` : href;

  return <Link href={newHref}>{children}</Link>;
};
export default LinkWithQuery;
