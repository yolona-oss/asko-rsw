'use client';

const TYPE_LABELS: Record<string, string> = {
  image: 'изображение',
  video: 'видео',
  document: 'документ',
};

export interface UploadingEntry {
  name: string;
  type: string;
}

export function UploadingIndicator({ entries }: { entries: UploadingEntry[] }) {
  if (entries.length === 0) return null;

  let text: string;
  if (entries.length === 1) {
    const entry = entries[0];
    const typeLabel = TYPE_LABELS[entry.type] || 'файл';
    text = `${entry.name} загружает ${typeLabel}`;
  } else {
    const names = entries.map(e => e.name).join(', ');
    text = `${names} загружают файлы`;
  }

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
