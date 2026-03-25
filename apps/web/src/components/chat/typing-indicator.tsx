'use client';

export function TypingIndicator({ userNames }: { userNames: string[] }) {
  if (userNames.length === 0) return null;

  const text = userNames.length === 1
    ? `${userNames[0]} печатает`
    : `${userNames.join(', ')} печатают`;

  return (
    <div className="px-4 py-1 text-xs text-text-sub">
      <span>{text}</span>
      <span className="inline-flex ml-0.5">
        <span className="animate-bounce [animation-delay:0ms]">.</span>
        <span className="animate-bounce [animation-delay:150ms]">.</span>
        <span className="animate-bounce [animation-delay:300ms]">.</span>
      </span>
    </div>
  );
}
