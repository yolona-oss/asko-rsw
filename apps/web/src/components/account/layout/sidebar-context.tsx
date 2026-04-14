'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

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
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifMode, setNotifModeRaw] = useState<NotifPanelMode>(() => {
    if (typeof window === 'undefined') return 'overlay';
    return (localStorage.getItem('notif-panel-mode') as NotifPanelMode) || 'overlay';
  });

  const toggleCollapsed = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  }, []);

  const setNotifMode = useCallback((mode: NotifPanelMode) => {
    setNotifModeRaw(mode);
    localStorage.setItem('notif-panel-mode', mode);
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
