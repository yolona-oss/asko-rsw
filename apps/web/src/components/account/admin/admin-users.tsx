'use client';

import { useState, useEffect, useRef } from 'react';
import { Button, Select, DataSearch, DataFilter } from '@asko/ui';
import type { FilterDefinition, FilterValues } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { SkeletonCard } from '@/components/account/skeleton';
import { usersApi } from '@/lib/api/users';
import { invitationApi } from '@/lib/api/invitation';
import { Role } from '@asko/shared/client';
import type { IAuthUser } from '@/lib/api/types';

// ── Constants ──

type UserTab = 'repairer' | 'dealer' | 'user' | 'manager';

const TABS: { key: UserTab; label: string }[] = [
  { key: 'repairer', label: 'Мастера' },
  { key: 'dealer', label: 'Дилеры' },
  { key: 'user', label: 'Клиенты' },
  { key: 'manager', label: 'Менеджеры' },
];

const ROLE_LABELS: Record<string, string> = {
  user: 'Клиент',
  dealer: 'Дилер',
  manager: 'Менеджер',
  repairer: 'Мастер',
  admin: 'Администратор',
  super_admin: 'Суперадмин',
};

const ROLE_OPTIONS = [
  { value: 'user', label: 'Пользователь' },
  { value: 'dealer', label: 'Дилер' },
  { value: 'manager', label: 'Менеджер' },
  { value: 'repairer', label: 'Мастер' },
];

const TTL_OPTIONS: { value: number; label: string }[] = [
  { value: 3600, label: '1 час' },
  { value: 86400, label: '24 часа' },
  { value: 604800, label: '7 дней' },
  { value: 2592000, label: '30 дней' },
];

type StatusFilter = 'all' | 'active' | 'disabled';

// ── Checkbox ──

function Checkbox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      className="w-4 h-4 border border-[#e0e0e0] bg-[#f1f1f1] flex items-center justify-center flex-shrink-0 cursor-pointer"
      onClick={() => onChange(!checked)}
    >
      {checked && (
        <svg className="w-3 h-3 text-[#323232]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  );
}

// ── "Настроить" dropdown ──

function SettingsDropdown({
  user,
  onToggleActive,
  onDelete,
  loading,
}: {
  user: IAuthUser;
  onToggleActive: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const isActive = (user as any).isActive !== false;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="text-[#1855a4] font-medium text-base hover:underline cursor-pointer tracking-[-0.16px]"
        onClick={() => setOpen(!open)}
        disabled={loading}
      >
        Настроить
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-border-light shadow-lg min-w-[180px]">
          <button
            type="button"
            className="w-full text-left px-4 py-2.5 text-sm text-text-main hover:bg-[#f6f6f8] cursor-pointer"
            disabled={loading}
            onClick={() => { onToggleActive(user.id, !isActive); setOpen(false); }}
          >
            {isActive ? 'Заблокировать' : 'Разблокировать'}
          </button>
          <button
            type="button"
            className="w-full text-left px-4 py-2.5 text-sm text-brand-red hover:bg-[#f6f6f8] cursor-pointer"
            disabled={loading}
            onClick={() => { onDelete(user.id); setOpen(false); }}
          >
            Удалить
          </button>
        </div>
      )}
    </div>
  );
}

// ── Invite list popup ──

const INVITE_ROLE_LABELS: Record<string, string> = {
  user: 'Пользователь',
  dealer: 'Дилер',
  manager: 'Менеджер',
  repairer: 'Мастер',
  admin: 'Администратор',
};

function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function isExpired(expiresAt: string | Date): boolean {
  return new Date(expiresAt) < new Date();
}

