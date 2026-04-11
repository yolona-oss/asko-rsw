import type { ReactNode } from 'react';
import { Table2, LayoutGrid, List, ListTree } from 'lucide-react';
import { cn } from '../utils/cn';

// ─── View registry ──────────────────────────────────────────────────────────

export interface ViewDefinition {
  /** Unique key for this view (e.g. 'table', 'card', 'list') */
  key: string;
  /** Display label */
  label: string;
  /** Icon rendered inside the button - pass an SVG or any ReactNode */
  icon?: ReactNode;
}

// Built-in view definitions - consumers can use these or create their own
export const VIEW_TABLE: ViewDefinition = {
  key: 'table',
  label: 'Таблица',
  icon: <Table2 className="w-4 h-4" />,
};

export const VIEW_CARD: ViewDefinition = {
  key: 'card',
  label: 'Карточки',
  icon: <LayoutGrid className="w-4 h-4" />,
};

export const VIEW_LIST: ViewDefinition = {
  key: 'list',
  label: 'Список',
  icon: <List className="w-4 h-4" />,
};

export const VIEW_GROUPED: ViewDefinition = {
  key: 'grouped',
  label: 'Группы',
  icon: <ListTree className="w-4 h-4" />,
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
        'inline-flex items-center border border-border-light overflow-hidden self-start',
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
                ? 'bg-dark-deep text-text-on-dark'
                : 'bg-surface text-text-sub hover:bg-surface-hover hover:text-text-main',
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
