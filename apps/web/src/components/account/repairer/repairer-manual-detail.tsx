'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { repairerApi } from '@/lib/api/repairer';
import { Card, Button, Modal, Textarea, FormField, Toggle } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import type { IDevice } from '@/lib/api/types';

export function RepairerManualDetail({ deviceId }: { deviceId: string }) {
  const [device, setDevice] = useState<IDevice | null>(null);
  const [loading, setLoading] = useState(true);

  const [noteOpen, setNoteOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteIsPublic, setNoteIsPublic] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteSuccess, setNoteSuccess] = useState(false);
  const [noteError, setNoteError] = useState('');

  useEffect(() => {
    repairerApi.getDevice(deviceId)
      .then(({ data }) => setDevice(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [deviceId]);

  const handleSaveNote = async () => {
    if (!noteContent.trim()) return;
    setNoteSaving(true);
    setNoteError('');
    try {
      await repairerApi.addNote(deviceId, noteContent, noteIsPublic);
      setNoteSuccess(true);
      setNoteContent('');
      setNoteIsPublic(false);
      setNoteOpen(false);
    } catch {
      setNoteError('Не удалось сохранить заметку');
    } finally {
      setNoteSaving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="h-8 w-64 bg-[#F5F5F5] animate-pulse rounded" />
        <div className="h-64 bg-[#F5F5F5] animate-pulse rounded" />
      </PageContainer>
    );
  }

  if (!device) {
    return (
      <PageContainer>
        <div className="flex items-center gap-4">
          <Link href="/account/man" className="text-sm text-text-sub hover:text-brand-red">
            ← Мануалы
          </Link>
        </div>
        <Card className="text-text-sub text-sm">Устройство не найдено</Card>
      </PageContainer>
    );
  }

  const specs = device.specifications as Record<string, string> | null | undefined;

  return (
    <PageContainer>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Link href="/account/man" className="text-sm text-text-sub hover:text-brand-red">
            ← Мануалы
          </Link>
          <PageHeader>{device.name}</PageHeader>
          <p className="text-sm text-text-sub">{device.brand} · {device.model}</p>
        </div>
        <Button variant="secondary" onClick={() => { setNoteSuccess(false); setNoteError(''); setNoteOpen(true); }}>
          Добавить заметку
        </Button>
      </div>

      {noteSuccess && (
        <div className="px-4 py-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
          Заметка сохранена
          {noteIsPublic ? ' и отправлена на модерацию' : ''}
        </div>
      )}

      <Card className="flex flex-col gap-6">
        {/* Description */}
        {device.description && (
          <div className="flex flex-col gap-2">
            <h3 className="text-base font-medium text-text-main">Описание</h3>
            <p className="text-sm text-text-main leading-relaxed whitespace-pre-wrap">
              {device.description}
            </p>
          </div>
        )}

        {/* Specifications */}
        {specs && Object.keys(specs).length > 0 && (
          <>
            {device.description && <div className="h-px bg-border-light" />}
            <div className="flex flex-col gap-3">
              <h3 className="text-base font-medium text-text-main">Технические характеристики</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                {Object.entries(specs).map(([key, value]) => (
                  <div key={key} className="flex gap-2 text-sm">
                    <span className="text-text-sub flex-shrink-0 w-40">{key}:</span>
                    <span className="text-text-main">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

      </Card>

      {/* Add Note Modal */}
      <Modal open={noteOpen} onClose={() => setNoteOpen(false)} className="w-full max-w-md p-6">
        <h2 className="text-base font-medium text-text-main mb-4">Добавить заметку</h2>
        <div className="flex flex-col gap-4">
          <FormField label="Заметка">
            <Textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Введите заметку к этому устройству..."
              rows={4}
            />
          </FormField>

          <Toggle
            checked={noteIsPublic}
            onChange={setNoteIsPublic}
            label="Опубликовать для всех мастеров"
          />
          {noteIsPublic && (
            <p className="text-xs text-text-sub -mt-2">
              Заметка будет отправлена на модерацию перед публикацией
            </p>
          )}

          {noteError && <p className="text-sm text-brand-red">{noteError}</p>}

          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={handleSaveNote}
              disabled={!noteContent.trim() || noteSaving}
            >
              {noteSaving ? 'Сохранение...' : 'Сохранить'}
            </Button>
            <Button variant="secondary" onClick={() => setNoteOpen(false)}>
              Отмена
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
