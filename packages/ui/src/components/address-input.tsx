'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Navigation, Map as MapIcon, X, Star, BookOpen, PenLine } from 'lucide-react';
import { Input } from './input';
import { Button } from './button';
import { Tooltip } from './tooltip';
import { cn } from '../utils/cn';

function FieldLabel({ text, required }: { text: string; required?: boolean }) {
  return (
    <Tooltip
      content={required ? 'Обязательное поле' : 'Необязательное поле'}
      placement="top"
      delay={300}
    >
      <label className="text-xs text-text-sub mb-1 flex items-center gap-1.5 cursor-default">
        {text}
        <span
          className={cn(
            'inline-block w-1.5 h-1.5 rounded-full flex-shrink-0',
            required ? 'bg-brand-red' : 'bg-text-sub/30',
          )}
        />
      </label>
    </Tooltip>
  );
}

export interface AddressValue {
  /** Set when an existing saved address is selected */
  id?: string;
  city: string;
  district?: string;
  street: string;
  house: string;
  building?: string;
  apartment?: string;
  entrance?: string;
  floor?: string;
  intercom?: string;
  comment?: string;
  latitude?: number;
  longitude?: number;
}

export interface SavedAddress {
  id: string;
  city: string;
  district?: string;
  street: string;
  house: string;
  building?: string;
  apartment?: string;
  entrance?: string;
  floor?: string;
  intercom?: string;
  comment?: string;
  isPrimary: boolean;
}

export interface AddressInputProps {
  value: AddressValue | null;
  onChange: (value: AddressValue | null) => void;
  error?: string;
  showGeolocation?: boolean;
  label?: string;
  className?: string;
  /** Saved addresses to show in address-book mode */
  savedAddresses?: SavedAddress[];
  /** Called when user clicks the star to set an address as primary */
  onSetPrimary?: (id: string) => void;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    pedestrian?: string;
    footway?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
    municipality?: string;
    suburb?: string;
    city_district?: string;
    state?: string;
    county?: string;
    country?: string;
  };
}

interface ParsedParts {
  city?: string;
  street?: string;
  house?: string;
  lat?: number;
  lon?: number;
}

function getCityName(a: NominatimResult['address']): string {
  return a.city || a.town || a.village || a.hamlet || a.municipality || '';
}

function getStreetName(a: NominatimResult['address']): string {
  return a.road || a.pedestrian || a.footway || '';
}

