'use client';

import { useState } from 'react';
import { Button, Card, Select, FormField, DataTable, DataTableHeader, DataTableRow, DataTableCell } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';

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
    <DataTableRow>
      <DataTableCell mobileLabel="Токен:" className="lg:w-[200px] lg:flex-shrink-0">
        <p className="text-sm font-mono text-text-main">{invitation.token.slice(0, 12)}...</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Роль:" className="lg:flex-1 lg:px-4">
        <p className="text-sm text-text-main">{ROLE_LABELS[invitation.role] ?? invitation.role}</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Истекает:" className="lg:flex-1 lg:px-4">
        <p className="text-sm text-text-main">{invitation.expiresAt}</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Статус:" className="lg:w-[100px] lg:px-4">
        <span className={`text-sm font-medium ${invitation.used ? 'text-text-sub' : 'text-green-600'}`}>
          {invitation.used ? 'xxxxxxx' : 'Активно'}
        </span>
      </DataTableCell>
      <DataTableCell className="lg:w-[200px] lg:flex-shrink-0 lg:text-right flex gap-2">
        <Button variant="secondary" size="sm" onClick={handleCopy}>
          Копировать
        </Button>
        <Button variant="danger" size="sm">
          Удалить
        </Button>
      </DataTableCell>
    </DataTableRow>
  );
}

export function AdminInvitations() {
  const [role, setRole] = useState('');
  const [ttl, setTtl] = useState('');

  const handleCreate = () => {
    alert(`Приглашение создано: роль=${role}, TTL=${ttl}`);
  };

  return (
    <PageContainer>
      <PageHeader>Приглашения</PageHeader>

      {/* Create form */}
      <Card className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <FormField label="Роль">
          <Select value={role} onChange={(e) => setRole(e.target.value)} className="min-w-[180px]">
            <option value="" disabled>Выбрать роль</option>
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Срок действия">
          <Select value={ttl} onChange={(e) => setTtl(e.target.value)} className="min-w-[140px]">
            <option value="" disabled>Выбрать</option>
            {TTL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </FormField>
        <Button onClick={handleCreate} disabled={!role || !ttl}>
          Создать приглашение
        </Button>
      </Card>

      {/* Desktop table header */}
      <DataTableHeader>
        <div className="w-[200px] flex-shrink-0">Токен</div>
        <div className="flex-1 px-4">Роль</div>
        <div className="flex-1 px-4">Истекает</div>
        <div className="w-[100px] px-4">Статус</div>
        <div className="w-[200px] flex-shrink-0" />
      </DataTableHeader>

      <DataTable>
        {MOCK_INVITATIONS.map((inv) => (
          <InvitationRow key={inv.id} invitation={inv} />
        ))}
      </DataTable>
    </PageContainer>
  );
}
