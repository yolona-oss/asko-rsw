'use client';

import {
  Card,
  Badge,
  ContextMenuArea,
  buildCardMenuItems,
} from '@asko/ui';
import type { DropdownMenuEntry } from '@asko/ui';
import { useClickHandlers } from '@/hooks/use-click-handlers';
import { User } from 'lucide-react';
import type { IRepairer } from '@/lib/api/types';
import { repairerName } from './constants';

export function RepairerCard({
  repairer,
  menuItems,
  onClick,
}: {
  repairer: IRepairer;
  menuItems: DropdownMenuEntry[];
  onClick?: () => void;
}) {
  const { handleClick } = useClickHandlers(onClick);

  return (
    <ContextMenuArea items={buildCardMenuItems(onClick, undefined, menuItems)}>
      <Card padding="none" className={`p-5 flex flex-col gap-3${onClick ? ' cursor-pointer' : ''}`} onClick={handleClick}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#E8E8E8] flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-text-sub" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-main">{repairerName(repairer)}</p>
              <p className="text-xs text-text-sub">{repairer.user?.email ?? '-'}</p>
            </div>
          </div>
          <Badge variant={repairer.isActive ? 'success' : 'warning'}>
            {repairer.isActive ? 'Активен' : 'Новый'}
          </Badge>
        </div>

        <div className="flex flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <span className="text-text-sub">Город</span>
            <span className="text-text-main">{repairer.city}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-sub">Выполнено</span>
            <span className="text-text-main">{repairer.completedRepairs}</span>
          </div>
        </div>
      </Card>
    </ContextMenuArea>
  );
}
