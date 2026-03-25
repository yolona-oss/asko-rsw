import type { ReactNode } from 'react';
import { cn } from '../utils/cn';

// ─── View registry ──────────────────────────────────────────────────────────

export interface ViewDefinition {
  /** Unique key for this view (e.g. 'table', 'card', 'list') */
  key: string;
  /** Display label */
  label: string;
  /** Icon rendered inside the button — pass an SVG or any ReactNode */
  icon?: ReactNode;
}

// Built-in view definitions — consumers can use these or create their own
export const VIEW_TABLE: ViewDefinition = {
  key: 'table',
  label: 'Таблица',
  icon: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M10.875 12h-7.5m8.625 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125m1.125-1.125c.621 0 1.125.504 1.125 1.125m0 0v1.5c0 .621-.504 1.125-1.125 1.125m0-2.625c0 .621.504 1.125 1.125 1.125" />
    </svg>
  ),
};

export const VIEW_CARD: ViewDefinition = {
  key: 'card',
  label: 'Карточки',
  icon: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  ),
};

export const VIEW_LIST: ViewDefinition = {
  key: 'list',
  label: 'Список',
  icon: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  ),
};

// ─── ViewSwitcher component ─────────────────────────────────────────────────

export interface ViewSwitcherProps {
  /** Available views (order defines button order) */
  views: ViewDefinition[];
  /** Currently active view key */
  activeView: string;
  /** Called when the user selects a different view */
  onViewChange: (viewKey: string) => void;
  className?: string;
}

export function ViewSwitcher({ views, activeView, onViewChange, className }: ViewSwitcherProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center border border-border-light rounded-sm overflow-hidden',
        className,
      )}
    >
      {views.map((view) => {
        const isActive = view.key === activeView;
        return (
          <button
            key={view.key}
            type="button"
            title={view.label}
            onClick={() => onViewChange(view.key)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors cursor-pointer',
              'border-r border-border-light last:border-r-0',
              isActive
                ? 'bg-dark-deep text-white'
                : 'bg-white text-text-sub hover:bg-gray-50 hover:text-text-main',
            )}
          >
            {view.icon}
            <span className="hidden sm:inline">{view.label}</span>
          </button>
        );
      })}
    </div>
  );
}
