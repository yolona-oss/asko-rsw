import Image from 'next/image';
import { getPlaceholderSrc, type PlaceholderCategory } from '@/lib/placeholders';

export interface PlaceholderImageProps {
  category: PlaceholderCategory;
  /** Entity id or array index — used to deterministically pick a variant */
  idOrIndex?: string | number;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  alt?: string;
}

export function PlaceholderImage({
  category,
  idOrIndex,
  fill,
  width,
  height,
  sizes,
  className,
  alt = '',
}: PlaceholderImageProps) {
  const src = getPlaceholderSrc(category, idOrIndex);

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={!fill ? width : undefined}
      height={!fill ? height : undefined}
      sizes={sizes}
      className={className}
    />
  );
}
