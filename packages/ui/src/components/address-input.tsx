'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type KeyboardEvent,
} from 'react';
import { Navigation, Map as MapIcon, X } from 'lucide-react';
import { Input } from './input';
import { Button } from './button';
import { cn } from '../utils/cn';

export interface AddressValue {
  country: string;
  city: string;
  street: string;
  house: number;
  building?: number;
  floor?: number;
  room?: number;
  latitude?: number;
  longitude?: number;
}

export interface AddressInputProps {
  value: AddressValue | null;
  onChange: (value: AddressValue | null) => void;
  error?: string;
  showGeolocation?: boolean;
  label?: string;
  className?: string;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
    suburb?: string;
    city_district?: string;
    neighbourhood?: string;
    quarter?: string;
    state?: string;
    county?: string;
    postcode?: string;
    country?: string;
  };
}

// ── Format utilities ─────────────────────────────────────────────────
//
// Canonical suggestion shape (label-prefixed, comma-separated):
//   `Город {city}[, р-н {settlement}], Улица {street}, дом {house}[, корп {b}][, эт. {f}][, кв. {r}]`
// Required: city, street, house. Settlement/building/floor/room are optional.

const HOUSE_NUMBER_RX = /\d+[а-яА-Яa-zA-Z]?(?:\/\d+[а-яА-Яa-zA-Z]?)?/;

const CITY_RX = /^(?:г\.?|город)\s+(.+)$/i;
const SETTLEMENT_RX = /^(?:р-н|район|пос\.?|посёлок|поселок)\s+(.+)$/i;
const STREET_RX = /^(?:ул\.?|улица)\s+(.+)$/i;
const HOUSE_RX = new RegExp(`^(?:д\\.?|дом)\\s+(${HOUSE_NUMBER_RX.source})$`, 'i');
const BUILDING_RX = /^(?:к\.?|корп\.?|корпус)\s+(.+)$/i;
const FLOOR_RX = /^(?:эт\.?|этаж)\s+(.+)$/i;
const ROOM_RX = /^(?:кв\.?|квартира|пом\.?)\s+(.+)$/i;

function stripCityPrefix(s: string): string {
  return s.replace(/^(?:г\.?|город)\s+/i, '').trim();
}
function stripStreetPrefix(s: string): string {
  return s.replace(/^(?:ул\.?|улица|пр-т|пр\.?|проспект|пер\.?|переулок|б-р|бульвар|ш\.?|шоссе|пл\.?|площадь|наб\.?|набережная)\s+/i, '').trim();
}

// Remove all canonical labels from a raw query so Nominatim can search by bare values.
function stripLabels(s: string): string {
  return s
    .replace(/\b(?:Город|город|г\.|Улица|улица|ул\.|р-н|район|пос\.?|посёлок|поселок|дом|д\.|корпус|корп\.?|к\.|этаж|эт\.|квартира|кв\.|пом\.?)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/^[,\s]+|[,\s]+$/g, '')
    .trim();
}

interface ParsedAddress {
  city: string;
  settlement?: string;
  street: string;
  house: string;
  building?: string;
  floor?: string;
  room?: string;
}

type TokenKey =
  | 'city'
  | 'settlement'
  | 'street'
  | 'house'
  | 'building'
  | 'floor'
  | 'room';

// Canonical labels (with trailing space) in priority order.
// Every label at the start of a segment must exactly match one of these.
const TOKEN_LABELS: Record<TokenKey, string> = {
  city: 'Город ',
  settlement: 'р-н ',
  street: 'Улица ',
  house: 'дом ',
  building: 'корп ',
  floor: 'эт. ',
  room: 'кв. ',
};

const TOKEN_ORDER: TokenKey[] = [
  'city',
  'settlement',
  'street',
  'house',
  'building',
  'floor',
  'room',
];

const LABEL_STRINGS = TOKEN_ORDER.map((k) => TOKEN_LABELS[k]);

function parseAddressPartial(text: string): Partial<ParsedAddress> {
  const parts = text.split(',').map((p) => p.trim()).filter(Boolean);
  const result: Partial<ParsedAddress> = {};

  for (const part of parts) {
    let m: RegExpMatchArray | null;
    if ((m = part.match(CITY_RX))) { result.city = m[1].trim(); continue; }
    if ((m = part.match(SETTLEMENT_RX))) { result.settlement = m[1].trim(); continue; }
    if ((m = part.match(STREET_RX))) { result.street = m[1].trim(); continue; }
    if ((m = part.match(HOUSE_RX))) { result.house = m[1].trim(); continue; }
    if ((m = part.match(BUILDING_RX))) { result.building = m[1].trim(); continue; }
    if ((m = part.match(FLOOR_RX))) { result.floor = m[1].trim(); continue; }
    if ((m = part.match(ROOM_RX))) { result.room = m[1].trim(); continue; }
  }

  return result;
}

