import { DEFAULT_TIMEZONE } from './timezone.js';

/**
 * Russia's 11 timezones arranged by longitude bands (west → east).
 * Used as fallback when city name is not in the explicit map.
 */
const RUSSIA_TIMEZONE_BANDS: ReadonlyArray<{ maxLon: number; tz: string }> = [
    { maxLon: 22,  tz: 'Europe/Kaliningrad' },     // UTC+2
    { maxLon: 45,  tz: 'Europe/Moscow' },            // UTC+3
    { maxLon: 52,  tz: 'Europe/Samara' },             // UTC+4
    { maxLon: 60,  tz: 'Asia/Yekaterinburg' },        // UTC+5
    { maxLon: 73,  tz: 'Asia/Omsk' },                 // UTC+6
    { maxLon: 85,  tz: 'Asia/Krasnoyarsk' },           // UTC+7 (also Asia/Novosibirsk)
    { maxLon: 100, tz: 'Asia/Irkutsk' },               // UTC+8
    { maxLon: 115, tz: 'Asia/Yakutsk' },                // UTC+9
    { maxLon: 135, tz: 'Asia/Vladivostok' },            // UTC+10
    { maxLon: 150, tz: 'Asia/Magadan' },                // UTC+11
    { maxLon: 180, tz: 'Asia/Kamchatka' },              // UTC+12
];

/**
 * Explicit city → IANA timezone overrides for major Russian cities.
 * Catches edge cases where longitude bands are imprecise.
 */
const CITY_TIMEZONE_MAP: Readonly<Record<string, string>> = {
    // UTC+2
    'Калининград': 'Europe/Kaliningrad',
    // UTC+3
    'Москва': 'Europe/Moscow',
    'Санкт-Петербург': 'Europe/Moscow',
    'Казань': 'Europe/Moscow',
    'Нижний Новгород': 'Europe/Moscow',
    'Ростов-на-Дону': 'Europe/Moscow',
    'Воронеж': 'Europe/Moscow',
    'Краснодар': 'Europe/Moscow',
    'Сочи': 'Europe/Moscow',
    'Мурманск': 'Europe/Moscow',
    'Архангельск': 'Europe/Moscow',
    'Тула': 'Europe/Moscow',
    'Рязань': 'Europe/Moscow',
    'Ярославль': 'Europe/Moscow',
    'Тверь': 'Europe/Moscow',
    'Волгоград': 'Europe/Moscow',
    // UTC+4
    'Самара': 'Europe/Samara',
    'Ижевск': 'Europe/Samara',
    'Ульяновск': 'Europe/Samara',
    'Саратов': 'Europe/Samara',
    'Астрахань': 'Europe/Samara',
    // UTC+5
    'Екатеринбург': 'Asia/Yekaterinburg',
    'Челябинск': 'Asia/Yekaterinburg',
    'Уфа': 'Asia/Yekaterinburg',
    'Пермь': 'Asia/Yekaterinburg',
    'Тюмень': 'Asia/Yekaterinburg',
    'Оренбург': 'Asia/Yekaterinburg',
    'Курган': 'Asia/Yekaterinburg',
    // UTC+6
    'Омск': 'Asia/Omsk',
    // UTC+7
    'Новосибирск': 'Asia/Novosibirsk',
    'Красноярск': 'Asia/Krasnoyarsk',
    'Барнаул': 'Asia/Barnaul',
    'Томск': 'Asia/Tomsk',
    'Кемерово': 'Asia/Novokuznetsk',
    'Новокузнецк': 'Asia/Novokuznetsk',
    // UTC+8
    'Иркутск': 'Asia/Irkutsk',
    // UTC+9
    'Якутск': 'Asia/Yakutsk',
    'Чита': 'Asia/Yakutsk',
    // UTC+10
    'Владивосток': 'Asia/Vladivostok',
    'Хабаровск': 'Asia/Vladivostok',
    // UTC+11
    'Магадан': 'Asia/Magadan',
    'Южно-Сахалинск': 'Asia/Sakhalin',
    // UTC+12
    'Петропавловск-Камчатский': 'Asia/Kamchatka',
    'Анадырь': 'Asia/Anadyr',
};

/** Resolve timezone from city name. Returns null if city not in map. */
export function resolveTimezoneFromCity(city: string): string | null {
    return CITY_TIMEZONE_MAP[city] ?? null;
}

/** Resolve timezone from longitude using Russian timezone bands. */
export function resolveTimezoneFromCoords(_lat: number, lon: number): string {
    for (const band of RUSSIA_TIMEZONE_BANDS) {
        if (lon <= band.maxLon) return band.tz;
    }
    return 'Asia/Kamchatka';
}

/** Resolve timezone: city name first, then coordinates, then default. */
export function resolveTimezone(city?: string, lon?: number): string {
    if (city) {
        const fromCity = resolveTimezoneFromCity(city);
        if (fromCity) return fromCity;
    }
    if (lon != null && Number.isFinite(lon)) {
        return resolveTimezoneFromCoords(0, lon);
    }
    return DEFAULT_TIMEZONE;
}
