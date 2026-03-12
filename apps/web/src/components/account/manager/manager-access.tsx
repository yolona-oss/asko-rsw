'use client';

import { useState } from 'react';

type AccessTab = 'new' | 'assigned';

interface Repairer {
  id: string;
  name: string;
  email: string;
  location: string;
  status: 'free' | 'busy';
  lastRequest: string;
}

const MOCK_REPAIRERS: Repairer[] = Array.from({ length: 6 }, (_, i) => ({
  id: `rep-${i}`,
  name: 'Морозов Владислав Игоревич',
  email: 'ivanov@asko.ru',
  location: 'ул.Центральная, дом 145, кв 11',
  status: 'free' as const,
  lastRequest: '11.03.2026 15:25',
}));

function RepairerRow({ repairer }: { repairer: Repairer }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-0 px-5 py-4 border-b border-border-light last:border-b-0 bg-white">
      {/* Avatar + Name */}
      <div className="flex items-center gap-3 lg:w-[200px] lg:flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-[#E8E8E8] flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-text-sub" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>
        <div>
          <p className="text-xs text-text-sub lg:hidden">Имя:</p>
          <p className="text-sm font-medium text-text-main">{repairer.name}</p>
        </div>
      </div>

      {/* Email */}
      <div className="lg:flex-1 lg:px-4">
        <p className="text-xs text-text-sub lg:hidden">Почта:</p>
        <p className="text-sm text-text-main">{repairer.email}</p>
      </div>

      {/* Location */}
      <div className="lg:flex-1 lg:px-4">
        <p className="text-xs text-text-sub lg:hidden">Локация:</p>
        <p className="text-sm text-text-main">{repairer.location}</p>
      </div>

      {/* Status */}
      <div className="lg:w-[100px] lg:px-4">
        <p className="text-xs text-text-sub lg:hidden">Статус:</p>
        <span
          className={`text-sm font-medium ${
            repairer.status === 'free' ? 'text-green-600' : 'text-yellow-600'
          }`}
        >
          {repairer.status === 'free' ? 'Свободен' : 'Занят'}
        </span>
      </div>

      {/* Last request */}
      <div className="lg:w-[150px] lg:px-4">
        <p className="text-xs text-text-sub lg:hidden">Последняя заявка:</p>
        <p className="text-sm text-text-main">{repairer.lastRequest}</p>
      </div>

      {/* Action */}
      <div className="lg:w-[120px] lg:flex-shrink-0 lg:text-right">
        <button
          type="button"
          className="px-5 py-2 text-sm font-medium text-white bg-brand-red rounded-sm cursor-pointer"
        >
          Назначить
        </button>
      </div>
    </div>
  );
}

export function ManagerAccess() {
  const [activeTab, setActiveTab] = useState<AccessTab>('new');

  return (
    <div className="p-4 lg:p-8 flex flex-col gap-6 lg:gap-8">
      <h1 className="text-[28px] lg:text-[36px] font-medium tracking-[-0.01em] text-text-main">
        Выдача доступов
      </h1>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('new')}
          className={`px-4 py-2 text-sm font-medium rounded-sm border transition-colors cursor-pointer ${
            activeTab === 'new'
              ? 'bg-dark-deep text-white border-dark-deep'
              : 'bg-white text-text-main border-border-light hover:border-text-main'
          }`}
        >
          Новые
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('assigned')}
          className={`px-4 py-2 text-sm font-medium rounded-sm border transition-colors cursor-pointer ${
            activeTab === 'assigned'
              ? 'bg-dark-deep text-white border-dark-deep'
              : 'bg-white text-text-main border-border-light hover:border-text-main'
          }`}
        >
          Назначенные
        </button>
      </div>

      {/* Desktop table header */}
      <div className="hidden lg:flex items-center px-5 py-3 text-xs font-medium text-text-sub uppercase tracking-wider border-b border-border-light">
        <div className="w-[200px] flex-shrink-0">Имя</div>
        <div className="flex-1 px-4">Почта</div>
        <div className="flex-1 px-4">Локация</div>
        <div className="w-[100px] px-4">Статус</div>
        <div className="w-[150px] px-4">Последняя заявка</div>
        <div className="w-[120px] flex-shrink-0" />
      </div>

      {/* Repairer rows */}
      <div className="flex flex-col border border-border-light rounded-sm overflow-hidden">
        {MOCK_REPAIRERS.map((rep) => (
          <RepairerRow key={rep.id} repairer={rep} />
        ))}
      </div>
    </div>
  );
}
