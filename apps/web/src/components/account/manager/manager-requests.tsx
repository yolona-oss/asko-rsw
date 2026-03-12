'use client';

import { useState } from 'react';
import Link from 'next/link';

type TabKey = 'new' | 'assigned' | 'in_progress' | 'completed' | 'paid' | 'cancelled';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'new', label: 'Новые' },
  { key: 'assigned', label: 'Назначенные' },
  { key: 'in_progress', label: 'В работе' },
  { key: 'completed', label: 'Завершенные' },
  { key: 'paid', label: 'Оплаченные' },
  { key: 'cancelled', label: 'Отмененные' },
];

const STATUS_COLORS: Record<TabKey, string> = {
  new: 'bg-green-600 text-white',
  assigned: 'bg-yellow-500 text-white',
  in_progress: 'bg-blue-500 text-white',
  completed: 'bg-gray-600 text-white',
  paid: 'bg-emerald-600 text-white',
  cancelled: 'bg-red-500 text-white',
};

const STATUS_LABELS: Record<TabKey, string> = {
  new: 'Новая',
  assigned: 'Назначена',
  in_progress: 'В работе',
  completed: 'Завершена',
  paid: 'Оплачена',
  cancelled: 'Отменена',
};

interface RequestCard {
  id: string;
  date: string;
  location: string;
  clientName: string;
  device: string;
  status: TabKey;
}

const MOCK_REQUESTS: RequestCard[] = Array.from({ length: 9 }, (_, i) => ({
  id: `${434362 + i}`,
  date: '11.02.2026, 13:22',
  location: 'Район Выхина',
  clientName: 'Морозов Владислав Игоревич',
  device: 'Сушильная машина ASKO T408HD.W',
  status: 'new' as TabKey,
}));

function RequestCardItem({ request }: { request: RequestCard }) {
  return (
    <div className="bg-white rounded-sm border border-border-light p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-xs text-text-sub">
        <span>{request.date}</span>
        <span>&bull;</span>
        <span>{request.location}</span>
      </div>
      <p className="text-sm font-medium text-text-main">{request.clientName}</p>
      <p className="text-sm text-text-sub">{request.device}</p>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-sm font-bold text-text-main">Статус:</span>
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[request.status]}`}
        >
          {STATUS_LABELS[request.status]}
        </span>
      </div>
      <Link
        href={`/account/requests/${request.id}`}
        className="flex items-center gap-1 text-sm text-text-main hover:text-brand-red transition-colors mt-auto pt-2"
      >
        Открыть заявку
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </Link>
    </div>
  );
}

export function ManagerRequests() {
  const [activeTab, setActiveTab] = useState<TabKey>('new');

  // In real app, filter by tab. For now show all mock data.
  const filteredRequests = MOCK_REQUESTS;

  return (
    <div className="p-4 lg:p-8 flex flex-col gap-6 lg:gap-8">
      <h1 className="text-[28px] lg:text-[36px] font-medium tracking-[-0.01em] text-text-main">
        Заявки на обслуживание
      </h1>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-sm border transition-colors cursor-pointer ${
              activeTab === tab.key
                ? 'bg-dark-deep text-white border-dark-deep'
                : 'bg-white text-text-main border-border-light hover:border-text-main'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Request cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRequests.map((req) => (
          <RequestCardItem key={req.id} request={req} />
        ))}
      </div>
    </div>
  );
}
