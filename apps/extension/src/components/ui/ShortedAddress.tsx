import { getIconByChainId } from '@/constants/chains';
import { ShortedAddress as BaseShortedAddress, type ShortedAddressSize } from '@elytro/ui';
import { ReactNode } from 'react';

interface IProps {
  address: string;
  chainId?: number;
  className?: string;
  size?: ShortedAddressSize;
  hideTooltip?: boolean;
  showChainIcon?: boolean;
  dotColor?: string;
  rightExtra?: ReactNode;
  bottomExtra?: ReactNode;
}

/**
 * Extension-specific wrapper that resolves chainId to icon URL
 */
export default function ShortedAddress({
  address,
  chainId,
  className,
  size = 'sm',
  hideTooltip = false,
  showChainIcon = true,
  dotColor,
  rightExtra,
  bottomExtra,
}: IProps) {
  const chainIconUrl = chainId ? getIconByChainId(chainId) : undefined;

  return (
    <BaseShortedAddress
      address={address}
      chainIconUrl={chainIconUrl}
      className={className}
      size={size}
      hideTooltip={hideTooltip}
      showChainIcon={showChainIcon}
      dotColor={dotColor}
      rightExtra={rightExtra}
      bottomExtra={bottomExtra}
    />
  );
}
