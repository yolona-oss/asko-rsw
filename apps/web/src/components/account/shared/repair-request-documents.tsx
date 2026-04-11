'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FileText, Image as ImageIcon, Trash2 } from 'lucide-react';
import { getDocumentUrl } from '@/lib/file-url';
import { fileUploadApi } from '@/lib/api/file-upload';
import type { RepairRequestDocument } from './broken-part-types';

interface RepairRequestDocumentsProps {
  requestId: string;
  readOnly?: boolean;
  title?: string;
}

export function RepairRequestDocuments({
  requestId,
  readOnly = false,
  title = 'Документы заявки',
}: RepairRequestDocumentsProps) {
  const [documents, setDocuments] = useState<RepairRequestDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    fileUploadApi
      .getAttachedDocuments('repair-request', requestId)
      .then(({ data }) => {
        if (!cancelled) setDocuments((data.documents ?? []) as RepairRequestDocument[]);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [requestId]);

  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      setError('');
      try {
        const { data } = await fileUploadApi.uploadRepairRequestDocument(file, requestId);
        setDocuments((prev) => [...prev, data.document as RepairRequestDocument]);
      } catch {
        setError('Не удалось загрузить документ');
      } finally {
        setUploading(false);
      }
    },
    [requestId],
  );

  const handleDelete = useCallback(async (docId: string) => {
    try {
      await fileUploadApi.deleteDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch {
      setError('Не удалось удалить документ');
    }
  }, []);

  if (loading) return null;
  if (readOnly && documents.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-lg font-medium text-text-main">{title}</h3>
      {documents.length === 0 && !readOnly && (
        <p className="text-sm text-text-sub">Нет документов</p>
      )}
      {documents.length > 0 && (
        <ul className="flex flex-col gap-1">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center gap-2 px-3 py-2 border border-border-light bg-surface"
            >
              {doc.mimeType?.startsWith('image/') ? (
                <ImageIcon className="w-4 h-4 text-text-sub flex-shrink-0" />
              ) : (
                <FileText className="w-4 h-4 text-text-sub flex-shrink-0" />
              )}
              <a
                href={getDocumentUrl(doc.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-text-main truncate flex-1 hover:underline"
              >
                {doc.filename ?? doc.id}
              </a>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => handleDelete(doc.id)}
                  className="text-text-sub hover:text-brand-red cursor-pointer flex-shrink-0"
                  title="Удалить документ"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {!readOnly && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-sm text-brand-red hover:underline cursor-pointer text-left disabled:opacity-50"
          >
            {uploading ? 'Загрузка...' : '+ Загрузить документ (PDF или изображение)'}
          </button>
        </>
      )}
      {error && <p className="text-sm text-brand-red">{error}</p>}
    </div>
  );
}
