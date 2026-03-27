'use client';

export function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={`inline-block text-sm text-white px-2 py-0.5 rounded-[22px] ${
      isActive ? 'bg-[#187f43]' : 'bg-[#a0a0a0]'
    }`}>
      {isActive ? 'Активен' : 'Заблокирован'}
    </span>
  );
}
