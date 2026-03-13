'use client';

import { useState } from 'react';

interface Invitation {
  id: string;
  token: string;
  role: string;
  expiresAt: string;
  used: boolean;
}

const ROLE_OPTIONS = [
  { value: 'user', label: 'Пользователь' },
  { value: 'dealer', label: 'Дилер' },
  { value: 'manager', label: 'Менеджер' },
  { value: 'repairer', label: 'Мастер' },
  { value: 'admin', label: 'Администратор' },
];

const TTL_OPTIONS = [
  { value: '1h', label: '1 час' },
  { value: '24h', label: '24 часа' },
  { value: '7d', label: '7 дней' },
  { value: '30d', label: '30 дней' },
];

const ROLE_LABELS: Record<string, string> = {
  user: 'Пользователь',
  dealer: 'Дилер',
  manager: 'Менеджер',
  repairer: 'Мастер',
  admin: 'Администратор',
};

const MOCK_INVITATIONS: Invitation[] = [
  { id: 'inv-1', token: 'a1b2c3d4e5f6g7h8i9j0', role: 'dealer', expiresAt: '14.03.2026 18:00', used: false },
  { id: 'inv-2', token: 'k1l2m3n4o5p6q7r8s9t0', role: 'manager', expiresAt: '20.03.2026 12:00', used: false },
  { id: 'inv-3', token: 'u1v2w3x4y5z6a7b8c9d0', role: 'user', expiresAt: '11.03.2026 09:00', used: true },
  { id: 'inv-4', token: 'e1f2g3h4i5j6k7l8m9n0', role: 'repairer', expiresAt: '15.04.2026 15:00', used: false },
];

function InvitationRow({ invitation }: { invitation: Invitation }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/invite/${invitation.token}`);
  };

  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-0 px-5 py-4 border-b border-border-light last:border-b-0 bg-white">
      <div className="lg:w-[200px] lg:flex-shrink-0">
        <p className="text-xs text-text-sub lg:hidden">Токен:</p>
        <p className="text-sm font-mono text-text-main">{invitation.token.slice(0, 12)}...</p>
      </div>
      <div className="lg:flex-1 lg:px-4">
        <p className="text-xs text-text-sub lg:hidden">Роль:</p>
        <p className="text-sm text-text-main">{ROLE_LABELS[invitation.role] ?? invitation.role}</p>
      </div>
      <div className="lg:flex-1 lg:px-4">
        <p className="text-xs text-text-sub lg:hidden">Истекает:</p>
        <p className="text-sm text-text-main">{invitation.expiresAt}</p>
      </div>
      <div className="lg:w-[100px] lg:px-4">
        <p className="text-xs text-text-sub lg:hidden">Статус:</p>
        <span className={`text-sm font-medium ${invitation.used ? 'text-text-sub' : 'text-green-600'}`}>
          {invitation.used ? 'Использовано' : 'Активно'}
        </span>
      </div>
      <div className="lg:w-[200px] lg:flex-shrink-0 lg:text-right flex gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="px-4 py-2 text-sm font-medium text-text-main border border-border-light rounded-sm hover:bg-gray-50 transition-colors cursor-pointer"
        >
          Копировать
        </button>
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium text-brand-red border border-brand-red rounded-sm hover:bg-red-50 transition-colors cursor-pointer"
        >
          Удалить
        </button>
      </div>
    </div>
  );
}

export function AdminInvitations() {
  const [role, setRole] = useState('');
  const [ttl, setTtl] = useState('');

  const handleCreate = () => {
    alert(`Приглашение создано: роль=${role}, TTL=${ttl}`);
  };

  return (
    <div className="p-4 lg:p-8 flex flex-col gap-6 lg:gap-8">
      <h1 className="text-[28px] lg:text-[36px] font-medium tracking-[-0.01em] text-text-main">
        Приглашения
      </h1>

      {/* Create form */}
      <div className="bg-white rounded-sm border border-border-light p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text-main">Роль</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="px-4 py-2.5 border border-border-light rounded-sm text-sm text-text-main bg-white focus:outline-none focus:border-text-main transition-colors appearance-none min-w-[180px]"
          >
            <option value="" disabled>Выбрать роль</option>
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text-main">Срок действия</label>
          <select
            value={ttl}
            onChange={(e) => setTtl(e.target.value)}
            className="px-4 py-2.5 border border-border-light rounded-sm text-sm text-text-main bg-white focus:outline-none focus:border-text-main transition-colors appearance-none min-w-[140px]"
          >
            <option value="" disabled>Выбрать</option>
            {TTL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={handleCreate}
          disabled={!role || !ttl}
          className="px-6 py-2.5 text-sm font-medium text-white bg-brand-red rounded-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Создать приглашение
        </button>
      </div>

      {/* Desktop table header */}
      <div className="hidden lg:flex items-center px-5 py-3 text-xs font-medium text-text-sub uppercase tracking-wider border-b border-border-light">
        <div className="w-[200px] flex-shrink-0">Токен</div>
        <div className="flex-1 px-4">Роль</div>
        <div className="flex-1 px-4">Истекает</div>
        <div className="w-[100px] px-4">Статус</div>
        <div className="w-[200px] flex-shrink-0" />
      </div>

      <div className="flex flex-col border border-border-light rounded-sm overflow-hidden">
        {MOCK_INVITATIONS.map((inv) => (
          <InvitationRow key={inv.id} invitation={inv} />
        ))}
      </div>
    </div>
  );
}
