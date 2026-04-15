import { cn } from '../utils/cn';

export interface AddressViewProps {
  address:
    | {
        city?: string;
        district?: string;
        street?: string;
        house?: string;
        building?: string;
        apartment?: string;
        entrance?: string;
        floor?: string;
        intercom?: string;
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
  if (address.district) parts.push(address.district);
  if (address.street) parts.push(address.street);
  if (address.house) parts.push(`д. ${address.house}`);

  if (variant === 'normal') {
    if (address.building) parts.push(`корп. ${address.building}`);
    if (address.entrance) parts.push(`подъезд ${address.entrance}`);
    if (address.floor) parts.push(`этаж ${address.floor}`);
    if (address.apartment) parts.push(`кв. ${address.apartment}`);
  }

  return (
    <span className={cn('text-text-main', className)}>
      {parts.join(', ')}
    </span>
  );
}
