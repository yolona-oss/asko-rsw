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
          <p className="text-sm font-medium text-text-main">{repairer.name}</p>
        </div>
      </DataTableCell>

      {/* Email */}
      <DataTableCell mobileLabel="Почта:" className="lg:flex-1 lg:px-4">
        <p className="text-sm text-text-main">{repairer.email}</p>
      </DataTableCell>

      {/* Location */}
      <DataTableCell mobileLabel="Локация:" className="lg:flex-1 lg:px-4">
        <p className="text-sm text-text-main">{repairer.location}</p>
      </DataTableCell>

      {/* Status */}
      <DataTableCell mobileLabel="Статус:" className="lg:w-[100px] lg:px-4">
        <span
          className={`text-sm font-medium ${
            repairer.status === 'free' ? 'text-green-600' : 'text-yellow-600'
          }`}
        >
          {repairer.status === 'free' ? 'Свободен' : 'Занят'}
        </span>
      </DataTableCell>

      {/* Last request */}
      <DataTableCell mobileLabel="Последняя заявка:" className="lg:w-[150px] lg:px-4">
        <p className="text-sm text-text-main">{repairer.lastRequest}</p>
      </DataTableCell>

      {/* Action */}
      <DataTableCell className="lg:w-[120px] lg:flex-shrink-0 lg:text-right">
        <Button variant="primary" size="sm" className="px-5">
          Назначить
        </Button>
      </DataTableCell>
    </DataTableRow>
  );
}

export function ManagerAccess() {
  const [activeTab, setActiveTab] = useState<AccessTab>('new');

  return (
    <PageContainer>
      <PageHeader>
        Выдача доступов
      </PageHeader>

      {/* Tabs */}
      <TabList>
        <Tab
          active={activeTab === 'new'}
          onClick={() => setActiveTab('new')}
        >
          Новые
        </Tab>
        <Tab
          active={activeTab === 'assigned'}
          onClick={() => setActiveTab('assigned')}
        >
          Назначенные
        </Tab>
      </TabList>

      {/* Desktop table header */}
      <DataTableHeader>
        <div className="w-[200px] flex-shrink-0">Имя</div>
        <div className="flex-1 px-4">Почта</div>
        <div className="flex-1 px-4">Локация</div>
        <div className="w-[100px] px-4">Статус</div>
        <div className="w-[150px] px-4">Последняя заявка</div>
        <div className="w-[120px] flex-shrink-0" />
      </DataTableHeader>

      {/* Repairer rows */}
      <DataTable>
        {MOCK_REPAIRERS.map((rep) => (
          <RepairerRow key={rep.id} repairer={rep} />
        ))}
      </DataTable>
    </PageContainer>
  );
}
