import Image from 'next/image';

export function AskoUndertextLogo({ className = '' }: { className?: string }) {
  return (
    <Image
      src="/images/logo.svg"
      alt="ASKO"
      width={494}
      height={148}
      className={className}
    />
  );
}
