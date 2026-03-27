'use client';

import {
  Button,
  Card,
  Badge,
} from '@asko/ui';
import type { IRepairer } from '@/lib/api/types';
import { repairerName } from './constants';

export function RepairerCard({
  repairer,
  onActivate,
  onDeactivate,
  actionLoading,
}: {
  repairer: IRepairer;
  onActivate?: (id: string) => void;
  onDeactivate?: (id: string) => void;
  actionLoading: string | null;
}) {
  const isLoading = actionLoading === repairer.id;

  return (
    <Card padding="none" className="p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#E8E8E8] flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-text-sub" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
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

      <div className="pt-1">
        {onActivate && (
          <Button
            variant="primary"
            size="sm"
            disabled={isLoading}
            onClick={() => onActivate(repairer.id)}
          >
            {isLoading ? '...' : 'Активировать'}
          </Button>
        )}
        {onDeactivate && (
          <Button
            variant="danger"
            size="sm"
            disabled={isLoading}
            onClick={() => onDeactivate(repairer.id)}
          >
            {isLoading ? '...' : 'Деактивировать'}
          </Button>
        )}
      </div>
    </Card>
  );
}
