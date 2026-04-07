import { Home, ShieldCheck, CreditCard, User, ClipboardList, Users, Box, Mail, Settings, Wrench, Clock, BookOpen, MessageCircle, Calendar } from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; color?: string }>> = {
  home: Home,
  certificate: ShieldCheck,
  payments: CreditCard,
  profile: User,
  orders: ClipboardList,
  clients: Users,
  devices: Box,
  invite: Mail,
  settings: Settings,
  wrench: Wrench,
  history: Clock,
  manual: BookOpen,
  chat: MessageCircle,
  schedule: Calendar,
};

export function MenuIcon({ icon, active = false }: { icon: string; active?: boolean }) {
  const color = active ? '#EB001C' : '#323232';
  const Icon = ICON_MAP[icon];
  if (!Icon) return <div className="w-5 h-5 rounded-full bg-skeleton" />;
  return <Icon className="w-5 h-5" color={color} />;
}
