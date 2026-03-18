'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppDispatch } from '@/store';
import { setCredentials } from '@/store/auth-slice';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import { DEV_ACCOUNT_SWITCHER } from '@/lib/dev/constants';
import {
  getDevAccounts,
  removeDevAccount,
  type DevAccount,
} from '@/lib/dev/dev-accounts';

export function DevAccountSwitcher() {
  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState<DevAccount[]>([]);
  const [switching, setSwitching] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setAccounts(getDevAccounts());
  }, [open]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  if (!DEV_ACCOUNT_SWITCHER) return null;

  async function handleSwitch(account: DevAccount) {
    setSwitching(account.refreshToken);
    try {
      const { data } = await authApi.devSwitch(account.refreshToken);
      dispatch(setCredentials({ accessToken: data.access_token, user: data.user }));
      queryClient.invalidateQueries();
      setOpen(false);
    } catch (err: any) {
      console.error('Dev switch failed:', err);
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        // Token expired/invalid - remove it
        removeDevAccount(account.refreshToken);
        setAccounts(getDevAccounts());
      }
    } finally {
      setSwitching(null);
    }
  }

  function handleRemove(e: React.MouseEvent, token: string) {
    e.stopPropagation();
    removeDevAccount(token);
    setAccounts(getDevAccounts());
  }

  return (
    <div ref={ref} className="fixed bottom-4 right-4 z-[9999]">
      {open && (
        <div className="absolute bottom-12 right-0 w-72 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Dev: Аккаунты ({accounts.length})
          </div>
          {accounts.length === 0 ? (
            <div className="px-3 py-4 text-sm text-gray-400 text-center">
              Нет сохраненных аккаунтов. Войдите, чтобы аккаунт появился здесь.
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {accounts.map((acc) => (
                <button
                  key={acc.refreshToken}
                  type="button"
                  onClick={() => handleSwitch(acc)}
                  disabled={switching !== null}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-left disabled:opacity-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {acc.label}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {acc.email ?? '-'} · {acc.roles.join(', ')}
                    </div>
                  </div>
                  {switching === acc.refreshToken ? (
                    <span className="text-xs text-gray-400">...</span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => handleRemove(e, acc.refreshToken)}
                      className="shrink-0 p-1 text-gray-300 hover:text-red-500 transition-colors"
                      title="Удалить"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-full bg-amber-500 text-white shadow-lg hover:bg-amber-600 transition-colors flex items-center justify-center"
        title="Dev: Переключить аккаунт"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      </button>
    </div>
  );
}
