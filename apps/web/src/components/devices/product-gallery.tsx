'use client';

import { ImageGallery } from '@asko/ui';

interface ProductGalleryProps {
  images: string[];
  title: string;
  mobile?: boolean;
}

export function ProductGallery({ images, title, mobile }: ProductGalleryProps) {
  if (mobile) {
    return (
      <ImageGallery
        images={images}
        alt={title}
        variant="product"
        fullscreen
        zoom={false}
      />
    );
  }

  return (
    <ImageGallery
      images={images}
      alt={title}
      variant="product"
      switchOn="hover"
      zoom={{ scale: 2.5 }}
      fullscreen
    />
  );
}
