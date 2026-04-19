'use client';

import { Toggle } from '@asko/ui';
import {
    Users, Mail, Phone, Activity, Shield, KeyRound, MessageCircle, Lock,
} from 'lucide-react';
import {
    FieldVisibility,
    PrivacyFieldGroup,
    type PrivacyRules,
    type FieldVisibilityRule,
} from '@asko/shared/client';

const VISIBILITY_LEVELS: { value: FieldVisibility; label: string; short: string }[] = [
    { value: FieldVisibility.PUBLIC, label: 'Все пользователи', short: 'Все' },
    { value: FieldVisibility.AUTHENTICATED, label: 'Зарегистрированные пользователи', short: 'Пользователи' },
    { value: FieldVisibility.SPECIFIC_ROLES, label: 'Только сотрудники (администраторы, менеджеры)', short: 'Сотрудники' },
    { value: FieldVisibility.CONTACTS_ONLY, label: 'Только ваши контакты', short: 'Контакты' },
    { value: FieldVisibility.PRIVATE, label: 'Только я', short: 'Скрыто' },
];

const FIELD_GROUPS: { group: PrivacyFieldGroup; label: string; icon: typeof Users }[] = [
    { group: PrivacyFieldGroup.PROFILE, label: 'Имя и фамилия', icon: Users },
    { group: PrivacyFieldGroup.EMAIL, label: 'Email', icon: Mail },
    { group: PrivacyFieldGroup.PHONE, label: 'Телефон', icon: Phone },
    { group: PrivacyFieldGroup.ACTIVITY, label: 'Активность', icon: Activity },
    { group: PrivacyFieldGroup.ROLES, label: 'Роли', icon: Shield },
    { group: PrivacyFieldGroup.PROVIDERS, label: 'Способы входа', icon: KeyRound },
];

function getVisibility(rules: PrivacyRules | null, group: PrivacyFieldGroup): FieldVisibility {
    return rules?.groups[group]?.visibility ?? FieldVisibility.AUTHENTICATED;
}

function segmentStyle(active: boolean, value: FieldVisibility): string {
    if (!active) return 'text-text-muted hover:text-text-sub';
    switch (value) {
        case FieldVisibility.PUBLIC: return 'text-warning-deep bg-warning/15';
        case FieldVisibility.AUTHENTICATED: return 'text-info-deep bg-info/15';
        case FieldVisibility.SPECIFIC_ROLES: return 'text-primary-700 bg-primary-50';
        case FieldVisibility.CONTACTS_ONLY: return 'text-success-deep bg-success/15';
        case FieldVisibility.PRIVATE: return 'text-text-sub bg-surface-muted';
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
    const handleChange = (group: PrivacyFieldGroup, visibility: FieldVisibility) => {
        const current = privacyRules ?? { groups: {} };
        const rule: FieldVisibilityRule = { visibility };
        setPrivacyRules({
            ...current,
            groups: { ...current.groups, [group]: rule },
        });
    };

    return (
        <div className="flex flex-col gap-4">
            <div>
                <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-icon" />
                    <p className="text-sm font-medium text-text-main">Конфиденциальность</p>
                </div>
                <p className="text-xs text-text-sub/60 mt-1">Кто может видеть ваши данные при просмотре профиля и в поиске. Участники ваших заявок на ремонт и сотрудники всегда видят необходимые данные.</p>
            </div>

            {/* Visibility controls */}
            <div className="flex flex-col gap-3">
                {FIELD_GROUPS.map(({ group, label, icon: Icon }) => {
                    const current = getVisibility(privacyRules, group);
                    return (
                        <div key={group} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2.5 min-w-0 shrink-0">
                                <Icon className="w-4 h-4 text-icon shrink-0" />
                                <span className="text-sm text-text-main">{label}</span>
                            </div>
                            <div className="flex gap-0.5 overflow-x-auto scrollbar-hide">
                                {VISIBILITY_LEVELS.map((opt) => {
                                    const active = opt.value === current;
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => handleChange(group, opt.value)}
                                            title={opt.label}
                                            className={`px-2 py-1 text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${segmentStyle(active, opt.value)}`}
                                        >
                                            {opt.short}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Chat */}
            <div className="border-t border-border-divider pt-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
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
