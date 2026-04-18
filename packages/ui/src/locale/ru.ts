import type { UiLocale } from './types';

export const ru: UiLocale = {
    // DataGrid / DataCardView
    detail: 'Подробнее',
    navigate: 'Перейти',
    sortAsc: 'По возрастанию',
    sortDesc: 'По убыванию',
    hideColumn: 'Убрать столбец',
    resetSettings: 'Сброс настроек',
    hiddenColumns: 'Скрытые столбцы',

    // DataSearch
    searchPlaceholder: 'Поиск...',

    // DataFilter
    filterAll: 'Все',

    // DataGroupedView
    noData: 'Нет данных',

    // CopyButton
    copy: 'Копировать',
    copied: 'Скопировано!',

    // StatusBadge
    statusActive: 'Активен',
    statusInactive: 'Заблокирован',

    // Dialog
    dialogConfirm: 'Продолжить',
    dialogCancel: 'Отмена',

    // CropModal
    cropTitle: 'Обрезка изображения',

    // KeyValueEditor
    keyPlaceholder: 'Ключ',
    valuePlaceholder: 'Значение',

    // PasswordInput
    passwordRuleUppercase: 'минимум одна заглавная буква (A-Z)',
    passwordRuleLowercase: 'минимум одна строчная буква (a-z)',
    passwordRuleDigitOrSpecial: 'минимум одна цифра или спецсимвол',
    showPassword: 'Показать пароль',
    hidePassword: 'Скрыть пароль',

    // SerialNumberInput
    serialEnterAfterPrefix: 'Введите серийный номер после SN-',
    serialTooShort: 'Серийный номер слишком короткий',

    // EmailInput
    emailEnterAt: 'Введите символ @',
    emailEnterUsername: 'Введите имя пользователя перед @',
    emailEnterDomain: 'Введите домен после @',
    emailDomainDot: 'Домен должен содержать точку (например .com)',
    emailTldTooShort: 'Доменная зона слишком короткая',
    emailInvalidFormat: 'Некорректный формат email',

    // PatternInput
    patternInvalidFormat: 'Некорректный формат',

    // AddressInput
    addressLabel: 'Адрес',
    addressRequired: 'Обязательное поле',
    addressOptional: 'Необязательное поле',
    addressClickMap: 'Кликните на карту, чтобы выбрать точку',
    addressGeoNotSupported: 'Геолокация не поддерживается браузером',
    addressGeoSpecifyHouse: 'Уточните номер дома вручную',
    addressGeoFailed: 'Не удалось определить адрес. Заполните поля вручную.',
    addressGeoUnknown: 'Не удалось определить адрес',
    addressPrimary: 'Основной адрес',
    addressMakePrimary: 'Сделать основным',
    addressDetecting: 'Определение...',
    addressAuto: 'Авто',

    // StatCard
    statPeriodLabel: 'за период',

    // Chart
    chartPeriodTitle: 'Период',
    chartAllTime: 'Все время',
    chartPeriodLabel: 'за период',
    chartToggleLine: 'Линейный график',
    chartToggleBar: 'Столбчатый график',
};
