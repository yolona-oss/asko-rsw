'use client';

export function StepCircle({
  label,
  isActive,
  isCompleted,
  isFuture,
  className = '',
}: {
  label: string;
  isActive: boolean;
  isCompleted: boolean;
  isFuture: boolean;
  className?: string;
}) {
  let circleClass = 'border-2 border-[#E8E8E8] bg-surface text-text-sub';
  if (isActive) circleClass = 'bg-green-600 text-white';
  else if (isCompleted) circleClass = 'bg-green-600 text-white';

  return (
    <div className={`flex flex-col items-center gap-2 flex-shrink-0 ${isFuture ? 'opacity-40 blur-[3px]' : ''} ${className}`}>
      <div className="relative">
        {isActive && (
          <div className="absolute inset-0 rounded-full bg-green-600/30 animate-ping" />
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
