'use client';

import { useState, useRef, useEffect } from 'react';
import { Badge } from '@asko/ui';
import { ChevronDown } from 'lucide-react';
import type { RepairerOption } from './types';
import { REPAIRER_REQUEST_STATUS_LABELS } from './constants';

interface RequestAddress {
  city?: string;
  latitude?: number;
  longitude?: number;
}

interface RepairerSelectorProps {
  repairers: RepairerOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  requestAddress?: RequestAddress;
  currentRepairerId?: string;
  placeholder?: string;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
  if (km < 1) return `~${Math.round(km * 1000)} м`;
  if (km < 10) return `~${km.toFixed(1)} км`;
  return `~${Math.round(km)} км`;
}

function getRepairerName(r: RepairerOption): string {
  return [r.user?.lastName, r.user?.firstName].filter(Boolean).join(' ') || 'Без имени';
}

export function RepairerSelector({
  repairers,
  selectedId,
  onSelect,
  requestAddress,
  currentRepairerId,
  placeholder = 'Выбрать доступного мастера',
}: RepairerSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [focusIndex, setFocusIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = repairers.find((r) => r.id === selectedId);

  // Click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting state when dropdown opens is intentional
      setFocusIndex(-1);
      setSearch('');
    }
  }, [open]);

  const filtered = repairers.filter((r) => {
    if (!search) return true;
    const name = getRepairerName(r).toLowerCase();
    const city = (r.city ?? '').toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || city.includes(q);
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusIndex((i) => (i + 1 >= filtered.length ? 0 : i + 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusIndex((i) => (i <= 0 ? filtered.length - 1 : i - 1));
    }
    if (e.key === 'Enter' && focusIndex >= 0 && filtered[focusIndex]) {
      e.preventDefault();
      if (filtered[focusIndex].id !== currentRepairerId) {
        onSelect(filtered[focusIndex].id);
        setOpen(false);
      }
    }
  };

  // Scroll focused item into view
  useEffect(() => {
    if (focusIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-repairer-item]');
      items[focusIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [focusIndex]);

  const hasRequestCoords = requestAddress?.latitude != null && requestAddress?.longitude != null
    && requestAddress.latitude !== 0 && requestAddress.longitude !== 0;

  return (
    <div ref={wrapperRef} className="relative max-w-[500px] w-full">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm text-left border border-border-main bg-surface hover:border-text-sub transition-colors cursor-pointer"
      >
        <span className={selected ? 'text-text-main' : 'text-text-sub'}>
          {selected ? getRepairerName(selected) + (selected.city ? ` (${selected.city})` : '') : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-text-sub transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-surface border border-border-main shadow-lg max-h-80 flex flex-col">
          {/* Search */}
          <div className="p-2 border-b border-border-main">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setFocusIndex(-1); }}
              onKeyDown={handleKeyDown}
              placeholder="Поиск по имени или городу..."
              className="w-full px-2.5 py-1.5 text-sm border border-border-main outline-none focus:border-text-sub"
            />
          </div>

          {/* List */}
          <div ref={listRef} className="overflow-auto flex-1">
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-sm text-text-sub text-center">Ничего не найдено</p>
            )}
            {filtered.map((r, i) => {
              const name = getRepairerName(r);
              const isSelected = r.id === selectedId;
              const isFocused = i === focusIndex;
              const isCurrent = r.id === currentRepairerId;

              // Distance
              let distanceLabel: string | null = null;
              const hasRepairerCoords = r.latitude != null && r.longitude != null
                && r.latitude !== 0 && r.longitude !== 0;
              if (hasRequestCoords && hasRepairerCoords) {
                const km = haversineKm(
                  requestAddress!.latitude!, requestAddress!.longitude!,
                  r.latitude!, r.longitude!,
                );
                distanceLabel = formatDistance(km);
              }

              // City match
              const sameCity = requestAddress?.city && r.city
                && requestAddress.city.toLowerCase() === r.city.toLowerCase();

              // Busy status
              const activeCount = r.activeRequestCount ?? 0;
              const isBusy = activeCount > 0;
              const statusLabel = r.currentRequestStatus
                ? REPAIRER_REQUEST_STATUS_LABELS[r.currentRequestStatus] ?? r.currentRequestStatus
                : '';

              return (
                <div
                  key={r.id}
                  data-repairer-item
                  onMouseDown={() => { if (!isCurrent) { onSelect(r.id); setOpen(false); } }}
                  onMouseEnter={() => setFocusIndex(i)}
                  className={`px-3 py-2.5 transition-colors ${
                    isCurrent ? 'opacity-50 cursor-default' : isSelected ? 'bg-red-50 cursor-pointer' : isFocused ? 'bg-gray-50 cursor-pointer' : 'hover:bg-surface-hover cursor-pointer'
                  }`}
                >
                  {/* Row 1: name + badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-medium ${isCurrent ? 'text-text-sub' : isSelected ? 'text-brand-red' : 'text-text-main'}`}>
                      {name}
                    </span>

                    {isCurrent && (
                      <Badge variant="neutral" className="text-xs px-1.5 py-0">
                        Текущий
                      </Badge>
                    )}

                    {distanceLabel ? (
                      <Badge variant="info" className="text-xs px-1.5 py-0">
                        {distanceLabel}
                      </Badge>
                    ) : sameCity ? (
                      <Badge variant="success" className="text-xs px-1.5 py-0">
                        Тот же город
                      </Badge>
                    ) : r.city ? (
                      <Badge variant="neutral" className="text-xs px-1.5 py-0">
                        {r.city}
                      </Badge>
                    ) : null}

                    {isBusy ? (
                      <Badge variant="warning" className="text-xs px-1.5 py-0">
                        Занят ({activeCount})
                      </Badge>
                    ) : (
                      <Badge variant="success" className="text-xs px-1.5 py-0">
                        Свободен
                      </Badge>
                    )}
                  </div>

                  {/* Row 2: details */}
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-text-sub">
                    {isBusy && statusLabel && (
                      <span>Текущая: {statusLabel}</span>
                    )}
                    {(r.completedRepairs ?? 0) > 0 && (
                      <span>Выполнено: {r.completedRepairs}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
