import { cn } from '@asko/ui';

interface ProductCardProps {
  title: string;
  description: string;
  className?: string;
}

export function ProductCard({ title, description, className }: ProductCardProps) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-dark-light p-6 transition-transform hover:-translate-y-1',
        className,
      )}
    >
      <div className="aspect-[4/3] rounded-xl bg-dark mb-4 flex items-center justify-center">
        <span className="text-3xl font-bold text-gray-700">ASKO</span>
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-gray-400 line-clamp-2">{description}</p>
    </div>
  );
}