function InviteListPopup({ onClose }: { onClose: () => void }) {
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    invitationApi.getAll()
      .then(({ data }) => setInvites(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    setDeleteLoading(id);
    try {
      await invitationApi.delete(id);
      setInvites((prev) => prev.filter((inv) => inv.id !== id));
    } catch {} finally {
      setDeleteLoading(null);
    }
  };

  const handleCopy = (invite: any) => {
    const link = `${window.location.origin}/register?invite=${invite.token}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(invite.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white w-full max-w-lg mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#edeff1]">
          <h3 className="text-lg font-medium text-[#323232]">Все приглашения</h3>
          <button type="button" onClick={onClose} className="text-text-sub hover:text-text-main cursor-pointer">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-text-sub p-5">Загрузка...</p>
          ) : invites.length === 0 ? (
            <p className="text-sm text-text-sub p-5">Нет приглашений</p>
          ) : (
            invites.map((inv) => {
              const expired = isExpired(inv.expiresAt);
              const inactive = inv.used || expired;
              return (
                <div
                  key={inv.id}
                  className={`flex items-center gap-3 px-5 py-3 border-b border-[#edeff1] ${inactive ? 'opacity-50' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#323232]">
                        {INVITE_ROLE_LABELS[inv.role] ?? inv.role}
                      </span>
                      {inv.used ? (
                        <span className="text-xs text-[#a0a0a0] bg-[#f1f1f1] px-1.5 py-0.5 rounded">Использовано</span>
                      ) : expired ? (
                        <span className="text-xs text-brand-red bg-red-50 px-1.5 py-0.5 rounded">Истёк</span>
                      ) : (
                        <span className="text-xs text-[#187f43] bg-green-50 px-1.5 py-0.5 rounded">Активно</span>
                      )}
                    </div>
                    <p className="text-xs text-text-sub mt-0.5">
                      Истекает: {formatDateTime(inv.expiresAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!inactive && (
                      <button
                        type="button"
                        className="text-xs text-[#1855a4] font-medium hover:underline cursor-pointer"
                        onClick={() => handleCopy(inv)}
                      >
                        {copiedId === inv.id ? 'Скопировано!' : 'Копировать'}
                      </button>
                    )}
                    <button
                      type="button"
                      className="text-xs text-brand-red font-medium hover:underline cursor-pointer"
                      disabled={deleteLoading === inv.id}
                      onClick={() => handleDelete(inv.id)}
                    >
                      {deleteLoading === inv.id ? '...' : 'Удалить'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ── "Выдать доступ" dropdown ──

function InviteDropdown() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="flex items-center gap-1 bg-[#179242] text-[#f1f1f1] text-sm font-medium px-2 py-1 hover:bg-[#147a38] cursor-pointer whitespace-nowrap"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        Выдать доступ
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Menu */}
      {menuOpen && (
        <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-border-light shadow-lg min-w-[200px]">
          <button
            type="button"
            className="w-full text-left px-4 py-2.5 text-sm text-[#323232] hover:bg-[#f6f6f8] cursor-pointer"
            onClick={() => { setMenuOpen(false); setCreateOpen(true); }}
          >
            Создать приглашение
          </button>
          <button
            type="button"
            className="w-full text-left px-4 py-2.5 text-sm text-[#323232] hover:bg-[#f6f6f8] cursor-pointer"
            onClick={() => { setMenuOpen(false); setListOpen(true); }}
          >
            Все приглашения
          </button>
        </div>
      )}

      {/* Create invitation popup */}
      {createOpen && (
        <InviteCreatePopup onClose={() => setCreateOpen(false)} />
      )}

      {/* List invitations popup */}
      {listOpen && (
        <InviteListPopup onClose={() => setListOpen(false)} />
      )}
    </div>
  );
}

// ── Create invitation popup ──

function InviteCreatePopup({ onClose }: { onClose: () => void }) {
  const [role, setRole] = useState('');
  const [ttl, setTtl] = useState<number | ''>('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [createdLink, setCreatedLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!role) return;
    setCreating(true);
    setError('');
    setCreatedLink('');
    try {
      const { data } = await invitationApi.create({
        role: role as Role,
        ttl: ttl !== '' ? ttl : undefined,
      });
      setCreatedLink((data as any).link);
    } catch {
      setError('Не удалось создать приглашение');
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(createdLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white w-full max-w-md mx-4 p-5 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-[#323232]">Создать приглашение</h3>
          <button type="button" onClick={onClose} className="text-text-sub hover:text-text-main cursor-pointer">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#323232]">Роль</label>
          <Select value={role} onChange={(e) => setRole(e.target.value)} className="text-sm">
            <option value="" disabled>Выбрать роль</option>
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#323232]">Срок действия</label>
          <Select
            value={ttl}
            onChange={(e) => setTtl(e.target.value === '' ? '' : Number(e.target.value))}
            className="text-sm"
          >
            <option value="">7 дней (по умолч.)</option>
            {TTL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </div>

        {createdLink && (
          <div className="flex flex-col gap-2 p-3 bg-green-50 border border-green-200">
            <p className="text-xs font-mono text-[#323232] break-all">{createdLink}</p>
            <button
              type="button"
              className="text-xs text-[#179242] font-medium hover:underline cursor-pointer text-left"
              onClick={handleCopy}
            >
              {copied ? 'Скопировано!' : 'Копировать ссылку'}
            </button>
          </div>
        )}

        {error && <p className="text-xs text-brand-red">{error}</p>}

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Закрыть</Button>
          <Button onClick={handleCreate} disabled={!role || creating}>
            {creating ? 'Создание...' : 'Создать'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ──

export function AdminUsers() {
  const [activeTab, setActiveTab] = useState<UserTab>('repairer');
  const [users, setUsers] = useState<IAuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({ status: 'all' });
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchUsers() {
      try {
        const { data } = await usersApi.getAll({ limit: 200 });
        setUsers(data.data ?? []);
      } catch (e: any) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const handleToggleActive = async (id: string, active: boolean) => {
    setActionLoading(id);
    try {
      if (active) {
        await usersApi.enable(id);
      } else {
        await usersApi.disable(id);
      }
      setUsers((prev) =>
        prev.map((u) => u.id === id ? { ...u, isActive: active } as any : u),
      );
    } catch {
      // silently fail
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoading(id);
    try {
      await usersApi.delete(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
    } catch {
      // silently fail
    } finally {
      setActionLoading(null);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const STATUS_FILTER_DEF: FilterDefinition = {
    key: 'status',
    label: 'Статус',
    type: 'select',
    options: [
      { value: 'all', label: 'Все' },
      { value: 'active', label: 'Активен' },
      { value: 'disabled', label: 'Заблокирован' },
    ],
  };

  // Filter: tab → role, then search, then status
  const statusFilter = filterValues.status as StatusFilter;
  const filteredUsers = users.filter((u) => {
    if (!u.roles.includes(activeTab)) return false;
    if (statusFilter === 'active' && (u as any).isActive === false) return false;
    if (statusFilter === 'disabled' && (u as any).isActive !== false) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = [u.firstName, u.lastName].join(' ').toLowerCase();
      const phone = (u.phone ?? '').toLowerCase();
      const email = (u.email ?? '').toLowerCase();
      if (!name.includes(q) && !phone.includes(q) && !email.includes(q)) return false;
    }
    return true;
  });

  return (
    <PageContainer>
      <PageHeader>Выдача доступов</PageHeader>

      {/* Tabs */}
      <div className="flex gap-0 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`px-6 py-2.5 text-sm font-medium cursor-pointer border shadow-sm transition-colors ${
              activeTab === tab.key
                ? 'bg-[#323232] text-white border-[#323232]'
                : 'bg-white/10 text-[#323232] border-[#cbd5e1]'
            }`}
            onClick={() => { setActiveTab(tab.key); setSelected(new Set()); }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search + Filters + Invite button */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch">
        <DataSearch
          value={search}
          onChange={setSearch}
          placeholder="Поиск"
          className="lg:w-[320px] flex-shrink-0"
        />
        <div className="flex-1 flex items-center gap-3">
          <DataFilter
            filters={[STATUS_FILTER_DEF]}
            values={filterValues}
            onChange={(key, value) => setFilterValues((prev) => ({ ...prev, [key]: value }))}
          />
          <div className="ml-auto flex-shrink-0">
            <InviteDropdown />
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} className="h-14" />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-[#eaeaea] shadow-[0px_10px_60px_0px_rgba(226,236,249,0.5)] overflow-hidden">
          {/* Header */}
          <div className="hidden lg:grid lg:grid-cols-[32px_1fr_160px_90px_150px_100px_90px] bg-[#f6f6f8] border-b border-[#edeff1] px-6 py-2 text-sm text-[#323232] items-center">
            <span />
            <span>Пользователь</span>
            <span>Телефон</span>
            <span>Роль</span>
            <span>Район</span>
            <span>Статус</span>
            <span>Действия</span>
          </div>

          {/* Rows */}
          {filteredUsers.length === 0 ? (
            <div className="px-8 py-10 text-center text-sm text-text-sub">
              Нет пользователей
            </div>
          ) : (
            filteredUsers.map((user) => {
              const name = [user.lastName, user.firstName].filter(Boolean).join(' ') || 'Без имени';
              const isActive = (user as any).isActive !== false;
              const isLoading = actionLoading === user.id;
              const isSelected = selected.has(user.id);

              return (
                <div
                  key={user.id}
                  className={`grid grid-cols-1 lg:grid-cols-[32px_1fr_160px_90px_150px_100px_90px] items-center px-6 py-2.5 border-b border-[#edeff1] gap-2 lg:gap-0 ${
                    !isActive ? 'opacity-50' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <div className="hidden lg:flex items-center">
                    <Checkbox checked={isSelected} onChange={() => toggleSelect(user.id)} />
                  </div>

                  {/* User */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#d9d9d9] flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-[#888]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-[#323232] tracking-[-0.14px]">{name}</p>
                  </div>

                  {/* Phone */}
                  <div>
                    <p className="text-xs text-text-sub lg:hidden">Телефон:</p>
                    <p className="text-sm text-[#323232] tracking-[-0.14px]">{user.phone ?? '—'}</p>
                  </div>

                  {/* Role */}
                  <div>
                    <p className="text-xs text-text-sub lg:hidden">Роль:</p>
                    <p className="text-sm text-[#323232] tracking-[-0.14px]">
                      {user.roles.map((r) => ROLE_LABELS[r] ?? r).join(', ')}
                    </p>
                  </div>

                  {/* Район */}
                  <div>
                    <p className="text-xs text-text-sub lg:hidden">Район:</p>
                    <p className="text-sm text-[#323232] tracking-[-0.14px]">—</p>
                  </div>

                  {/* Status */}
                  <div>
                    <p className="text-xs text-text-sub lg:hidden">Статус:</p>
                    <span className={`inline-block text-sm text-white px-2 py-0.5 rounded-[22px] ${
                      isActive ? 'bg-[#187f43]' : 'bg-[#a0a0a0]'
                    }`}>
                      {isActive ? 'Активен' : 'Заблокирован'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div>
                    <SettingsDropdown
                      user={user}
                      onToggleActive={handleToggleActive}
                      onDelete={handleDelete}
                      loading={isLoading}
                    />
                  </div>
                </div>
              );
            })
          )}

          {/* Footer */}
          {filteredUsers.length > 0 && (
            <div className="px-6 py-2.5">
              <p className="text-sm text-[rgba(50,50,50,0.58)] tracking-[-0.14px]">
                Показаны пользователей {1}-{filteredUsers.length} из {filteredUsers.length}
              </p>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}
