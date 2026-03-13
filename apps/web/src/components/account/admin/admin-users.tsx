'use client';

import { useState } from 'react';

type UserTab = 'all' | 'user' | 'dealer' | 'manager' | 'repairer';

const TABS: { key: UserTab; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'user', label: 'Пользователи' },
  { key: 'dealer', label: 'Дилеры' },
  { key: 'manager', label: 'Менеджеры' },
  { key: 'repairer', label: 'Мастера' },
];

interface UserEntry {
  id: string;
  name: string;
  email: string;
  phone: string;
  roles: string[];
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  user: 'Пользователь',
  dealer: 'Дилер',
  manager: 'Менеджер',
  repairer: 'Мастер',
  admin: 'Администратор',
  super_admin: 'Суперадмин',
};

const MOCK_USERS: UserEntry[] = [
  { id: 'u1', name: 'Иванов Иван Иванович', email: 'ivanov@mail.ru', phone: '+7(999)111-22-33', roles: ['user'], createdAt: '01.01.2026' },
  { id: 'u2', name: 'Петров Петр Петрович', email: 'petrov@mail.ru', phone: '+7(999)222-33-44', roles: ['dealer'], createdAt: '15.01.2026' },
  { id: 'u3', name: 'Сидоров Сидор Сидорович', email: 'sidorov@mail.ru', phone: '+7(999)333-44-55', roles: ['manager'], createdAt: '20.01.2026' },
  { id: 'u4', name: 'Козлов Андрей Викторович', email: 'kozlov@mail.ru', phone: '+7(999)444-55-66', roles: ['repairer'], createdAt: '25.01.2026' },
  { id: 'u5', name: 'Морозова Анна Сергеевна', email: 'morozova@mail.ru', phone: '+7(999)555-66-77', roles: ['user'], createdAt: '01.02.2026' },
  { id: 'u6', name: 'Волков Дмитрий Олегович', email: 'volkov@mail.ru', phone: '+7(999)666-77-88', roles: ['dealer'], createdAt: '05.02.2026' },
  { id: 'u7', name: 'Новиков Алексей Павлович', email: 'novikov@mail.ru', phone: '+7(999)777-88-99', roles: ['manager'], createdAt: '10.02.2026' },
  { id: 'u8', name: 'Соколова Елена Дмитриевна', email: 'sokolova@mail.ru', phone: '+7(999)888-99-00', roles: ['repairer'], createdAt: '15.02.2026' },
];

function UserRow({ user }: { user: UserEntry }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-0 px-5 py-4 border-b border-border-light last:border-b-0 bg-white">
      <div className="flex items-center gap-3 lg:w-[200px] lg:flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-[#E8E8E8] flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-text-sub" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>
        <div>
          <p className="text-xs text-text-sub lg:hidden">Имя:</p>
          <p className="text-sm font-medium text-text-main">{user.name}</p>
        </div>
      </div>
      <div className="lg:flex-1 lg:px-4">
        <p className="text-xs text-text-sub lg:hidden">Email:</p>
        <p className="text-sm text-text-main">{user.email}</p>
      </div>
      <div className="lg:w-[160px] lg:px-4">
        <p className="text-xs text-text-sub lg:hidden">Телефон:</p>
        <p className="text-sm text-text-main">{user.phone}</p>
      </div>
      <div className="lg:w-[140px] lg:px-4">
        <p className="text-xs text-text-sub lg:hidden">Роли:</p>
        <p className="text-sm text-text-main">
          {user.roles.map((r) => ROLE_LABELS[r] ?? r).join(', ')}
        </p>
      </div>
      <div className="lg:w-[110px] lg:px-4">
        <p className="text-xs text-text-sub lg:hidden">Создан:</p>
        <p className="text-sm text-text-main">{user.createdAt}</p>
      </div>
      <div className="lg:w-[100px] lg:flex-shrink-0 lg:text-right">
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

export function AdminUsers() {
  const [activeTab, setActiveTab] = useState<UserTab>('all');

  const filteredUsers = activeTab === 'all'
    ? MOCK_USERS
    : MOCK_USERS.filter((u) => u.roles.includes(activeTab));

  return (
    <div className="p-4 lg:p-8 flex flex-col gap-6 lg:gap-8">
      <h1 className="text-[28px] lg:text-[36px] font-medium tracking-[-0.01em] text-text-main">
        Пользователи
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

      {/* Desktop table header */}
      <div className="hidden lg:flex items-center px-5 py-3 text-xs font-medium text-text-sub uppercase tracking-wider border-b border-border-light">
        <div className="w-[200px] flex-shrink-0">Имя</div>
        <div className="flex-1 px-4">Email</div>
        <div className="w-[160px] px-4">Телефон</div>
        <div className="w-[140px] px-4">Роли</div>
        <div className="w-[110px] px-4">Создан</div>
        <div className="w-[100px] flex-shrink-0" />
      </div>

      <div className="flex flex-col border border-border-light rounded-sm overflow-hidden">
        {filteredUsers.map((user) => (
          <UserRow key={user.id} user={user} />
        ))}
      </div>
    </div>
  );
}
