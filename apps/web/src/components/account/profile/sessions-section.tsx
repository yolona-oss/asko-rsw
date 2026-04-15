'use client';

import { useState, useEffect, useCallback } from 'react';
import { authApi } from '@/lib/api/auth';
import { broadcastLogout } from '@/lib/api/client';
import { useLogout } from '@/lib/api/use-auth';
import { Button } from '@asko/ui';
import { Monitor, Smartphone, Globe, Trash2, LogOut } from 'lucide-react';
import type { StatusMessage } from './types';

interface SessionInfo {
  id: string;
  deviceInfo: string;
  ipAddress: string;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

function parseDevice(ua: string): { label: string; isMobile: boolean } {
  if (!ua || ua === 'unknown') return { label: 'Неизвестное устройство', isMobile: false };
  const mobile = /mobile|android|iphone|ipad/i.test(ua);
  const browser =
    ua.match(/Chrome\/[\d.]+/)?.[0] ??
    ua.match(/Firefox\/[\d.]+/)?.[0] ??
    ua.match(/Safari\/[\d.]+/)?.[0] ??
    ua.match(/Edge\/[\d.]+/)?.[0] ??
    'Браузер';
  const os =
    ua.match(/Windows NT [\d.]+/)?.[0]?.replace('Windows NT ', 'Windows ') ??
    ua.match(/Mac OS X [\d_.]+/)?.[0]?.replace(/_/g, '.') ??
    ua.match(/Linux/)?.[0] ??
    ua.match(/Android [\d.]+/)?.[0] ??
    ua.match(/iPhone OS [\d_]+/)?.[0]?.replace(/_/g, '.') ??
    '';
  return { label: `${browser} — ${os}`.trim(), isMobile: mobile };
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

export function SessionsSection() {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [masterLoading, setMasterLoading] = useState(false);
  const [message, setMessage] = useState<StatusMessage>(null);
  const logout = useLogout();

  const load = useCallback(async () => {
    try {
      const { data } = await authApi.listSessions();
      setSessions(data.sessions);
    } catch {
      setMessage({ type: 'error', text: 'Не удалось загрузить сессии' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRevoke = async (id: string) => {
    setRevoking(id);
    setMessage(null);
    try {
      await authApi.revokeSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      setMessage({ type: 'success', text: 'Сессия завершена' });
    } catch {
      setMessage({ type: 'error', text: 'Не удалось завершить сессию' });
    } finally {
      setRevoking(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleMasterLogout = async () => {
    setMasterLoading(true);
    setMessage(null);
    try {
      await authApi.masterLogout();
      broadcastLogout();
      logout.mutate();
    } catch {
      setMessage({ type: 'error', text: 'Не удалось завершить все сессии' });
      setMasterLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm font-medium text-text-main">Активные сессии</p>
        <div className="flex flex-col gap-3">
          {[1, 2].map(i => (
            <div key={i} className="h-16 bg-skeleton animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-medium text-text-main">Активные сессии</p>

      {sessions.length === 0 ? (
        <p className="text-sm text-text-sub">Нет активных сессий</p>
      ) : (
        <div className="flex flex-col gap-2">
          {sessions.map(session => {
            const { label, isMobile } = parseDevice(session.deviceInfo);
            const DeviceIcon = isMobile ? Smartphone : Monitor;

            return (
              <div
                key={session.id}
                className="flex items-center gap-4 p-3 border border-border-light bg-surface"
              >
                <DeviceIcon className="w-5 h-5 text-icon flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-main truncate">{label}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-text-sub">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {session.ipAddress}
                    </span>
                    <span>Вход: {formatDate(session.createdAt)}</span>
                    <span>Истекает: {formatDate(session.expiresAt)}</span>
                  </div>
                </div>
                {session.isCurrent ? (
                  <span className="text-xs text-success font-medium flex-shrink-0">Текущая</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRevoke(session.id)}
                    disabled={revoking === session.id}
                    className="p-1.5 text-text-sub hover:text-brand-red transition-colors cursor-pointer disabled:opacity-50 flex-shrink-0"
                    title="Завершить сессию"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Button
          onClick={handleMasterLogout}
          disabled={masterLoading}
          variant="danger"
          size="lg"
        >
          <LogOut className="w-4 h-4" />
          {masterLoading ? 'Завершение...' : 'Выйти отовсюду'}
        </Button>
        {message && (
          <p className={`text-sm ${message.type === 'success' ? 'text-success' : 'text-brand-red'}`}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}
