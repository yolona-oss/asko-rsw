'use client';

import { useState, useEffect, useCallback } from 'react';
import { addressApi } from '@/lib/api/address';
import { Button, Modal, Input, FormField } from '@asko/ui';
import { MapPin, Plus, Pencil, Trash2, Star } from 'lucide-react';
import type { StatusMessage } from './types';
import type { IAddressBook } from '@asko/shared/client';

interface AddressFormData {
  city: string;
  district: string;
  street: string;
  house: string;
  building: string;
  apartment: string;
  entrance: string;
  floor: string;
  intercom: string;
  comment: string;
}

const emptyForm: AddressFormData = {
  city: '',
  district: '',
  street: '',
  house: '',
  building: '',
  apartment: '',
  entrance: '',
  floor: '',
  intercom: '',
  comment: '',
};

function formatAddress(a: IAddressBook): string {
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

export function AddressesSection() {
  const [addresses, setAddresses] = useState<IAddressBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<StatusMessage>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const showMessage = useCallback((msg: StatusMessage) => {
    setMessage(msg);
    if (msg) setTimeout(() => setMessage(null), 4000);
  }, []);

  const load = useCallback(async () => {
    try {
      const { data } = await addressApi.list();
      setAddresses(data);
    } catch {
      showMessage({ type: 'error', text: 'Не удалось загрузить адреса' });
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (addr: IAddressBook) => {
    setEditingId(addr.id);
    setForm({
      city: addr.city ?? '',
      district: addr.district ?? '',
      street: addr.street ?? '',
      house: addr.house ?? '',
      building: addr.building ?? '',
      apartment: addr.apartment ?? '',
      entrance: addr.entrance ?? '',
      floor: addr.floor ?? '',
      intercom: addr.intercom ?? '',
      comment: addr.comment ?? '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    if (!form.city.trim() || !form.street.trim() || !form.house.trim()) {
      showMessage({ type: 'error', text: 'Заполните город, улицу и дом' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        city: form.city.trim(),
        ...(form.district.trim() ? { district: form.district.trim() } : {}),
        street: form.street.trim(),
        house: form.house.trim(),
        ...(form.building.trim() ? { building: form.building.trim() } : {}),
        ...(form.apartment.trim() ? { apartment: form.apartment.trim() } : {}),
        ...(form.entrance.trim() ? { entrance: form.entrance.trim() } : {}),
        ...(form.floor.trim() ? { floor: form.floor.trim() } : {}),
        ...(form.intercom.trim() ? { intercom: form.intercom.trim() } : {}),
        ...(form.comment.trim() ? { comment: form.comment.trim() } : {}),
      };

      if (editingId) {
        const { data } = await addressApi.update(editingId, payload);
        setAddresses(prev => prev.map(a => a.id === editingId ? data : a));
        showMessage({ type: 'success', text: 'Адрес обновлён' });
      } else {
        const { data } = await addressApi.create(payload as any);
        setAddresses(prev => [data, ...prev]);
        showMessage({ type: 'success', text: 'Адрес добавлен' });
      }
      closeModal();
    } catch {
      showMessage({ type: 'error', text: editingId ? 'Не удалось обновить адрес' : 'Не удалось добавить адрес' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await addressApi.remove(id);
      setAddresses(prev => prev.filter(a => a.id !== id));
      showMessage({ type: 'success', text: 'Адрес удалён' });
    } catch {
      showMessage({ type: 'error', text: 'Не удалось удалить адрес' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      await addressApi.setPrimary(id);
      setAddresses(prev => prev.map(a => ({
        ...a,
        isPrimary: a.id === id,
      })));
      showMessage({ type: 'success', text: 'Основной адрес изменён' });
    } catch {
      showMessage({ type: 'error', text: 'Не удалось изменить основной адрес' });
    }
  };

  const updateField = (field: keyof AddressFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm font-medium text-text-main">Адреса</p>
        <div className="flex flex-col gap-3">
          {[1, 2].map(i => (
            <div key={i} className="h-16 bg-skeleton animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-text-main">Адреса</p>
        <Button variant="secondary" size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Добавить
        </Button>
      </div>

      {addresses.length === 0 ? (
        <p className="text-sm text-text-sub">Нет сохранённых адресов</p>
      ) : (
        <div className="flex flex-col gap-2">
          {addresses.map(addr => (
            <div
              key={addr.id}
              className="flex items-center gap-3 p-3 border border-border-light bg-surface"
            >
              <MapPin className="w-5 h-5 text-icon flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-text-main truncate">
                    {formatAddress(addr)}
                  </p>
                  {addr.isPrimary && (
                    <span className="text-xs text-success font-medium flex-shrink-0">
                      Основной
                    </span>
                  )}
                </div>
                {addr.comment && (
                  <p className="text-xs text-text-sub mt-0.5 truncate">{addr.comment}</p>
                )}
                {addr.intercom && (
                  <p className="text-xs text-text-sub mt-0.5">Домофон: {addr.intercom}</p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {!addr.isPrimary && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(addr.id)}
                    className="p-1.5 text-text-sub hover:text-warning transition-colors cursor-pointer"
                    title="Сделать основным"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openEdit(addr)}
                  className="p-1.5 text-text-sub hover:text-text-main transition-colors cursor-pointer"
                  title="Редактировать"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(addr.id)}
                  disabled={deletingId === addr.id}
                  className="p-1.5 text-text-sub hover:text-brand-red transition-colors cursor-pointer disabled:opacity-50"
                  title="Удалить"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {message && (
        <p className={`text-sm ${message.type === 'success' ? 'text-success' : 'text-brand-red'}`}>
          {message.text}
        </p>
      )}

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={closeModal} className="w-full max-w-lg">
        <div className="flex flex-col gap-4 p-4">
          <p className="text-sm font-bold text-text-main">
            {editingId ? 'Редактировать адрес' : 'Новый адрес'}
          </p>
          <FormField label="Город *">
            <Input
              placeholder="Москва"
              value={form.city}
              onChange={updateField('city')}
              autoComplete="off"
            />
          </FormField>
          <FormField label="Район">
            <Input
              placeholder="Центральный"
              value={form.district}
              onChange={updateField('district')}
              autoComplete="off"
            />
          </FormField>
          <FormField label="Улица *">
            <Input
              placeholder="Ленина"
              value={form.street}
              onChange={updateField('street')}
              autoComplete="off"
            />
          </FormField>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <FormField label="Дом *">
              <Input
                placeholder="4"
                value={form.house}
                onChange={updateField('house')}
                autoComplete="off"
              />
            </FormField>
            <FormField label="Корпус">
              <Input
                placeholder="2"
                value={form.building}
                onChange={updateField('building')}
                autoComplete="off"
              />
            </FormField>
            <FormField label="Подъезд">
              <Input
                placeholder="1"
                value={form.entrance}
                onChange={updateField('entrance')}
                autoComplete="off"
              />
            </FormField>
            <FormField label="Этаж">
              <Input
                placeholder="5"
                value={form.floor}
                onChange={updateField('floor')}
                autoComplete="off"
              />
            </FormField>
            <FormField label="Квартира">
              <Input
                placeholder="59"
                value={form.apartment}
                onChange={updateField('apartment')}
                autoComplete="off"
              />
            </FormField>
            <FormField label="Домофон">
              <Input
                placeholder="59"
                value={form.intercom}
                onChange={updateField('intercom')}
                autoComplete="off"
              />
            </FormField>
          </div>
          <FormField label="Комментарий">
            <Input
              placeholder="Доп. информация"
              value={form.comment}
              onChange={updateField('comment')}
              autoComplete="off"
            />
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={closeModal} disabled={saving}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Сохранение...' : editingId ? 'Сохранить' : 'Добавить'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
