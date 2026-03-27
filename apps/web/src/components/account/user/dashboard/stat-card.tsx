'use client';

import { Card } from '@asko/ui';

export function StatCard({
  title,
  value,
  children,
}: {
  title: string;
  value?: string | number;
  children?: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col gap-2">
      <span className="text-base font-medium leading-5 text-text-sub">{title}</span>
      {value !== undefined && (
        <span className="text-[56px] lg:text-[72px] font-normal leading-none text-text-main">
          {value}
        </span>
      )}
      {children}
    </Card>
  );
}
