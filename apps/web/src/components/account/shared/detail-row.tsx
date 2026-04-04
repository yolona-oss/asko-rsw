export function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-border-light last:border-b-0">
      <span className="text-sm text-text-sub flex-shrink-0">{label}</span>
      <span className="text-sm text-text-main text-right">{value}</span>
    </div>
  );
}
