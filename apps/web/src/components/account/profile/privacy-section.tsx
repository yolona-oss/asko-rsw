'use client';

import { Toggle } from '@asko/ui';
import {
    Users, Mail, Phone, Activity, Shield, KeyRound, MessageCircle, Lock,
    Globe, UserCheck, Briefcase, Heart, EyeOff,
} from 'lucide-react';
import {
    FieldVisibility,
    PrivacyFieldGroup,
    type PrivacyRules,
    type FieldVisibilityRule,
} from '@asko/shared/client';

const VISIBILITY_LEVELS: {
    value: FieldVisibility;
    label: string;
    icon: typeof Globe;
    activeClass: string;
}[] = [
    { value: FieldVisibility.PUBLIC, label: 'Все', icon: Globe, activeClass: 'text-warning-deep bg-warning/15 border-warning/30' },
    { value: FieldVisibility.AUTHENTICATED, label: 'Пользователи', icon: UserCheck, activeClass: 'text-info-deep bg-info/15 border-info/30' },
    { value: FieldVisibility.SPECIFIC_ROLES, label: 'Сотрудники', icon: Briefcase, activeClass: 'text-primary-700 bg-primary-50 border-primary-200' },
    { value: FieldVisibility.CONTACTS_ONLY, label: 'Контакты', icon: Heart, activeClass: 'text-success-deep bg-success/15 border-success/30' },
    { value: FieldVisibility.PRIVATE, label: 'Скрыто', icon: EyeOff, activeClass: 'text-text-sub bg-surface-muted border-border' },
];

const FIELD_GROUPS: { group: PrivacyFieldGroup; label: string; icon: typeof Users }[] = [
    { group: PrivacyFieldGroup.PROFILE, label: 'Имя', icon: Users },
    { group: PrivacyFieldGroup.EMAIL, label: 'Email', icon: Mail },
    { group: PrivacyFieldGroup.PHONE, label: 'Телефон', icon: Phone },
    { group: PrivacyFieldGroup.ACTIVITY, label: 'Активность', icon: Activity },
    { group: PrivacyFieldGroup.ROLES, label: 'Роли', icon: Shield },
    { group: PrivacyFieldGroup.PROVIDERS, label: 'Вход', icon: KeyRound },
];

function getVisibility(rules: PrivacyRules | null, group: PrivacyFieldGroup): FieldVisibility {
    return rules?.groups[group]?.visibility ?? FieldVisibility.AUTHENTICATED;
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
                <p className="text-xs text-text-sub/60 mt-1">
                    Участники заявок и сотрудники всегда видят необходимые данные.
                </p>
            </div>

            {/* Visibility controls — stacked on mobile, inline on lg */}
            <div className="flex flex-col gap-2">
                {FIELD_GROUPS.map(({ group, label, icon: Icon }) => {
                    const current = getVisibility(privacyRules, group);
                    return (
                        <div key={group} className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                            <div className="flex items-center gap-2 shrink-0">
                                <Icon className="w-3.5 h-3.5 text-icon" />
                                <span className="text-sm text-text-main">{label}</span>
                            </div>
                            <div className="flex gap-px w-full sm:w-auto">
                                {VISIBILITY_LEVELS.map((opt) => {
                                    const active = opt.value === current;
                                    const LvlIcon = opt.icon;
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => handleChange(group, opt.value)}
                                            className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-2 py-1.5 sm:py-1 text-[11px] font-medium transition-colors cursor-pointer border ${
                                                active
                                                    ? opt.activeClass
                                                    : 'text-text-muted border-transparent hover:text-text-sub hover:bg-surface-hover'
                                            }`}
                                        >
                                            {active && <LvlIcon className="w-3 h-3 hidden sm:block" />}
                                            <span>{opt.label}</span>
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
