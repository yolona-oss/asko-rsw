const pulse = 'animate-pulse bg-[#C4C4C4]';

export function SkeletonBlock({
  className = '',
  red = false,
}: {
  className?: string;
  red?: boolean;
}) {
  return (
    <div
      className={`${red ? 'animate-pulse bg-[#F5A3A3]' : pulse} ${className}`}
    />
  );
}

export function SkeletonCircle({ className = '' }: { className?: string }) {
  return <div className={`${pulse} rounded-full ${className}`} />;
}

function SkeletonText({
  className = '',
  lines = 1,
}: {
  className?: string;
  lines?: number;
}) {
  if (lines === 1) {
    return <div className={`${pulse} h-4 ${className}`} />;
  }
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`${pulse} h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'} ${className}`}
        />
      ))}
    </div>
  );
}

/** Full card skeleton (the gray rectangle from screenshots) */
export function SkeletonCard({ className = '' }: { className?: string }) {
  return <div className={`${pulse} ${className}`} />;
}
