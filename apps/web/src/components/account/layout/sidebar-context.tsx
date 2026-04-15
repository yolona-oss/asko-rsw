'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { storage, STORAGE_KEYS } from '@/lib/storage';

export type NotifPanelMode = 'overlay' | 'dock';

interface SidebarState {
  collapsed: boolean;
  mobileOpen: boolean;
  toggleCollapsed: () => void;
  setMobileOpen: (open: boolean) => void;
  notifOpen: boolean;
  notifMode: NotifPanelMode;
  setNotifOpen: (open: boolean) => void;
  setNotifMode: (mode: NotifPanelMode) => void;
}

const SidebarContext = createContext<SidebarState>({
  collapsed: false,
  mobileOpen: false,
  toggleCollapsed: () => {},
  setMobileOpen: () => {},
  notifOpen: false,
  notifMode: 'overlay',
  setNotifOpen: () => {},
  setNotifMode: () => {},
});

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(() => {
    return storage.get(STORAGE_KEYS.sidebarCollapsed) === 'true';
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifMode, setNotifModeRaw] = useState<NotifPanelMode>(() => {
    return (storage.get(STORAGE_KEYS.notifPanelMode) as NotifPanelMode) || 'overlay';
  });

  const toggleCollapsed = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev;
      storage.set(STORAGE_KEYS.sidebarCollapsed, String(next));
      return next;
    });
  }, []);

  const setNotifMode = useCallback((mode: NotifPanelMode) => {
    setNotifModeRaw(mode);
    storage.set(STORAGE_KEYS.notifPanelMode, mode);
  }, []);

  return (
    <SidebarContext.Provider value={{ collapsed, mobileOpen, toggleCollapsed, setMobileOpen, notifOpen, notifMode, setNotifOpen, setNotifMode }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
