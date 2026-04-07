'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
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
    state?: string;
    postcode?: string;
    country?: string;
  };
}

function useDebounce(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function parseNominatimAddress(result: NominatimResult) {
  const a = result.address;
  const city = a.city || a.town || a.village || '';
  const street = a.road || '';
  const houseRaw = parseInt(a.house_number || '', 10);
  const house = Number.isFinite(houseRaw) ? houseRaw : undefined;
  return { city, street, house };
}

async function reverseGeocode(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<{ city: string; street: string; house: string; lat: number; lon: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ru`,
      { signal },
    );
    const data = await res.json();
    const a = data.address ?? {};
    const city = a.city || a.town || a.village || '';
    const street = a.road || '';
    const houseRaw = parseInt(a.house_number || '', 10);
    const house = Number.isFinite(houseRaw) ? String(houseRaw) : '';
    return { city, street, house, lat: latitude, lon: longitude };
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
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [house, setHouse] = useState('');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [room, setRoom] = useState('');
  const [lat, setLat] = useState<number | undefined>();
  const [lon, setLon] = useState<number | undefined>();

  // Coords input mode fields
  const [coordLat, setCoordLat] = useState('');
  const [coordLon, setCoordLon] = useState('');
  const [reversing, setReversing] = useState(false);

  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [showExtras, setShowExtras] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [geoError, setGeoError] = useState('');

  const wrapperRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 400);
  const mountedRef = useRef(false);

  // Hydrate from external value on mount
  useEffect(() => {
    if (value && !mountedRef.current) {
      setCity(value.city);
      setStreet(value.street);
      setHouse(String(value.house));
      setBuilding(value.building ? String(value.building) : '');
      setFloor(value.floor ? String(value.floor) : '');
      setRoom(value.room ? String(value.room) : '');
      if (value.latitude != null) setLat(value.latitude);
      if (value.longitude != null) setLon(value.longitude);
      setQuery(
        [value.city, value.street, value.house ? `д. ${value.house}` : '']
          .filter(Boolean)
          .join(', '),
      );
      if (value.building || value.floor || value.room) {
        setShowExtras(true);
      }
    }
    mountedRef.current = true;
  }, []);

  // Emit structured value when fields change
  const emitChange = useCallback(
    (c: string, s: string, h: string, b: string, f: string, r: string, la?: number, lo?: number) => {
      if (c && s && h) {
        const houseNum = Number(h);
        if (Number.isFinite(houseNum) && houseNum > 0) {
          onChange({
            country: 'Россия',
            city: c,
            street: s,
            house: houseNum,
            ...(b ? { building: Number(b) } : {}),
            ...(f ? { floor: Number(f) } : {}),
            ...(r ? { room: Number(r) } : {}),
            ...(la != null && lo != null ? { latitude: la, longitude: lo } : {}),
          });
          return;
        }
      }
      onChange(null);
    },
    [onChange],
  );

  const updateField = (
    field: 'city' | 'street' | 'house' | 'building' | 'floor' | 'room',
    val: string,
  ) => {
    const next = { city, street, house, building, floor, room, [field]: val };
    if (field === 'city') setCity(val);
    if (field === 'street') setStreet(val);
    if (field === 'house') setHouse(val);
    if (field === 'building') setBuilding(val);
    if (field === 'floor') setFloor(val);
    if (field === 'room') setRoom(val);
    emitChange(
      next.city,
      next.street,
      next.house,
      next.building,
      next.floor,
      next.room,
      lat,
      lon,
    );
  };

  // ── Forward geocode: auto-refresh coords when address fields change manually ──
  const fieldsKey = `${city}|${street}|${house}`;
  const debouncedFieldsKey = useDebounce(fieldsKey, 800);

  useEffect(() => {
    if (!city || !street || !house) return;
    // Skip if coords were just set by suggestion/reverse geocode (they're already fresh)
    const q = `${city}, ${street}, ${house}`;
    const controller = new AbortController();
    fetch(
      `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(q)}&format=json&addressdetails=1` +
        `&accept-language=ru&countrycodes=ru&limit=1`,
      { signal: controller.signal },
    )
      .then((r) => r.json())
      .then((data: NominatimResult[]) => {
        if (data.length > 0) {
          const newLat = parseFloat(data[0].lat) || undefined;
          const newLon = parseFloat(data[0].lon) || undefined;
          if (newLat != null && newLon != null) {
            setLat(newLat);
            setLon(newLon);
            emitChange(city, street, house, building, floor, room, newLat, newLon);
          }
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [debouncedFieldsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Nominatim autocomplete search ──
  useEffect(() => {
    if (inputMode !== 'address') return;
    if (debouncedQuery.length < 3) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    fetch(
      `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(debouncedQuery)}&format=json&addressdetails=1` +
        `&accept-language=ru&countrycodes=ru&limit=5`,
      { signal: controller.signal },
    )
      .then((r) => r.json())
      .then((data) => setSuggestions(data))
      .catch(() => {});
    return () => controller.abort();
  }, [debouncedQuery, inputMode]);

  // Click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectSuggestion = (result: NominatimResult) => {
    const parsed = parseNominatimAddress(result);
    const newCity = parsed.city;
    const newStreet = parsed.street;
    const newHouse = parsed.house !== undefined ? String(parsed.house) : '';
    const newLat = parseFloat(result.lat) || undefined;
    const newLon = parseFloat(result.lon) || undefined;

    setCity(newCity);
    setStreet(newStreet);
    setHouse(newHouse);
    setLat(newLat);
    setLon(newLon);
    setQuery(result.display_name);
    setShowSuggestions(false);
    setActiveIndex(-1);
    emitChange(newCity, newStreet, newHouse, building, floor, room, newLat, newLon);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!suggestions.length || !showSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1 >= suggestions.length ? 0 : i + 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    }
    if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
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
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
        }),
      );
      const result = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      if (result) {
        applyReverseResult(result);
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
      applyReverseResult(result);
    } else {
      setGeoError('Не удалось определить адрес по координатам');
    }
    setReversing(false);
  };

  // Apply reverse geocode result to all fields
  const applyReverseResult = (result: { city: string; street: string; house: string; lat: number; lon: number }) => {
    setCity(result.city);
    setStreet(result.street);
    setHouse(result.house);
    setLat(result.lat);
    setLon(result.lon);
    setCoordLat(String(result.lat));
    setCoordLon(String(result.lon));
    setQuery(
      [result.city, result.street, result.house ? `д. ${result.house}` : '']
        .filter(Boolean)
        .join(', '),
    );
    emitChange(result.city, result.street, result.house, building, floor, room, result.lat, result.lon);
  };

  const hasFields = !!(city || street || house);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Header row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-sm font-bold text-text-main">{label}</p>

        <div className="flex items-center gap-2">
          {/* Mode toggle */}
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

      {/* ── Address mode: autocomplete search ── */}
      {inputMode === 'address' && (
        <div ref={wrapperRef} className="relative w-full">
          <Input
            placeholder="Начните вводить адрес..."
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
          />

          {showSuggestions && suggestions.length > 0 && (
            <div
              className={cn(
                'absolute z-50 mt-1 w-full',
                'bg-surface border border-border-light',
                'shadow-md',
                'max-h-60 overflow-auto',
              )}
            >
              {suggestions.map((s, i) => (
                <div
                  key={s.display_name + i}
                  onMouseDown={() => selectSuggestion(s)}
                  className={cn(
                    'px-3 py-2 text-sm cursor-pointer',
                    'hover:bg-gray-100',
                    i === activeIndex && 'bg-gray-100',
                  )}
                >
                  {s.display_name}
                </div>
              ))}
            </div>
          )}
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

      {/* Parsed editable fields */}
      {hasFields && (
        <div className="flex gap-3">
          <FormField label="Город" className="flex-1">
            <Input
              value={city}
              onChange={(e) => updateField('city', e.target.value)}
              placeholder="Москва"
            />
          </FormField>
          <FormField label="Улица" className="flex-1">
            <Input
              value={street}
              onChange={(e) => updateField('street', e.target.value)}
              placeholder="Ленина"
            />
          </FormField>
          <FormField label="Дом" className="flex-1">
            <Input
              value={house}
              onChange={(e) => updateField('house', e.target.value)}
              type="number"
              placeholder="1"
            />
          </FormField>
        </div>
      )}

      {/* Extras toggle */}
      {hasFields && (
        <button
          type="button"
          onClick={() => setShowExtras(!showExtras)}
          className="text-sm text-text-sub hover:text-text-main transition-colors self-start"
        >
          {showExtras ? 'Скрыть доп. поля' : 'Корпус, этаж, помещение'}
        </button>
      )}

      {/* Optional extra fields */}
      {hasFields && showExtras && (
        <div className="flex gap-3">
          <FormField label="Корпус" className="flex-1">
            <Input
              value={building}
              onChange={(e) => updateField('building', e.target.value)}
              type="number"
              placeholder="-"
            />
          </FormField>
          <FormField label="Этаж" className="flex-1">
            <Input
              value={floor}
              onChange={(e) => updateField('floor', e.target.value)}
              type="number"
              placeholder="-"
            />
          </FormField>
          <FormField label="Помещение" className="flex-1">
            <Input
              value={room}
              onChange={(e) => updateField('room', e.target.value)}
              type="number"
              placeholder="-"
            />
          </FormField>
        </div>
      )}

      {/* Coords display (when available) */}
      {hasFields && lat != null && lon != null && (
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
