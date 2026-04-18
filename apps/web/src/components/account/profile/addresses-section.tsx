'use client';

import { useState, useEffect, useCallback } from 'react';
import { addressApi } from '@/lib/api/address';
import { Button, Modal, AddressInput, type AddressValue } from '@asko/ui';
import { MapPin, Plus, Pencil, Trash2, Star, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import type { StatusMessage } from './types';
import type { IAddressBook } from '@asko/shared/client';

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

function ValidationBadge({ status, error }: { status?: string; error?: string }) {
  switch (status) {
    case 'valid':
      return (
        <span className="inline-flex items-center gap-1 text-xs text-success flex-shrink-0" title="Адрес подтверждён">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Подтверждён</span>
        </span>
      );
    case 'invalid':
      return (
        <span className="inline-flex items-center gap-1 text-xs text-error flex-shrink-0" title={error || 'Адрес не прошёл проверку'}>
          <AlertCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Не подтверждён</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-xs text-warning flex-shrink-0" title="Адрес на проверке">
          <Clock className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">На проверке</span>
        </span>
      );
  }
}

function addressToValue(a: IAddressBook): AddressValue {
  return {
    city: a.city ?? '',
    district: a.district,
    street: a.street ?? '',
    house: a.house ?? '',
    building: a.building,
    apartment: a.apartment,
    entrance: a.entrance,
    floor: a.floor,
    intercom: a.intercom,
    comment: a.comment,
  };
}

export function AddressesSection() {
  const [addresses, setAddresses] = useState<IAddressBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<StatusMessage>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addressValue, setAddressValue] = useState<AddressValue | null>(null);
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
    setAddressValue(null);
    setModalOpen(true);
  };

  const openEdit = (addr: IAddressBook) => {
    setEditingId(addr.id);
    setAddressValue(addressToValue(addr));
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setAddressValue(null);
  };

  const handleSave = async () => {
    if (!addressValue) {
      showMessage({ type: 'error', text: 'Заполните город, улицу и дом' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        city: addressValue.city,
        street: addressValue.street,
        house: addressValue.house,
        ...(addressValue.district ? { district: addressValue.district } : {}),
        ...(addressValue.building ? { building: addressValue.building } : {}),
        ...(addressValue.apartment ? { apartment: addressValue.apartment } : {}),
        ...(addressValue.entrance ? { entrance: addressValue.entrance } : {}),
        ...(addressValue.floor ? { floor: addressValue.floor } : {}),
        ...(addressValue.intercom ? { intercom: addressValue.intercom } : {}),
        ...(addressValue.comment ? { comment: addressValue.comment } : {}),
        ...(addressValue.latitude != null ? { latitude: addressValue.latitude } : {}),
        ...(addressValue.longitude != null ? { longitude: addressValue.longitude } : {}),
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
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm text-text-main truncate">
                    {formatAddress(addr)}
                  </p>
                  {addr.isPrimary && (
                    <span className="text-xs text-success font-medium flex-shrink-0">
                      Основной
                    </span>
                  )}
                  <ValidationBadge status={addr.validationStatus} error={addr.validationError} />
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
          <AddressInput
            key={editingId ?? 'new'}
            value={addressValue}
            onChange={setAddressValue}
            label="Адрес"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={closeModal} disabled={saving}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={saving || !addressValue}>
              {saving ? 'Сохранение...' : editingId ? 'Сохранить' : 'Добавить'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