function parseAddressString(text: string): ParsedAddress | null {
  const p = parseAddressPartial(text);
  if (!p.city || !p.street || !p.house) return null;
  return p as ParsedAddress;
}

function formatAddressString(p: {
  city: string;
  settlement?: string;
  street: string;
  house: string | number;
  building?: string | number;
  floor?: string | number;
  room?: string | number;
}): string {
  const parts: string[] = [`Город ${p.city}`];
  if (p.settlement) parts.push(`р-н ${p.settlement}`);
  parts.push(`Улица ${p.street}`);
  parts.push(`дом ${p.house}`);
  if (p.building) parts.push(`корп ${p.building}`);
  if (p.floor) parts.push(`эт. ${p.floor}`);
  if (p.room) parts.push(`кв. ${p.room}`);
  return parts.join(', ');
}

function normalizeNominatim(r: NominatimResult): string | null {
  const a = r.address;
  const cityRaw = a.city || a.town || a.village || a.hamlet || '';
  const streetRaw = a.road || '';
  const houseRaw = a.house_number || '';
  if (!cityRaw || !streetRaw || !houseRaw) return null;

  if (!new RegExp(`^${HOUSE_NUMBER_RX.source}$`).test(houseRaw)) return null;

  const city = stripCityPrefix(cityRaw);
  const street = stripStreetPrefix(streetRaw);
  if (!city || !street) return null;

  const settlementCandidate =
    a.suburb || a.city_district || a.neighbourhood || a.quarter || '';
  const settlement =
    settlementCandidate && settlementCandidate !== city ? settlementCandidate : undefined;

  return formatAddressString({ city, settlement, street, house: houseRaw });
}

// ── Label ghost / backspace helpers ──────────────────────────────────

function getCurrentSegment(query: string): { text: string; start: number } {
  const lastSep = query.lastIndexOf(', ');
  if (lastSep === -1) return { text: query, start: 0 };
  return { text: query.slice(lastSep + 2), start: lastSep + 2 };
}

function getMissingTokens(partial: Partial<ParsedAddress>): TokenKey[] {
  return TOKEN_ORDER.filter((t) => partial[t] == null);
}

// Return the remaining characters of the next missing-token canonical label
// when the user's current segment is a case-insensitive prefix of it.
// Empty string means "no label ghost".
function computeLabelGhost(
  query: string,
  partial: Partial<ParsedAddress>,
): string {
  const { text: segment } = getCurrentSegment(query);
  const missing = getMissingTokens(partial);

  // Empty segment → propose the next missing label in canonical order.
  if (segment.length === 0) {
    return missing[0] ? TOKEN_LABELS[missing[0]] : '';
  }

  for (const token of missing) {
    const label = TOKEN_LABELS[token];
    if (segment.length >= label.length) continue;
    if (label.toLowerCase().startsWith(segment.toLowerCase())) {
      return label.slice(segment.length);
    }
  }
  return '';
}

// If the char range ending at `position` exactly matches a canonical label
// and starts at a segment boundary (index 0 or after ", "), return that span
// together with the separator start (so callers can also strip ", ").
function findLabelEndingAt(
  query: string,
  position: number,
): { sepStart: number; labelEnd: number } | null {
  for (const label of LABEL_STRINGS) {
    const labelStart = position - label.length;
    if (labelStart < 0) continue;
    if (query.slice(labelStart, position).toLowerCase() !== label.toLowerCase()) continue;
    if (labelStart === 0) {
      return { sepStart: 0, labelEnd: position };
    }
    if (labelStart >= 2 && query.slice(labelStart - 2, labelStart) === ', ') {
      return { sepStart: labelStart - 2, labelEnd: position };
    }
  }
  return null;
}

