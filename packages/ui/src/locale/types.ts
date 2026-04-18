/**
 * All translatable strings used by @asko/ui components.
 *
 * Components read from this interface via `useUiLocale()`.
 * Consuming apps provide translations through `<UiLocaleProvider>`.
 */
export interface UiLocale {
    // DataGrid / DataCardView context menu
    detail: string;
    navigate: string;
    sortAsc: string;
    sortDesc: string;
    hideColumn: string;
    resetSettings: string;
    hiddenColumns: string;

    // DataSearch
    searchPlaceholder: string;

    // DataFilter
    filterAll: string;

    // DataGroupedView
    noData: string;

    // CopyButton
    copy: string;
    copied: string;

    // StatusBadge
    statusActive: string;
    statusInactive: string;

    // Dialog
    dialogConfirm: string;
    dialogCancel: string;

    // CropModal
    cropTitle: string;

    // KeyValueEditor
    keyPlaceholder: string;
    valuePlaceholder: string;

    // PasswordInput
    passwordRuleUppercase: string;
    passwordRuleLowercase: string;
    passwordRuleDigitOrSpecial: string;
    showPassword: string;
    hidePassword: string;

    // SerialNumberInput
    serialEnterAfterPrefix: string;
    serialTooShort: string;

    // EmailInput
    emailEnterAt: string;
    emailEnterUsername: string;
    emailEnterDomain: string;
    emailDomainDot: string;
    emailTldTooShort: string;
    emailInvalidFormat: string;

    // PatternInput
    patternInvalidFormat: string;

    // AddressInput
    addressLabel: string;
    addressRequired: string;
    addressOptional: string;
    addressClickMap: string;
    addressGeoNotSupported: string;
    addressGeoSpecifyHouse: string;
    addressGeoFailed: string;
    addressGeoUnknown: string;
    addressPrimary: string;
    addressMakePrimary: string;
    addressDetecting: string;
    addressAuto: string;

    // StatCard
    statPeriodLabel: string;

    // Chart
    chartPeriodTitle: string;
    chartAllTime: string;
    chartPeriodLabel: string;
    chartToggleLine: string;
    chartToggleBar: string;
}
