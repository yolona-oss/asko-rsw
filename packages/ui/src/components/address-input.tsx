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

export function AddressInput({
  value,
  onChange,
  error,
  showGeolocation = false,
  label = 'Адрес',
  className,
}: AddressInputProps) {
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [house, setHouse] = useState('');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [room, setRoom] = useState('');
  const [lat, setLat] = useState<number | undefined>();
  const [lon, setLon] = useState<number | undefined>();

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

  // Nominatim search
  useEffect(() => {
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
  }, [debouncedQuery]);

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
      const { latitude, longitude } = pos.coords;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ru`,
      );
      const data = await res.json();
      const a = data.address ?? {};
      const newCity = a.city || a.town || a.village || '';
      const newStreet = a.road || '';
      const houseRaw = parseInt(a.house_number || '', 10);
      const newHouse = Number.isFinite(houseRaw) ? String(houseRaw) : '';

      setCity(newCity);
      setStreet(newStreet);
      setHouse(newHouse);
      setLat(latitude);
      setLon(longitude);
      setQuery(
        [newCity, newStreet, newHouse ? `д. ${newHouse}` : '']
          .filter(Boolean)
          .join(', '),
      );
      emitChange(newCity, newStreet, newHouse, building, floor, room, latitude, longitude);
    } catch {
      setGeoError('Не удалось определить адрес');
    } finally {
      setDetecting(false);
    }
  };

  const hasFields = !!(city || street || house);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-text-main">{label}</p>
        {showGeolocation && (
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={detectAddress}
            disabled={detecting}
          >
            {detecting ? 'Определение...' : 'Определить автоматически'}
          </Button>
        )}
      </div>

      {/* Main autocomplete input */}
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
              'bg-white border border-border-light',
              'rounded-sm shadow-md',
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

      {/* Error messages */}
      {error && <p className="text-sm text-brand-red">{error}</p>}
      {geoError && <p className="text-sm text-brand-red">{geoError}</p>}
    </div>
  );
}
