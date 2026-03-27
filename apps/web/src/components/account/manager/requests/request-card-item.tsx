'use client';

import Link from 'next/link';
import { Card } from '@asko/ui';
import type { RepairRequest, ConversationInfo } from './types';
import { STATUS_MAP, STATUS_COLORS, STATUS_LABELS, formatDate } from './constants';
import { ChatStatusBadges } from './chat-status-badges';

export function RequestCardItem({ request, convInfo, currentUserId }: { request: RepairRequest; convInfo?: ConversationInfo; currentUserId: string }) {
  const tabKey = STATUS_MAP[request.status] ?? 'pending';
  const userName = [request.user?.lastName, request.user?.firstName].filter(Boolean).join(' ') || 'Пользователь';
  const deviceName = request.userDevice?.device?.name || request.description;
  const location = request.address?.city || '';

  return (
    <Card padding="none" className="p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-text-sub">
          <span>{formatDate(request.createdAt)}</span>
          {location && (
            <>
              <span>&bull;</span>
              <span>{location}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {request.conversationId && (
            <ChatStatusBadges convInfo={convInfo} currentUserId={currentUserId} />
          )}
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[tabKey] ?? 'bg-gray-400 text-white'}`}
          >
            {STATUS_LABELS[request.status] ?? request.status}
          </span>
        </div>
      </div>
      <p className="text-sm font-medium text-text-main">{userName}</p>
      <p className="text-sm text-text-sub">{deviceName}</p>
      <Link
        href={`/account/requests/${request.id}`}
        className="flex items-center gap-1 text-sm text-text-main hover:text-brand-red transition-colors mt-auto pt-2"
      >
        Открыть заявку
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </Link>
    </Card>
  );
}
