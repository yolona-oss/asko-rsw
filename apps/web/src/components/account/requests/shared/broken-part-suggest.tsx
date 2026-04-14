'use client';

import { useState, useCallback } from 'react';
import { Badge, Button, FormField, Input, Modal, Textarea } from '@asko/ui';
import { Plus } from 'lucide-react';
import { repairRequestApi } from '@/lib/api/repair-request';
import type { BrokenPart } from './broken-part-types';

interface BrokenPartSuggestSectionProps {
  requestId: string;
  suggestions: BrokenPart[];
  onSuggestionAdded: (part: BrokenPart) => void;
}

export function BrokenPartSuggestSection({ requestId, suggestions, onSuggestionAdded }: BrokenPartSuggestSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Укажите название');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const { data } = await repairRequestApi.suggestBrokenPart(requestId, {
        name: trimmed,
        note: note.trim() || undefined,
      });
      const part = (data.part ?? data) as BrokenPart;
      onSuggestionAdded(part);
      setModalOpen(false);
      setName('');
      setNote('');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Не удалось отправить');
    } finally {
      setSaving(false);
    }
  }, [name, note, requestId, onSuggestionAdded]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-main">Ваши предположения</h3>
        <Button variant="secondary" size="sm" onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1 inline" />Предположить
        </Button>
      </div>

      {suggestions.length === 0 ? (
        <p className="text-xs text-text-sub">
          Если вы предполагаете, какая запчасть вышла из строя — добавьте предположение. Это поможет мастеру.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {suggestions.map((s) => (
            <div key={s.id} className="flex items-start gap-2 p-2 border border-border-light bg-surface">
              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <span className="text-sm text-text-main">{s.name}</span>
                {s.note && <span className="text-xs text-text-sub">{s.note}</span>}
              </div>
              <Badge variant="neutral">Предположение</Badge>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={saving ? undefined : () => setModalOpen(false)} className="w-full max-w-sm p-6">
        <h2 className="text-base font-medium text-text-main mb-4">Предположение о неисправности</h2>

        <div className="flex flex-col gap-3">
          <FormField label="Какая запчасть, по вашему мнению, неисправна?">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Термостат, Насос..."
            />
          </FormField>

          <FormField label="Примечание (необязательно)">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Дополнительная информация"
            />
          </FormField>
        </div>

        {error && <p className="text-sm text-brand-red mt-2">{error}</p>}

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)} disabled={saving}>
            Отмена
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} disabled={saving || !name.trim()}>
            {saving ? 'Отправка...' : 'Отправить'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
