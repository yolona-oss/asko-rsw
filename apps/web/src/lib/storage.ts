/**
 * Centralized localStorage access.
 *
 * All reads/writes go through `storage.*` methods which handle:
 * - SSR safety (typeof window)
 * - try/catch on every operation
 * - JSON serialization/deserialization
 *
 * All key names are defined in `STORAGE_KEYS` — no raw strings elsewhere.
 */

const isClient = typeof window !== 'undefined';

function get(key: string): string | null {
  if (!isClient) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function set(key: string, value: string): void {
  if (!isClient) return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage full or unavailable
  }
}

function remove(key: string): void {
  if (!isClient) return;
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function getJSON<T>(key: string): T | null {
  const raw = get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function setJSON(key: string, value: unknown): void {
  set(key, JSON.stringify(value));
}

export const storage = { get, set, remove, getJSON, setJSON } as const;

export const STORAGE_KEYS = {
  theme: 'theme',
  sidebarCollapsed: 'sidebar-collapsed',
  notifPanelMode: 'notif-panel-mode',
  hasAccount: 'has_account',
  sessionId: 'sid',
  logout: 'asko_logout',
  soundMuted: (channel: string) => `asko:sound-muted:${channel}`,
  soundReminder: 'asko:sound-reminder',
  draft: (key: string) => `asko:draft:${key}`,
} as const;
