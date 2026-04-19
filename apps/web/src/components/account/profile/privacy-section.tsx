'use client';

import { Toggle } from '@asko/ui';
import {
    Eye, EyeOff, Users, Mail, Phone, Activity, Shield, KeyRound, MessageCircle,
} from 'lucide-react';
import {
    FieldVisibility,
    PrivacyFieldGroup,
    type PrivacyRules,
    type FieldVisibilityRule,
} from '@asko/shared/client';

const VISIBILITY_OPTIONS: { value: FieldVisibility; label: string; description: string }[] = [
    { value: FieldVisibility.PUBLIC, label: 'Все', description: 'Любой пользователь' },
    { value: FieldVisibility.AUTHENTICATED, label: 'Авторизованные', description: 'Только зарегистрированные' },
    { value: FieldVisibility.SPECIFIC_ROLES, label: 'По ролям', description: 'Администраторы и менеджеры' },
    { value: FieldVisibility.CONTACTS_ONLY, label: 'Контакты', description: 'Только ваши контакты' },
    { value: FieldVisibility.PRIVATE, label: 'Только я', description: 'Скрыто от всех' },
];

const GROUP_META: { group: PrivacyFieldGroup; label: string; icon: typeof Eye }[] = [
    { group: PrivacyFieldGroup.PROFILE, label: 'Имя и фамилия', icon: Users },
    { group: PrivacyFieldGroup.EMAIL, label: 'Email', icon: Mail },
    { group: PrivacyFieldGroup.PHONE, label: 'Телефон', icon: Phone },
    { group: PrivacyFieldGroup.ACTIVITY, label: 'Активность', icon: Activity },
    { group: PrivacyFieldGroup.ROLES, label: 'Роли', icon: Shield },
    { group: PrivacyFieldGroup.PROVIDERS, label: 'Способы входа', icon: KeyRound },
];

function getGroupVisibility(rules: PrivacyRules | null, group: PrivacyFieldGroup): FieldVisibility {
    return rules?.groups[group]?.visibility ?? FieldVisibility.AUTHENTICATED;
}

function visibilityIcon(v: FieldVisibility) {
    if (v === FieldVisibility.PRIVATE) return <EyeOff className="w-3 h-3" />;
    return <Eye className="w-3 h-3" />;
}

function visibilityColor(v: FieldVisibility): string {
    switch (v) {
        case FieldVisibility.PUBLIC: return 'text-warning-deep bg-warning/10';
        case FieldVisibility.AUTHENTICATED: return 'text-info-deep bg-info/10';
        case FieldVisibility.SPECIFIC_ROLES: return 'text-info-deep bg-info/10';
        case FieldVisibility.CONTACTS_ONLY: return 'text-success-deep bg-success/10';
        case FieldVisibility.PRIVATE: return 'text-text-sub bg-surface-secondary';
        default: return 'text-text-sub bg-surface-secondary';
    }
}

interface PrivacySectionProps {
    privacyRules: PrivacyRules | null;
    setPrivacyRules: (rules: PrivacyRules | null) => void;
    chatAcceptConversations: boolean;
    setChatAcceptConversations: (v: boolean) => void;
    chatSearchable: boolean;
    setChatSearchable: (v: boolean) => void;
}

export function PrivacySection({
    privacyRules,
    setPrivacyRules,
    chatAcceptConversations,
    setChatAcceptConversations,
    chatSearchable,
    setChatSearchable,
}: PrivacySectionProps) {
    const handleGroupChange = (group: PrivacyFieldGroup, visibility: FieldVisibility) => {
        const current = privacyRules ?? { groups: {} };
        const rule: FieldVisibilityRule = { visibility };
        setPrivacyRules({
            ...current,
            groups: { ...current.groups, [group]: rule },
        });
    };

    return (
        <div className="flex flex-col gap-5">
            <div>
                <p className="text-sm font-medium text-text-main">Конфиденциальность</p>
                <p className="text-xs text-text-sub/60 mt-1">Настройте видимость данных и доступность в чате. Администраторы видят всё.</p>
            </div>

            {/* Visibility per field group */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {GROUP_META.map(({ group, label, icon: Icon }) => {
                    const current = getGroupVisibility(privacyRules, group);

                    return (
                        <div key={group} className="flex flex-col gap-2 p-3 bg-surface-secondary border border-border-light">
                            <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4 text-icon" />
                                <span className="text-sm font-medium text-text-main">{label}</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {VISIBILITY_OPTIONS.map((opt) => {
                                    const active = opt.value === current;
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => handleGroupChange(group, opt.value)}
                                            title={opt.description}
                                            className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                                                active
                                                    ? visibilityColor(opt.value)
                                                    : 'text-text-muted bg-transparent hover:bg-surface-muted'
                                            }`}
                                        >
                                            {active && visibilityIcon(opt.value)}
                                            {opt.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Chat accessibility */}
            <div className="flex flex-col gap-3 pt-2">
                <div className="flex items-center gap-2 mb-1">
                    <MessageCircle className="w-3.5 h-3.5 text-icon" />
                    <span className="text-xs font-medium text-text-sub uppercase tracking-wide">Чат</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm text-text-main">Принимать сообщения</p>
                        <p className="text-xs text-text-sub/60 mt-0.5">Другие пользователи могут начинать с вами чат</p>
                    </div>
                    <Toggle checked={chatAcceptConversations} onChange={setChatAcceptConversations} />
                </div>
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm text-text-main">Видимость в поиске</p>
                        <p className="text-xs text-text-sub/60 mt-0.5">Показывать вас при поиске пользователей в чате</p>
                    </div>
                    <Toggle checked={chatSearchable} onChange={setChatSearchable} />
                </div>
            </div>
        </div>
    );
}
