'use client';

export function StepLine({ completed, className = '' }: { completed: boolean; className?: string }) {
  return (
    <div className={`flex-1 h-[3px] mt-10 lg:mt-[50px] min-w-[20px] ${className}`}>
      <div className={`h-full rounded-full transition-colors duration-500 ${completed ? 'bg-success' : 'bg-border-light'}`} />
    </div>
  );
}