function parseNominatim(r: NominatimResult): ParsedParts {
  const lat = parseFloat(r.lat);
  const lon = parseFloat(r.lon);
  return {
    city: getCityName(r.address) || undefined,
    street: getStreetName(r.address) || undefined,
    house: r.address.house_number || undefined,
    lat: Number.isFinite(lat) ? lat : undefined,
    lon: Number.isFinite(lon) ? lon : undefined,
  };
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
): Promise<ParsedParts | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&accept-language=ru`,
      { signal },
    );
    const data = (await res.json()) as NominatimResult;
    return parseNominatim(data);
  } catch {
    return null;
  }
}

async function forwardSearch(q: string, signal?: AbortSignal): Promise<NominatimResult[]> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}` +
        `&format=json&addressdetails=1&accept-language=ru&countrycodes=ru&limit=8`,
      { signal },
    );
    const data = await res.json();
    return Array.isArray(data) ? (data as NominatimResult[]) : [];
  } catch {
    return [];
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

// ── Address Input ────────────────────────────────────────────────────

function formatSavedAddress(a: SavedAddress): string {
  const parts: string[] = [];
  if (a.city) parts.push(a.city);
  if (a.district) parts.push(a.district);
  if (a.street) parts.push(a.street);
  if (a.house) parts.push(`д. ${a.house}`);
  if (a.building) parts.push(`корп. ${a.building}`);
  if (a.entrance) parts.push(`подъезд ${a.entrance}`);
  if (a.floor) parts.push(`этаж ${a.floor}`);
  if (a.apartment) parts.push(`кв. ${a.apartment}`);
  return parts.join(', ');
}

function savedToValue(a: SavedAddress): AddressValue {
  return {
    id: a.id,
    city: a.city,
    district: a.district,
    street: a.street,
    house: a.house,
    building: a.building,
    apartment: a.apartment,
    entrance: a.entrance,
    floor: a.floor,
    intercom: a.intercom,
    comment: a.comment,
  };
}

export function AddressInput({
  value,
  onChange,
  error,
  showGeolocation = false,
  label = 'Адрес',
  className,
  savedAddresses,
  onSetPrimary,
}: AddressInputProps) {
  const hasSaved = savedAddresses != null && savedAddresses.length > 0;
  const [mode, setMode] = useState<'saved' | 'manual'>(hasSaved ? 'saved' : 'manual');
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null);

  // Sync mode when savedAddresses availability changes
  useEffect(() => {
    if (!hasSaved && mode === 'saved') setMode('manual');
  }, [hasSaved, mode]);
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [street, setStreet] = useState('');
  const [house, setHouse] = useState('');
  const [building, setBuilding] = useState('');
  const [apartment, setApartment] = useState('');
  const [entrance, setEntrance] = useState('');
  const [floor, setFloor] = useState('');
  const [intercom, setIntercom] = useState('');
  const [lat, setLat] = useState<number | undefined>();
  const [lon, setLon] = useState<number | undefined>();

  const [citySuggestions, setCitySuggestions] = useState<NominatimResult[]>([]);
  const [streetSuggestions, setStreetSuggestions] = useState<NominatimResult[]>([]);
  const [cityOpen, setCityOpen] = useState(false);
  const [streetOpen, setStreetOpen] = useState(false);

  const [detecting, setDetecting] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [mapOpen, setMapOpen] = useState(false);

  const cityWrapRef = useRef<HTMLDivElement>(null);
  const streetWrapRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);
  const lastEmittedRef = useRef<string>('');

  // Hydrate from external value on first mount only.
  useEffect(() => {
    if (value && !mountedRef.current) {
      setCity(value.city ?? '');
      setDistrict(value.district ?? '');
      setStreet(value.street ?? '');
      setHouse(value.house ?? '');
      setBuilding(value.building ?? '');
      setApartment(value.apartment ?? '');
      setEntrance(value.entrance ?? '');
      setFloor(value.floor ?? '');
      setIntercom(value.intercom ?? '');
      setLat(value.latitude);
      setLon(value.longitude);
    }
    mountedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Emit a structured AddressValue whenever fields change.
  useEffect(() => {
    const cityTrim = city.trim();
    const streetTrim = street.trim();
    const houseTrim = house.trim();
    if (!cityTrim || !streetTrim || !houseTrim) {
      if (lastEmittedRef.current !== 'null') {
        lastEmittedRef.current = 'null';
        onChange(null);
      }
      return;
    }
    const next: AddressValue = {
      city: cityTrim,
      ...(district.trim() ? { district: district.trim() } : {}),
      street: streetTrim,
      house: houseTrim,
      ...(building.trim() ? { building: building.trim() } : {}),
      ...(apartment.trim() ? { apartment: apartment.trim() } : {}),
      ...(entrance.trim() ? { entrance: entrance.trim() } : {}),
      ...(floor.trim() ? { floor: floor.trim() } : {}),
      ...(intercom.trim() ? { intercom: intercom.trim() } : {}),
      ...(lat != null && lon != null ? { latitude: lat, longitude: lon } : {}),
    };
    const key = JSON.stringify(next);
    if (key === lastEmittedRef.current) return;
    lastEmittedRef.current = key;
    onChange(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, district, street, house, building, apartment, entrance, floor, intercom, lat, lon]);

  // ── Autocomplete: city ──
  const debouncedCity = useDebounce(city, 350);
  useEffect(() => {
    const q = debouncedCity.trim();
    if (q.length < 2) {
      setCitySuggestions([]);
      return;
    }
    const controller = new AbortController();
    forwardSearch(q, controller.signal).then((results) => {
      const cities = results.filter((r) => !!getCityName(r.address));
      const seen = new Set<string>();
      const unique = cities.filter((r) => {
        const name = getCityName(r.address);
        if (seen.has(name)) return false;
        seen.add(name);
        return true;
      });
      setCitySuggestions(unique.slice(0, 6));
    });
    return () => controller.abort();
  }, [debouncedCity]);

  // ── Autocomplete: street (biased by current city) ──
  const debouncedStreet = useDebounce(street, 350);
  useEffect(() => {
    const sq = debouncedStreet.trim();
    if (sq.length < 2) {
      setStreetSuggestions([]);
      return;
    }
    const cq = city.trim();
    const q = cq ? `${sq}, ${cq}` : sq;
    const controller = new AbortController();
    forwardSearch(q, controller.signal).then((results) => {
      const streets = results.filter((r) => !!getStreetName(r.address));
      const seen = new Set<string>();
      const unique = streets.filter((r) => {
        const name = `${getStreetName(r.address)}|${getCityName(r.address)}`;
        if (seen.has(name)) return false;
        seen.add(name);
        return true;
      });
      setStreetSuggestions(unique.slice(0, 6));
    });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedStreet]);

  // ── Forward geocode: refresh coords once city/street/house settle ──
  const geocodeKey = useMemo(
    () =>
      city.trim() && street.trim() && house.trim()
        ? `${city.trim()}|${street.trim()}|${house.trim()}`
        : '',
    [city, street, house],
  );
  const debouncedGeocodeKey = useDebounce(geocodeKey, 800);
  useEffect(() => {
    if (!debouncedGeocodeKey) return;
    const q = `${city.trim()}, ${street.trim()} ${house.trim()}`;
    const controller = new AbortController();
    forwardSearch(q, controller.signal).then((results) => {
      const first = results[0];
      if (!first) return;
      const newLat = parseFloat(first.lat);
      const newLon = parseFloat(first.lon);
      if (Number.isFinite(newLat) && Number.isFinite(newLon)) {
        setLat(newLat);
        setLon(newLon);
      }
    });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedGeocodeKey]);

  // Click outside closes dropdowns
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (cityWrapRef.current && !cityWrapRef.current.contains(e.target as Node)) {
        setCityOpen(false);
      }
      if (streetWrapRef.current && !streetWrapRef.current.contains(e.target as Node)) {
        setStreetOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const applyParts = (parts: ParsedParts, pickedLat?: number, pickedLon?: number) => {
    if (parts.city) setCity(parts.city);
    if (parts.street) setStreet(parts.street);
    if (parts.house) setHouse(parts.house);
    const finalLat = pickedLat ?? parts.lat;
    const finalLon = pickedLon ?? parts.lon;
    if (finalLat != null) setLat(finalLat);
    if (finalLon != null) setLon(finalLon);
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
      const parts = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      if (parts && (parts.city || parts.street)) {
        applyParts(parts, pos.coords.latitude, pos.coords.longitude);
        if (!parts.house) setGeoError('Уточните номер дома вручную');
      } else {
        setLat(pos.coords.latitude);
        setLon(pos.coords.longitude);
        setGeoError('Не удалось определить адрес. Заполните поля вручную.');
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
    const parts = await reverseGeocode(pickedLat, pickedLon);
    if (parts && (parts.city || parts.street)) {
      applyParts(parts, pickedLat, pickedLon);
      if (!parts.house) setGeoError('Уточните номер дома вручную');
    } else {
      setLat(pickedLat);
      setLon(pickedLon);
      setGeoError('Не удалось определить адрес по точке. Заполните поля вручную.');
    }
  };

  const selectCitySuggestion = (r: NominatimResult) => {
    const parts = parseNominatim(r);
    if (parts.city) setCity(parts.city);
    if (parts.lat != null) setLat(parts.lat);
    if (parts.lon != null) setLon(parts.lon);
    setCityOpen(false);
  };

  const selectStreetSuggestion = (r: NominatimResult) => {
    const parts = parseNominatim(r);
    if (parts.city && !city.trim()) setCity(parts.city);
    if (parts.street) setStreet(parts.street);
    if (parts.house && !house.trim()) setHouse(parts.house);
    if (parts.lat != null) setLat(parts.lat);
    if (parts.lon != null) setLon(parts.lon);
    setStreetOpen(false);
  };

  const inputError = !!error;

  const handleSelectSaved = (addr: SavedAddress) => {
    setSelectedSavedId(addr.id);
    onChange(savedToValue(addr));
  };

  const handleSwitchToManual = () => {
    setMode('manual');
    setSelectedSavedId(null);
    // Don't clear value — keep current fields
  };

  const handleSwitchToSaved = () => {
    setMode('saved');
    // If there was a previously selected saved address, keep it
  };

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-text-main">{label}</p>

        {/* Mode switcher — only show when saved addresses available */}
        {hasSaved && (
          <div className="flex items-center border border-border-light">
            <button
              type="button"
              onClick={handleSwitchToSaved}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 text-xs transition-colors cursor-pointer',
                mode === 'saved'
                  ? 'bg-surface-secondary text-text-main font-medium'
                  : 'text-text-sub hover:text-text-main',
              )}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Из книги
            </button>
            <button
              type="button"
              onClick={handleSwitchToManual}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 text-xs transition-colors cursor-pointer',
                mode === 'manual'
                  ? 'bg-surface-secondary text-text-main font-medium'
                  : 'text-text-sub hover:text-text-main',
              )}
            >
              <PenLine className="w-3.5 h-3.5" />
              Вручную
            </button>
          </div>
        )}
      </div>

      {/* Saved addresses mode */}
      {mode === 'saved' && hasSaved && (
        <div className="flex flex-col gap-1.5">
          {savedAddresses!.map((addr) => {
            const isSelected = selectedSavedId === addr.id;
            return (
              <div
                key={addr.id}
                onClick={() => handleSelectSaved(addr)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 border cursor-pointer transition-colors',
                  isSelected
                    ? 'border-primary-500 bg-primary-50/50'
                    : 'border-border-light hover:bg-surface-hover',
                )}
              >
                {/* Radio indicator */}
                <span
                  className={cn(
                    'flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center',
                    isSelected ? 'border-primary-500' : 'border-border',
                  )}
                >
                  {isSelected && <span className="w-2 h-2 rounded-full bg-primary-500" />}
                </span>

                {/* Address text */}
                <span className="flex-1 min-w-0 text-sm text-text-main truncate">
                  {formatSavedAddress(addr)}
                </span>

                {/* Primary star */}
                {onSetPrimary && (
                  <Tooltip
                    content={addr.isPrimary ? 'Основной адрес' : 'Сделать основным'}
                    placement="top"
                    delay={300}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!addr.isPrimary) onSetPrimary(addr.id);
                      }}
                      className={cn(
                        'flex-shrink-0 p-1 transition-colors cursor-pointer',
                        addr.isPrimary
                          ? 'text-warning'
                          : 'text-text-sub/30 hover:text-warning',
                      )}
                    >
                      <Star className={cn('w-4 h-4', addr.isPrimary && 'fill-current')} />
                    </button>
                  </Tooltip>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Manual input mode */}
      {mode === 'manual' && (
        <>
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

      {/* City */}
      <div ref={cityWrapRef} className="relative w-full">
        <FieldLabel text="Город" required />
        <Input
          placeholder="Москва"
          value={city}
          onChange={(e) => {
            setCity(e.target.value);
            setCityOpen(true);
          }}
          onFocus={() => {
            if (citySuggestions.length > 0) setCityOpen(true);
          }}
          error={inputError}
          autoComplete="off"
        />
        {cityOpen && citySuggestions.length > 0 && (
          <div
            className={cn(
              'absolute z-50 mt-1 w-full',
              'bg-surface border border-border-light shadow-md',
              'max-h-60 overflow-auto',
            )}
          >
            {citySuggestions.map((r) => {
              const name = getCityName(r.address);
              const region = r.address.state || r.address.county || '';
              return (
                <div
                  key={`${r.lat}-${r.lon}-${name}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectCitySuggestion(r);
                  }}
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-surface-secondary"
                >
                  <span className="text-text-main">{name}</span>
                  {region && <span className="text-text-sub"> — {region}</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* District */}
      <div className="w-full">
        <FieldLabel text="Район" />
        <Input
          placeholder="Центральный"
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          autoComplete="off"
        />
      </div>

      {/* Street */}
      <div ref={streetWrapRef} className="relative w-full">
        <FieldLabel text="Улица" required />
        <Input
          placeholder="Ленина"
          value={street}
          onChange={(e) => {
            setStreet(e.target.value);
            setStreetOpen(true);
          }}
          onFocus={() => {
            if (streetSuggestions.length > 0) setStreetOpen(true);
          }}
          error={inputError}
          autoComplete="off"
        />
        {streetOpen && streetSuggestions.length > 0 && (
          <div
            className={cn(
              'absolute z-50 mt-1 w-full',
              'bg-surface border border-border-light shadow-md',
              'max-h-60 overflow-auto',
            )}
          >
            {streetSuggestions.map((r) => {
              const name = getStreetName(r.address);
              const loc = getCityName(r.address);
              return (
                <div
                  key={`${r.lat}-${r.lon}-${name}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectStreetSuggestion(r);
                  }}
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-surface-secondary"
                >
                  <span className="text-text-main">{name}</span>
                  {loc && <span className="text-text-sub"> — {loc}</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* House / Building / Entrance / Floor / Apartment / Intercom */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div>
          <FieldLabel text="Дом" required />
          <Input
            placeholder="4"
            value={house}
            onChange={(e) => setHouse(e.target.value)}
            error={inputError}
            autoComplete="off"
          />
        </div>
        <div>
          <FieldLabel text="Корпус" />
          <Input
            placeholder="2"
            value={building}
            onChange={(e) => setBuilding(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div>
          <FieldLabel text="Подъезд" />
          <Input
            placeholder="1"
            value={entrance}
            onChange={(e) => setEntrance(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div>
          <FieldLabel text="Этаж" />
          <Input
            placeholder="5"
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div>
          <FieldLabel text="Квартира" />
          <Input
            placeholder="59"
            value={apartment}
            onChange={(e) => setApartment(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div>
          <FieldLabel text="Домофон" />
          <Input
            placeholder="59"
            value={intercom}
            onChange={(e) => setIntercom(e.target.value)}
            autoComplete="off"
          />
        </div>
      </div>

      {lat != null && lon != null && (
        <p className="text-xs text-text-sub">
          Координаты: {lat.toFixed(6)}, {lon.toFixed(6)}
        </p>
      )}

      {geoError && <p className="text-sm text-brand-red">{geoError}</p>}

      {mapOpen && (
        <MapPickerModal
          initialLat={lat}
          initialLon={lon}
          onConfirm={handleMapConfirm}
          onClose={() => setMapOpen(false)}
        />
      )}
        </>
      )}

      {error && <p className="text-sm text-brand-red">{error}</p>}
    </div>
  );
}
