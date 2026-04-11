'use client';

import { useState } from 'react';
import { usersApi } from '@/lib/api/users';
import { Button, FormField, PasswordInput } from '@asko/ui';
import type { StatusMessage } from './types';

export function PasswordSection() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<StatusMessage>(null);

  const handleChangePassword = async () => {
    setPasswordMessage(null);

    if (!newPassword || !oldPassword) {
      setPasswordMessage({ type: 'error', text: 'Заполните все поля' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Пароли не совпадают' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'Минимальная длина пароля — 8 символов' });
      return;
    }

    setChangingPassword(true);
    try {
      await usersApi.changePassword({ oldPassword, newPassword });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage({ type: 'success', text: 'Пароль изменён' });
    } catch {
      setPasswordMessage({ type: 'error', text: 'Не удалось изменить пароль. Проверьте текущий пароль.' });
    } finally {
      setChangingPassword(false);
      setTimeout(() => setPasswordMessage(null), 3000);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-medium text-text-main">Смена пароля</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FormField label="Текущий пароль">
          <PasswordInput
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="Введите текущий пароль"
            showStrength={false}
          />
        </FormField>
        <div />
        <FormField label="Новый пароль">
          <PasswordInput
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Введите новый пароль"
          />
        </FormField>
        <FormField label="Подтверждение пароля">
          <PasswordInput
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Повторите новый пароль"
            showStrength={false}
          />
        </FormField>
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Button onClick={handleChangePassword} disabled={changingPassword} variant="secondary" size="lg">
          {changingPassword ? 'Сохранение...' : 'Изменить пароль'}
        </Button>
        {passwordMessage && (
          <p className={`text-sm ${passwordMessage.type === 'success' ? 'text-success' : 'text-brand-red'}`}>
            {passwordMessage.text}
          </p>
        )}
      </div>
    </div>
  );
}
