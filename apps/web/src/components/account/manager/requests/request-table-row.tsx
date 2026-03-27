'use client';

import Link from 'next/link';
import {
  DataTableRow,
  DataTableCell,
} from '@asko/ui';
import type { RepairRequest, ConversationInfo } from './types';
import { STATUS_MAP, STATUS_COLORS, STATUS_LABELS, formatDate } from './constants';
import { ChatStatusBadges } from './chat-status-badges';

export function RequestTableRow({ request, convInfo, currentUserId }: { request: RepairRequest; convInfo?: ConversationInfo; currentUserId: string }) {
  const userName = [request.user?.lastName, request.user?.firstName].filter(Boolean).join(' ') || 'Пользователь';
  const deviceName = request.userDevice?.device?.name || request.description;
  const tabKey = STATUS_MAP[request.status] ?? 'pending';

  return (
    <Link href={`/account/requests/${request.id}`} className="contents">
      <DataTableRow className="hover:bg-gray-50 transition-colors cursor-pointer">
        <DataTableCell mobileLabel="Клиент:" className="lg:w-[180px] lg:flex-shrink-0">
          <p className="text-sm font-medium text-text-main">{userName}</p>
        </DataTableCell>
        <DataTableCell mobileLabel="Устройство:" className="lg:flex-1 lg:px-4">
          <p className="text-sm text-text-main truncate">{deviceName}</p>
        </DataTableCell>
        <DataTableCell mobileLabel="Город:" className="lg:w-[120px] lg:px-4">
          <p className="text-sm text-text-main">{request.address?.city ?? '-'}</p>
        </DataTableCell>
        <DataTableCell mobileLabel="Статус:" className="lg:w-[160px] lg:px-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[tabKey] ?? 'bg-gray-400 text-white'}`}>
            {STATUS_LABELS[request.status] ?? request.status}
          </span>
        </DataTableCell>
        <DataTableCell mobileLabel="Чат:" className="lg:w-[140px] lg:px-4">
          {request.conversationId && <ChatStatusBadges convInfo={convInfo} currentUserId={currentUserId} />}
        </DataTableCell>
        <DataTableCell mobileLabel="Дата:" className="lg:w-[140px] lg:px-4">
          <p className="text-sm text-text-main">{formatDate(request.createdAt)}</p>
        </DataTableCell>
      </DataTableRow>
    </Link>
  );
}
