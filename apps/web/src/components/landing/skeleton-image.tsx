'use client';

import { useState } from 'react';
import Image, { ImageProps } from 'next/image';

/**
 * Next/Image wrapper that shows a pulse skeleton until the image loads.
 * Drop-in replacement - accepts all next/image props.
 */
export function SkeletonImage({ className = '', onLoad, ...props }: ImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {/* Skeleton placeholder */}
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-[#C4C4C4]" />
      )}
      <Image
        {...props}
        className={`${className} transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={(e) => {
          setLoaded(true);
          if (typeof onLoad === 'function') onLoad(e);
        }}
      />
    </>
  );
}
