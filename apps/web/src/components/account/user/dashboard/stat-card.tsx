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
      <span className="text-[24px] font-medium leading-[28px] text-text-sub">{title}</span>
      {value !== undefined && (
        <span className="text-[82px] font-normal leading-[86px] text-text-main">
          {value}
        </span>
      )}
      {children}
    </Card>
  );
}
