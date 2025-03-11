import Image, { ImageProps } from 'next/image';

export default function WrappedImage({ src, ...rest }: ImageProps) {
  const isBase64Image = (imgSrc: ImageProps['src']): boolean => {
    if (!imgSrc || typeof imgSrc !== 'string') return false;
    return imgSrc.includes('base64') || imgSrc.startsWith('data:');
  };

  return isBase64Image(src) ? (
    <img src={src as string} {...rest} />
  ) : (
    <Image src={src} {...rest} />
  );
}
