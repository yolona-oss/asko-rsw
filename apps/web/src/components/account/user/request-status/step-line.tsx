'use client';

export function StepLine({ completed }: { completed: boolean }) {
  return (
    <div className="flex-1 h-[3px] mt-10 lg:mt-[50px] min-w-[20px]">
      <div className={`h-full rounded-full transition-colors duration-500 ${completed ? 'bg-green-600' : 'bg-[#E8E8E8]'}`} />
    </div>
  );
}
