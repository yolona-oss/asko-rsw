'use client';

import {
  Button,
  DataTableRow,
  DataTableCell,
} from '@asko/ui';
import type { IRepairer } from '@/lib/api/types';
import { repairerName, formatDate } from './constants';

export function RepairerRow({
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
    <DataTableRow>
      {/* Avatar + Name */}
      <DataTableCell className="flex items-center gap-3 lg:w-[200px] lg:flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-[#E8E8E8] flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-text-sub" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>
        <div>
          <p className="text-xs text-text-sub lg:hidden">Имя:</p>
          <p className="text-sm font-medium text-text-main">{repairerName(repairer)}</p>
        </div>
      </DataTableCell>

      {/* Email */}
      <DataTableCell mobileLabel="Почта:" className="lg:flex-1 lg:px-4">
        <p className="text-sm text-text-main">{repairer.user?.email ?? '-'}</p>
      </DataTableCell>

      {/* City */}
      <DataTableCell mobileLabel="Город:" className="lg:flex-1 lg:px-4">
        <p className="text-sm text-text-main">{repairer.city}</p>
      </DataTableCell>

      {/* Completed repairs */}
      <DataTableCell mobileLabel="Выполнено:" className="lg:w-[100px] lg:px-4">
        <p className="text-sm text-text-main">{repairer.completedRepairs}</p>
      </DataTableCell>

      {/* Last location update */}
      <DataTableCell mobileLabel="Геопозиция:" className="lg:w-[160px] lg:px-4">
        <p className="text-sm text-text-main">{formatDate(repairer.lastLocationUpdate)}</p>
      </DataTableCell>

      {/* Action */}
      <DataTableCell className="lg:w-[130px] lg:flex-shrink-0 lg:text-right">
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
      </DataTableCell>
    </DataTableRow>
  );
}
