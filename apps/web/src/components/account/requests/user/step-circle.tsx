'use client';

export function StepCircle({
  label,
  isActive,
  isCompleted,
  isFuture,
  isPaused,
  className = '',
}: {
  label: string;
  isActive: boolean;
  isCompleted: boolean;
  isFuture: boolean;
  isPaused?: boolean;
  className?: string;
}) {
  let circleClass = 'border-2 border-border-light bg-surface text-text-sub';
  if (isActive && isPaused) circleClass = 'bg-warning text-text-on-dark';
  else if (isActive) circleClass = 'bg-success text-text-on-dark';
  else if (isCompleted) circleClass = 'bg-success text-text-on-dark';

  return (
    <div className={`flex flex-col items-center gap-2 flex-shrink-0 ${isFuture ? 'opacity-40 blur-[3px]' : ''} ${className}`}>
      <div className="relative">
        {isActive && !isPaused && (
          <div className="absolute inset-0 rounded-full bg-success/30 animate-ping" />
        )}
        {isActive && isPaused && (
          <div className="absolute inset-0 rounded-full bg-warning/30 animate-pulse" />
        )}
        <div
          className={`relative w-20 h-20 lg:w-[100px] lg:h-[100px] rounded-full flex items-center justify-center text-xs lg:text-sm font-medium text-center px-2 leading-tight whitespace-pre-line transition-all duration-500 ${circleClass}`}
        >
          {label}
        </div>
      </div>
    </div>
  );
}
