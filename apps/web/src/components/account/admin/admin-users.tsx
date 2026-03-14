'use client';

import { useState } from 'react';
import {
  Button,
  TabList,
  Tab,
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableCell,
} from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';

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
    <DataTableRow>
      <DataTableCell className="flex items-center gap-3 lg:w-[200px] lg:flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-[#E8E8E8] flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-text-sub" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>
        <div>
          <p className="text-xs text-text-sub lg:hidden">Имя:</p>
          <p className="text-sm font-medium text-text-main">{user.name}</p>
        </div>
      </DataTableCell>
      <DataTableCell mobileLabel="Email:" className="lg:flex-1 lg:px-4">
        <p className="text-sm text-text-main">{user.email}</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Телефон:" className="lg:w-[160px] lg:px-4">
        <p className="text-sm text-text-main">{user.phone}</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Роли:" className="lg:w-[140px] lg:px-4">
        <p className="text-sm text-text-main">
          {user.roles.map((r) => ROLE_LABELS[r] ?? r).join(', ')}
        </p>
      </DataTableCell>
      <DataTableCell mobileLabel="Создан:" className="lg:w-[110px] lg:px-4">
        <p className="text-sm text-text-main">{user.createdAt}</p>
      </DataTableCell>
      <DataTableCell className="lg:w-[100px] lg:flex-shrink-0 lg:text-right">
        <Button variant="danger" size="sm">
          Удалить
        </Button>
      </DataTableCell>
    </DataTableRow>
  );
}

export function AdminUsers() {
  const [activeTab, setActiveTab] = useState<UserTab>('all');

  const filteredUsers = activeTab === 'all'
    ? MOCK_USERS
    : MOCK_USERS.filter((u) => u.roles.includes(activeTab));

  return (
    <PageContainer>
      <PageHeader>Пользователи</PageHeader>

      {/* Tabs */}
      <TabList>
        {TABS.map((tab) => (
          <Tab
            key={tab.key}
            active={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </Tab>
        ))}
      </TabList>

      {/* Desktop table header */}
      <DataTableHeader>
        <div className="w-[200px] flex-shrink-0">Имя</div>
        <div className="flex-1 px-4">Email</div>
        <div className="w-[160px] px-4">Телефон</div>
        <div className="w-[140px] px-4">Роли</div>
        <div className="w-[110px] px-4">Создан</div>
        <div className="w-[100px] flex-shrink-0" />
      </DataTableHeader>

      <DataTable>
        {filteredUsers.map((user) => (
          <UserRow key={user.id} user={user} />
        ))}
      </DataTable>
    </PageContainer>
  );
}