// Advance `current` position to the end of the next character-class run in `full`.
// A "unit" is either a maximal run of word chars or a maximal run of boundary chars.
function advanceOneUnit(full: string, current: number): number {
  if (current >= full.length) return current;
  const isBoundary = (ch: string) => /[\s,;.]/.test(ch);
  const startClass = isBoundary(full[current]);
  let i = current;
  while (i < full.length && isBoundary(full[i]) === startClass) i++;
  return i;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

async function reverseGeocode(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<{ suggestion: string; lat: number; lon: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&accept-language=ru`,
      { signal },
    );
    const data = (await res.json()) as NominatimResult;
    const normalized = normalizeNominatim(data);
    if (!normalized) return null;
    return { suggestion: normalized, lat: latitude, lon: longitude };
  } catch {
    return null;
  }
}

// ── Map picker modal ─────────────────────────────────────────────────
// Dynamically loads Leaflet from CDN (no dep on the UI package).

interface MapPickerModalProps {
  initialLat?: number;
  initialLon?: number;
  onConfirm: (lat: number, lon: number) => void;
  onClose: () => void;
}

function MapPickerModal({ initialLat, initialLon, onConfirm, onClose }: MapPickerModalProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<{ lat: number; lon: number } | null>(
    initialLat != null && initialLon != null ? { lat: initialLat, lon: initialLon } : null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let disposed = false;

    const ensureLeaflet = (): Promise<any> => {
      const w = window as any;
      if (w.L) return Promise.resolve(w.L);

      if (!document.querySelector('link[data-leaflet]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.setAttribute('data-leaflet', 'true');
        document.head.appendChild(link);
      }

      return new Promise((resolve, reject) => {
        const existing = document.querySelector('script[data-leaflet]') as HTMLScriptElement | null;
        if (existing) {
          existing.addEventListener('load', () => resolve((window as any).L));
          existing.addEventListener('error', reject);
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.setAttribute('data-leaflet', 'true');
        script.onload = () => resolve((window as any).L);
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    ensureLeaflet().then((L) => {
      if (disposed || !mapRef.current) return;
      setLoading(false);

      const center: [number, number] =
        initialLat != null && initialLon != null ? [initialLat, initialLon] : [55.7558, 37.6173];
      const map = L.map(mapRef.current).setView(center, initialLat != null ? 14 : 10);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      let marker: any = null;
      if (initialLat != null && initialLon != null) {
        marker = L.marker([initialLat, initialLon]).addTo(map);
      }

      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        if (marker) marker.setLatLng(e.latlng);
        else marker = L.marker(e.latlng).addTo(map);
        setSelected({ lat, lon: lng });
      });
    });

    return () => {
      disposed = true;
    };
  }, [initialLat, initialLon]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
          <p className="text-sm font-bold text-text-main">Выбрать точку на карте</p>
          <button
            type="button"
            onClick={onClose}
            className="text-text-sub hover:text-text-main cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative flex-1 min-h-[400px]">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-text-sub">
              Загрузка карты...
            </div>
          )}
          <div ref={mapRef} className="w-full h-full min-h-[400px]" />
        </div>

        <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-border-light">
          <p className="text-xs text-text-sub">
            {selected
              ? `Координаты: ${selected.lat.toFixed(6)}, ${selected.lon.toFixed(6)}`
              : 'Кликните на карту, чтобы выбрать точку'}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" type="button" onClick={onClose}>
              Отмена
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="button"
              disabled={!selected}
              onClick={() => selected && onConfirm(selected.lat, selected.lon)}
            >
              Подтвердить
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AddressInput({
  value,
  onChange,
  error,
  showGeolocation = false,
  label = 'Адрес',
  className,
}: AddressInputProps) {
  const [query, setQuery] = useState('');
  const [lat, setLat] = useState<number | undefined>();
  const [lon, setLon] = useState<number | undefined>();

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const [detecting, setDetecting] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [mapOpen, setMapOpen] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 400);
  const mountedRef = useRef(false);
  const pendingCursorRef = useRef<number | null>(null);

  // Hydrate from external value on mount
  useEffect(() => {
    if (value && !mountedRef.current) {
      const q = formatAddressString({
        city: value.city,
        street: value.street,
        house: value.house,
        building: value.building,
        floor: value.floor,
        room: value.room,
      });
      setQuery(q);
      if (value.latitude != null) setLat(value.latitude);
      if (value.longitude != null) setLon(value.longitude);
    }
    mountedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply any pending cursor position after query updates that came from programmatic edits.
  useEffect(() => {
    if (pendingCursorRef.current !== null && inputRef.current) {
      const pos = pendingCursorRef.current;
      pendingCursorRef.current = null;
      inputRef.current.setSelectionRange(pos, pos);
    }
  }, [query]);

  // Parse `query` on every change and emit a structured AddressValue.
  const parsed = useMemo(() => parseAddressString(query), [query]);
  const partial = useMemo(() => parseAddressPartial(query), [query]);

  useEffect(() => {
    if (parsed) {
      const houseNum = Number(parsed.house.replace(/[^\d]/g, ''));
      if (!Number.isFinite(houseNum) || houseNum <= 0) {
        onChange(null);
        return;
      }
      onChange({
        country: 'Россия',
        city: parsed.city,
        street: parsed.street,
        house: houseNum,
        ...(parsed.building ? { building: Number(parsed.building) } : {}),
        ...(parsed.floor ? { floor: Number(parsed.floor) } : {}),
        ...(parsed.room ? { room: Number(parsed.room) } : {}),
        ...(lat != null && lon != null ? { latitude: lat, longitude: lon } : {}),
      });
    } else {
      onChange(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed, lat, lon]);

  // Forward geocode: refresh coords when the city/street/house portion settles.
  const debouncedParsedKey = useDebounce(
    parsed ? `${parsed.city}|${parsed.street}|${parsed.house}` : '',
    800,
  );
  useEffect(() => {
    if (!debouncedParsedKey || !parsed) return;
    const q = `${parsed.city}, ${parsed.street} ${parsed.house}`;
    const controller = new AbortController();
    fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}` +
        `&format=json&addressdetails=1&accept-language=ru&countrycodes=ru&limit=1`,
      { signal: controller.signal },
    )
      .then((r) => r.json())
      .then((data: NominatimResult[]) => {
        if (data[0]) {
          const newLat = parseFloat(data[0].lat);
          const newLon = parseFloat(data[0].lon);
          if (Number.isFinite(newLat) && Number.isFinite(newLon)) {
            setLat(newLat);
            setLon(newLon);
          }
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [debouncedParsedKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Nominatim autocomplete search → normalize → deduplicate.
  useEffect(() => {
    const bareQuery = stripLabels(debouncedQuery);
    if (bareQuery.length < 3) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(bareQuery)}` +
        `&format=json&addressdetails=1&accept-language=ru&countrycodes=ru&limit=10`,
      { signal: controller.signal },
    )
      .then((r) => r.json())
      .then((data: NominatimResult[]) => {
        const normalized = data
          .map(normalizeNominatim)
          .filter((s): s is string => s !== null);
        const seen = new Set<string>();
        const unique = normalized.filter((s) => {
          if (seen.has(s)) return false;
          seen.add(s);
          return true;
        });
        setSuggestions(unique.slice(0, 8));
      })
      .catch(() => {});
    return () => controller.abort();
  }, [debouncedQuery]);

  const prefixMatches = useMemo(() => {
    if (!query) return suggestions;
    const q = query.toLowerCase();
    return suggestions.filter((s) => s.toLowerCase().startsWith(q));
  }, [suggestions, query]);

  const topSuggestion = useMemo(() => {
    if (!showSuggestions) return null;
    if (prefixMatches.length === 0) return null;
    const idx = activeIndex >= 0 && activeIndex < prefixMatches.length ? activeIndex : 0;
    return prefixMatches[idx];
  }, [prefixMatches, activeIndex, showSuggestions]);

  // Label ghost takes priority over Nominatim ghost.
  const labelGhost = useMemo(() => computeLabelGhost(query, partial), [query, partial]);

  const nominatimGhost = useMemo(() => {
    if (!topSuggestion) return '';
    if (topSuggestion.length <= query.length) return '';
    if (!topSuggestion.toLowerCase().startsWith(query.toLowerCase())) return '';
    return topSuggestion.slice(query.length);
  }, [topSuggestion, query]);

  const ghostSuffix = labelGhost || nominatimGhost;

  // Click outside closes dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const acceptFullSuggestion = useCallback((text: string) => {
    setQuery(text);
    setShowSuggestions(false);
    setActiveIndex(-1);
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Smart backspace: deleting into a canonical label removes the whole
    // label token together with its leading ", " separator.
    if (e.key === 'Backspace') {
      const input = inputRef.current;
      if (input && input.selectionStart === input.selectionEnd) {
        const cursorPos = input.selectionStart ?? 0;
        const match = findLabelEndingAt(query, cursorPos);
        if (match) {
          e.preventDefault();
          const newQuery = query.slice(0, match.sepStart) + query.slice(match.labelEnd);
          pendingCursorRef.current = match.sepStart;
          setQuery(newQuery);
          setShowSuggestions(true);
          setActiveIndex(-1);
          return;
        }
      }
    }

    // Tab — label ghost completes the whole label; Nominatim ghost advances one unit.
    if (e.key === 'Tab') {
      if (labelGhost) {
        e.preventDefault();
        setQuery(query + labelGhost);
        return;
      }
      if (!topSuggestion || topSuggestion.length <= query.length) {
        return;
      }
      const nextEnd = advanceOneUnit(topSuggestion, query.length);
      if (nextEnd <= query.length) return;
      e.preventDefault();
      setQuery(query + topSuggestion.slice(query.length, nextEnd));
      return;
    }

    if (!showSuggestions || prefixMatches.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1 >= prefixMatches.length ? 0 : i + 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? prefixMatches.length - 1 : i - 1));
    }
    if (e.key === 'Enter') {
      if (topSuggestion && topSuggestion !== query) {
        e.preventDefault();
        acceptFullSuggestion(topSuggestion);
      }
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // ── Browser geolocation → reverse geocode ──
  const detectAddress = async () => {
    if (!navigator.geolocation) {
      setGeoError('Геолокация не поддерживается браузером');
      return;
    }
    setDetecting(true);
    setGeoError('');
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 }),
      );
      const result = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      if (result) {
        setLat(result.lat);
        setLon(result.lon);
        setQuery(result.suggestion);
      } else {
        setGeoError('Не удалось определить адрес');
      }
    } catch {
      setGeoError('Не удалось определить адрес');
    } finally {
      setDetecting(false);
    }
  };

  const handleMapConfirm = async (pickedLat: number, pickedLon: number) => {
    setMapOpen(false);
    setGeoError('');
    const result = await reverseGeocode(pickedLat, pickedLon);
    if (result) {
      setLat(result.lat);
      setLon(result.lon);
      setQuery(result.suggestion);
    } else {
      setLat(pickedLat);
      setLon(pickedLon);
      setGeoError('Не удалось определить адрес по выбранной точке');
    }
  };

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Label */}
      <p className="text-sm font-bold text-text-main">{label}</p>

      {/* Action buttons — new line after the label */}
      {showGeolocation && (
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={detectAddress}
            disabled={detecting}
            className="inline-flex items-center gap-1.5"
          >
            <Navigation className="w-4 h-4" />
            {detecting ? 'Определение...' : 'Авто'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={() => setMapOpen(true)}
            className="inline-flex items-center gap-1.5"
          >
            <MapIcon className="w-4 h-4" />
            На карте
          </Button>
        </div>
      )}

      {/* Autocomplete input with ghost text */}
      <div ref={wrapperRef} className="relative w-full">
        {ghostSuffix && (
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none px-4 py-2.5 text-sm overflow-hidden whitespace-nowrap"
          >
            <span className="invisible">{query}</span>
            <span className="text-text-main/25">{ghostSuffix}</span>
          </div>
        )}

        <Input
          ref={inputRef}
          placeholder="Город Москва, Улица Ленина, дом 4, корп 2, эт. 5, кв. 59"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
            setActiveIndex(-1);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          error={!!error}
          className={cn(ghostSuffix && 'bg-transparent')}
        />

        {showSuggestions && prefixMatches.length > 0 && (
          <div
            className={cn(
              'absolute z-50 mt-1 w-full',
              'bg-surface border border-border-light',
              'shadow-md',
              'max-h-60 overflow-auto',
            )}
          >
            {prefixMatches.map((s, i) => {
              const matchLen = query.length;
              const isActive = activeIndex >= 0 ? i === activeIndex : i === 0;
              return (
                <div
                  key={s}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    acceptFullSuggestion(s);
                  }}
                  className={cn(
                    'px-3 py-2 text-sm cursor-pointer',
                    'hover:bg-gray-100',
                    isActive && 'bg-gray-100',
                  )}
                >
                  <span className="font-semibold">{s.slice(0, matchLen)}</span>
                  <span>{s.slice(matchLen)}</span>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-xs text-text-sub mt-1">
          Tab — дополнить, Enter — принять предложение, Backspace — удалить токен
        </p>
      </div>

      {/* Coords display (when available) */}
      {parsed && lat != null && lon != null && (
        <p className="text-xs text-text-sub">
          Координаты: {lat.toFixed(6)}, {lon.toFixed(6)}
        </p>
      )}

      {/* Error messages */}
      {error && <p className="text-sm text-brand-red">{error}</p>}
      {geoError && <p className="text-sm text-brand-red">{geoError}</p>}

      {/* Map picker modal */}
      {mapOpen && (
        <MapPickerModal
          initialLat={lat}
          initialLon={lon}
          onConfirm={handleMapConfirm}
          onClose={() => setMapOpen(false)}
        />
      )}
    </div>
  );
}
