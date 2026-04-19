'use client';

import { Select } from '@asko/ui';
import {
  FieldVisibility,
  PrivacyFieldGroup,
  type PrivacyRules,
  type FieldVisibilityRule,
} from '@asko/shared/client';

const VISIBILITY_OPTIONS: { value: FieldVisibility; label: string }[] = [
  { value: FieldVisibility.PUBLIC, label: 'Все' },
  { value: FieldVisibility.AUTHENTICATED, label: 'Авторизованные' },
  { value: FieldVisibility.SPECIFIC_ROLES, label: 'Определённые роли' },
  { value: FieldVisibility.CONTACTS_ONLY, label: 'Контакты' },
  { value: FieldVisibility.PRIVATE, label: 'Только я' },
];

const GROUP_META: { group: PrivacyFieldGroup; label: string; description: string }[] = [
  { group: PrivacyFieldGroup.PROFILE, label: 'Имя и фамилия', description: 'ФИО пользователя' },
  { group: PrivacyFieldGroup.EMAIL, label: 'Email', description: 'Адрес электронной почты' },
  { group: PrivacyFieldGroup.PHONE, label: 'Телефон', description: 'Номер телефона' },
  { group: PrivacyFieldGroup.ACTIVITY, label: 'Активность', description: 'Статус аккаунта, даты' },
  { group: PrivacyFieldGroup.ROLES, label: 'Роли', description: 'Роли пользователя' },
  { group: PrivacyFieldGroup.PROVIDERS, label: 'Способы входа', description: 'OAuth провайдеры' },
];

function getGroupVisibility(rules: PrivacyRules | null, group: PrivacyFieldGroup): FieldVisibility {
  return rules?.groups[group]?.visibility ?? FieldVisibility.AUTHENTICATED;
}

interface PrivacySectionProps {
  privacyRules: PrivacyRules | null;
  setPrivacyRules: (rules: PrivacyRules | null) => void;
}

export function PrivacySection({ privacyRules, setPrivacyRules }: PrivacySectionProps) {
  const handleGroupChange = (group: PrivacyFieldGroup, visibility: FieldVisibility) => {
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
        <p className="text-sm font-medium text-text-main">Приватность</p>
        <p className="text-xs text-text-sub/60 mt-0.5">Выберите, кто может видеть ваши данные. Администраторы видят всё.</p>
      </div>

      <div className="flex flex-col gap-3">
        {GROUP_META.map(({ group, label, description }) => (
          <div key={group} className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm text-text-main">{label}</p>
              <p className="text-xs text-text-sub/60 mt-0.5">{description}</p>
            </div>
            <Select
              className="w-[180px] shrink-0"
              value={getGroupVisibility(privacyRules, group)}
              onChange={(e) => handleGroupChange(group, e.target.value as FieldVisibility)}
            >
              {VISIBILITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
}
