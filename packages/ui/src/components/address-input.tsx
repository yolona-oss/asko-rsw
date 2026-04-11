'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type KeyboardEvent,
} from 'react';
import { Input } from './input';
import { Button } from './button';
import { FormField } from './form-field';
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

function parseAddressString(text: string): ParsedAddress | null {
  const parts = text.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length < 3) return null;

  let city: string | undefined;
  let settlement: string | undefined;
  let street: string | undefined;
  let house: string | undefined;
  let building: string | undefined;
  let floor: string | undefined;
  let room: string | undefined;

  for (const part of parts) {
    let m: RegExpMatchArray | null;
    if ((m = part.match(CITY_RX))) { city = m[1].trim(); continue; }
    if ((m = part.match(SETTLEMENT_RX))) { settlement = m[1].trim(); continue; }
    if ((m = part.match(STREET_RX))) { street = m[1].trim(); continue; }
    if ((m = part.match(HOUSE_RX))) { house = m[1].trim(); continue; }
    if ((m = part.match(BUILDING_RX))) { building = m[1].trim(); continue; }
    if ((m = part.match(FLOOR_RX))) { floor = m[1].trim(); continue; }
    if ((m = part.match(ROOM_RX))) { room = m[1].trim(); continue; }
  }

  if (!city || !street || !house) return null;
  return { city, settlement, street, house, building, floor, room };
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

  // Nominatim often returns house numbers with letters, fractions, slashes.
  // Reject anything that doesn't look like our canonical house-number shape.
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

export function AddressInput({
  value,
  onChange,
  error,
  showGeolocation = false,
  label = 'Адрес',
  className,
}: AddressInputProps) {
  const [inputMode, setInputMode] = useState<'address' | 'coords'>('address');

  const [query, setQuery] = useState('');
  const [lat, setLat] = useState<number | undefined>();
  const [lon, setLon] = useState<number | undefined>();

  const [coordLat, setCoordLat] = useState('');
  const [coordLon, setCoordLon] = useState('');
  const [reversing, setReversing] = useState(false);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [detecting, setDetecting] = useState(false);
  const [geoError, setGeoError] = useState('');

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 400);
  const mountedRef = useRef(false);

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
      if (value.latitude != null) {
        setLat(value.latitude);
        setCoordLat(String(value.latitude));
      }
      if (value.longitude != null) {
        setLon(value.longitude);
        setCoordLon(String(value.longitude));
      }
    }
    mountedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Parse `query` on every change and emit a structured AddressValue
  const parsed = useMemo(() => parseAddressString(query), [query]);
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

  // Forward geocode: refresh coords when the city/street/house portion settles
  const debouncedParsedKey = useDebounce(
    parsed ? `${parsed.city}|${parsed.street}|${parsed.house}` : '',
    800,
  );
  useEffect(() => {
    if (!debouncedParsedKey || !parsed) return;
    // Unlabeled query for Nominatim (it doesn't understand "Город X, Улица Y").
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

  // Nominatim autocomplete search → normalize → deduplicate
  useEffect(() => {
    if (inputMode !== 'address') return;
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
  }, [debouncedQuery, inputMode]);

  // Filter suggestions by the current query prefix (case-insensitive)
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

  const ghostSuffix = useMemo(() => {
    if (!topSuggestion) return '';
    if (topSuggestion.length <= query.length) return '';
    if (!topSuggestion.toLowerCase().startsWith(query.toLowerCase())) return '';
    return topSuggestion.slice(query.length);
  }, [topSuggestion, query]);

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
    // Tab — advance query by one unit of the top suggestion
    if (e.key === 'Tab') {
      if (!topSuggestion || topSuggestion.length <= query.length) {
        return; // fall through to browser default
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
        setCoordLat(String(result.lat));
        setCoordLon(String(result.lon));
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

  // ── Manual coords → reverse geocode ──
  const handleReverseGeocode = async () => {
    const parsedLat = parseFloat(coordLat);
    const parsedLon = parseFloat(coordLon);
    if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLon)) {
      setGeoError('Введите корректные координаты');
      return;
    }
    setReversing(true);
    setGeoError('');
    const result = await reverseGeocode(parsedLat, parsedLon);
    if (result) {
      setLat(result.lat);
      setLon(result.lon);
      setQuery(result.suggestion);
    } else {
      setGeoError('Не удалось определить адрес по координатам');
    }
    setReversing(false);
  };

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Header row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-sm font-bold text-text-main">{label}</p>

        <div className="flex items-center gap-2">
          <div className="flex border border-border-main text-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setInputMode('address')}
              className={cn(
                'px-2.5 py-1 transition-colors cursor-pointer',
                inputMode === 'address'
                  ? 'bg-text-main text-text-on-dark'
                  : 'bg-surface text-text-sub hover:bg-surface-hover',
              )}
            >
              По адресу
            </button>
            <button
              type="button"
              onClick={() => setInputMode('coords')}
              className={cn(
                'px-2.5 py-1 transition-colors cursor-pointer',
                inputMode === 'coords'
                  ? 'bg-text-main text-text-on-dark'
                  : 'bg-surface text-text-sub hover:bg-surface-hover',
              )}
            >
              По координатам
            </button>
          </div>

          {showGeolocation && (
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={detectAddress}
              disabled={detecting}
            >
              {detecting ? 'Определение...' : 'GPS'}
            </Button>
          )}
        </div>
      </div>

      {/* ── Address mode: single autocomplete input with ghost text ── */}
      {inputMode === 'address' && (
        <div ref={wrapperRef} className="relative w-full">
          {/* Ghost text overlay — faded suffix of the top suggestion */}
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
            Tab — дополнить слово, Enter — принять предложение
          </p>
        </div>
      )}

      {/* ── Coords mode: lat/lng inputs + reverse geocode ── */}
      {inputMode === 'coords' && (
        <div className="flex items-end gap-2">
          <FormField label="Широта" className="flex-1">
            <Input
              value={coordLat}
              onChange={(e) => setCoordLat(e.target.value)}
              placeholder="55.7558"
              type="number"
              error={!!error}
            />
          </FormField>
          <FormField label="Долгота" className="flex-1">
            <Input
              value={coordLon}
              onChange={(e) => setCoordLon(e.target.value)}
              placeholder="37.6173"
              type="number"
              error={!!error}
            />
          </FormField>
          <Button
            variant="primary"
            size="sm"
            type="button"
            onClick={handleReverseGeocode}
            disabled={reversing || !coordLat || !coordLon}
            className="whitespace-nowrap mb-0.5"
          >
            {reversing ? 'Поиск...' : 'Определить адрес'}
          </Button>
        </div>
      )}

      {/* Coords display (when available) */}
      {parsed && lat != null && lon != null && (
        <p className="text-xs text-text-sub">
          Координаты: {lat.toFixed(6)}, {lon.toFixed(6)}
        </p>
      )}

      {/* Error messages */}
      {error && <p className="text-sm text-brand-red">{error}</p>}
      {geoError && <p className="text-sm text-brand-red">{geoError}</p>}
    </div>
  );
}
