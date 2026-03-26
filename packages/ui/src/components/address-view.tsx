import { cn } from '../utils/cn';

export interface AddressViewProps {
  address:
    | {
        country?: string;
        city?: string;
        street?: string;
        house?: number;
        building?: number;
        floor?: number;
        room?: number;
      }
    | null
    | undefined;
  variant?: 'compact' | 'normal';
  fallback?: string;
  className?: string;
}

export function AddressView({
  address,
  variant = 'normal',
  fallback = 'Адрес не указан',
  className,
}: AddressViewProps) {
  if (!address || (!address.city && !address.street && !address.house)) {
    return <span className={cn('text-text-sub', className)}>{fallback}</span>;
  }

  const parts: string[] = [];

  if (address.city) parts.push(address.city);
  if (address.street) parts.push(address.street);
  if (address.house) parts.push(`д. ${address.house}`);

  if (variant === 'normal') {
    if (address.building) parts.push(`корп. ${address.building}`);
    if (address.floor) parts.push(`этаж ${address.floor}`);
    if (address.room) parts.push(`кв. ${address.room}`);
  }

  return (
    <span className={cn('text-text-main', className)}>
      {parts.join(', ')}
    </span>
  );
}
