'use client';

import { useState, useEffect } from 'react';
import {
  Button,
  TabList,
  Tab,
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableCell,
  DataTableEmpty,
} from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { adminApi } from '@/lib/api/admin';
import type { IAuthUser } from '@/lib/api/types';

type UserTab = 'all' | 'user' | 'dealer' | 'manager' | 'repairer';

const TABS: { key: UserTab; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'user', label: 'Пользователи' },
  { key: 'dealer', label: 'Дилеры' },
  { key: 'manager', label: 'Менеджеры' },
  { key: 'repairer', label: 'Мастера' },
];

const ROLE_LABELS: Record<string, string> = {
  user: 'Пользователь',
  dealer: 'Дилер',
  manager: 'Менеджер',
  repairer: 'Мастер',
  admin: 'Администратор',
  super_admin: 'Суперадмин',
  operator: 'Оператор',
};

function formatDate(dateStr: Date | string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function UserRow({ user, onDelete }: { user: IAuthUser; onDelete: (id: string) => void }) {
  const name = [user.lastName, user.firstName].filter(Boolean).join(' ') || 'Без имени';

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
          <p className="text-sm font-medium text-text-main">{name}</p>
        </div>
      </DataTableCell>
      <DataTableCell mobileLabel="Email:" className="lg:flex-1 lg:px-4">
        <p className="text-sm text-text-main">{user.email ?? '-'}</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Телефон:" className="lg:w-[160px] lg:px-4">
        <p className="text-sm text-text-main">{user.phone ?? '-'}</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Роли:" className="lg:w-[140px] lg:px-4">
        <p className="text-sm text-text-main">
          {user.roles.map((r) => ROLE_LABELS[r] ?? r).join(', ')}
        </p>
      </DataTableCell>
      <DataTableCell mobileLabel="Создан:" className="lg:w-[110px] lg:px-4">
        <p className="text-sm text-text-main">{formatDate(user.createdAt)}</p>
      </DataTableCell>
      <DataTableCell className="lg:w-[100px] lg:flex-shrink-0 lg:text-right">
        <Button variant="danger" size="sm" onClick={() => onDelete(user.id)}>
          Удалить
        </Button>
      </DataTableCell>
    </DataTableRow>
  );
}

export function AdminUsers() {
  const [activeTab, setActiveTab] = useState<UserTab>('all');
  const [users, setUsers] = useState<IAuthUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const { data } = await adminApi.getUsers({ limit: 200 });
        setUsers(data.data ?? []);
      } catch (e: any) {
        console.error(e)
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch {
      // silently fail
    }
  };

  const filteredUsers = activeTab === 'all'
    ? users
    : users.filter((u) => u.roles.includes(activeTab));

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

      {loading ? (
        <p className="text-sm text-text-sub p-4">Загрузка...</p>
      ) : (
        <>
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
            {filteredUsers.length === 0 ? (
              <DataTableEmpty>Нет пользователей</DataTableEmpty>
            ) : (
              filteredUsers.map((user) => (
                <UserRow key={user.id} user={user} onDelete={handleDelete} />
              ))
            )}
          </DataTable>
        </>
      )}
    </PageContainer>
  );
}
