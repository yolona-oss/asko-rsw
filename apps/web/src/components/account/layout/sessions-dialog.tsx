'use client';

import { useState, useEffect, useCallback } from 'react';
import { authApi } from '@/lib/api/auth';
import { broadcastLogout } from '@/lib/api/client';
import { useLogout } from '@/lib/api/use-auth';
import { Modal, Button } from '@asko/ui';
import { Monitor, Smartphone, Globe, Trash2, LogOut, X } from 'lucide-react';

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
      day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SessionsDialog({ open, onClose }: Props) {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [masterLoading, setMasterLoading] = useState(false);
  const logout = useLogout();

  const load = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      const { data } = await authApi.listSessions();
      setSessions(data.sessions);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [open]);

  useEffect(() => { load(); }, [load]);

  const handleRevoke = async (id: string) => {
    setRevoking(id);
    try {
      await authApi.revokeSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch {
      // silently fail
    } finally {
      setRevoking(null);
    }
  };

  const handleMasterLogout = async () => {
    setMasterLoading(true);
    try {
      await authApi.masterLogout();
      broadcastLogout();
      logout.mutate();
    } catch {
      setMasterLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} className="max-w-lg w-full p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-medium text-text-main">Активные устройства</h2>
        <button type="button" onClick={onClose} className="p-1 text-text-sub hover:text-text-main cursor-pointer">
          <X className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2].map(i => (
            <div key={i} className="h-14 bg-skeleton animate-pulse" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-text-sub py-4">Нет активных сессий</p>
      ) : (
        <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
          {sessions.map(session => {
            const { label, isMobile } = parseDevice(session.deviceInfo);
            const DeviceIcon = isMobile ? Smartphone : Monitor;

            return (
              <div
                key={session.id}
                className="flex items-center gap-3 p-3 border border-border-light bg-surface"
              >
                <DeviceIcon className="w-5 h-5 text-icon flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-main truncate">{label}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-text-sub">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {session.ipAddress}
                    </span>
                    <span>{formatDate(session.createdAt)}</span>
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
                    title="Завершить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border-light">
        <Button variant="secondary" onClick={onClose}>
          Закрыть
        </Button>
        <Button
          variant="danger"
          onClick={handleMasterLogout}
          disabled={masterLoading}
        >
          <LogOut className="w-4 h-4" />
          {masterLoading ? 'Завершение...' : 'Выйти отовсюду'}
        </Button>
      </div>
    </Modal>
  );
}
