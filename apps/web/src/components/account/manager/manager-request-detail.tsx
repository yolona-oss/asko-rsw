'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type RequestStatus = 'new' | 'assigned' | 'in_progress' | 'completed' | 'paid' | 'cancelled';

const STATUS_COLORS: Record<RequestStatus, string> = {
  new: 'bg-green-600 text-white',
  assigned: 'bg-yellow-500 text-white',
  in_progress: 'bg-blue-500 text-white',
  completed: 'bg-gray-600 text-white',
  paid: 'bg-emerald-600 text-white',
  cancelled: 'bg-red-500 text-white',
};

const STATUS_LABELS: Record<RequestStatus, string> = {
  new: 'Новая',
  assigned: 'Назначена',
  in_progress: 'В работе',
  completed: 'Завершена',
  paid: 'Оплачена',
  cancelled: 'Отменена',
};

const MOCK_DETAIL = {
  id: '434362',
  status: 'new' as RequestStatus,
  createdAt: '11.02.2026, в 13:22 по МСК',
  client: {
    name: 'Морозов Владислав Игоревич',
    phone: '+7(928)-333-33-33',
  },
  device: 'Сушильная машина ASKO T408HD.W',
  address: 'ул. Центральная, 7, кв. 98',
  photos: [
    '/images/b5b74734a8947326bb92bf563b03dd350fa5f2dc.jpg',
    '/images/b850363a431f1b42ee5b1bee40f79c306ae24bc4.jpg',
    '/images/b9702e3c768dd388a49acb4be05c6b9e9e479151.jpg',
  ],
  assignedMaster: '',
};

const MASTERS = [
  { value: '', label: 'Выбрать доступного мастера' },
  { value: 'grigoriev', label: 'Григорьев Анатолий' },
  { value: 'petrov', label: 'Петров Сергей' },
  { value: 'ivanov', label: 'Иванов Максим' },
];

export function ManagerRequestDetail({ requestId }: { requestId: string }) {
  const request = MOCK_DETAIL;
  const [selectedMaster, setSelectedMaster] = useState(request.assignedMaster);
  const [mainPhoto, setMainPhoto] = useState(0);

  const isAssigned = request.status !== 'new';

  return (
    <div className="p-4 lg:p-8 flex flex-col gap-6 lg:gap-8">
      <h1 className="text-[28px] lg:text-[36px] font-medium tracking-[-0.01em] text-text-main">
        Заявки на обслуживание
      </h1>

      {/* Status header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-text-main">Статус заявки:</h2>
          <span
            className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium ${STATUS_COLORS[request.status]}`}
          >
            {STATUS_LABELS[request.status]}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-text-sub">
          <span>ID #{request.id}</span>
          <button
            type="button"
            className="text-text-sub hover:text-text-main"
            onClick={() => navigator.clipboard.writeText(request.id)}
            aria-label="Копировать ID"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left column - details */}
        <div className="flex-1 flex flex-col gap-5">
          <div>
            <p className="text-sm text-text-sub">Дата создания заявки:</p>
            <p className="text-sm font-medium text-text-main">{request.createdAt}</p>
          </div>

          {isAssigned && (
            <div>
              <p className="text-sm font-bold text-text-main">Исполнитель</p>
              <p className="text-sm text-text-main">
                {MASTERS.find((m) => m.value === selectedMaster)?.label || 'Не назначен'}
              </p>
            </div>
          )}

          <div>
            <p className="text-sm font-bold text-text-main">Клиент</p>
            <p className="text-sm text-text-main">{request.client.name}</p>
            <p className="text-sm text-text-main">{request.client.phone}</p>
          </div>

          <div>
            <p className="text-sm font-bold text-text-main">Детали заявки</p>
            <p className="text-sm text-text-main">{request.device}</p>
            <p className="text-sm text-text-main">{request.address}</p>
          </div>

          {/* Master assignment */}
          <div>
            <p className="text-sm font-bold text-text-main mb-2">
              {isAssigned ? 'Переназначить мастера' : 'Назначение мастера'}
            </p>
            {isAssigned && (
              <p className="text-xs text-text-sub mb-2">
                При смене исполнителя заявка перейдёт в статус «Новая».
              </p>
            )}
            <select
              value={selectedMaster}
              onChange={(e) => setSelectedMaster(e.target.value)}
              className="w-full max-w-[400px] px-4 py-3 border border-border-light rounded-sm text-sm text-text-main bg-white focus:outline-none focus:border-text-main transition-colors appearance-none"
            >
              {MASTERS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <Link
            href="/account/requests"
            className="flex items-center gap-1 text-sm text-text-main hover:text-brand-red transition-colors mt-4"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Назад к заявкам
          </Link>
        </div>

        {/* Right column - photos */}
        <div className="lg:w-[360px] flex-shrink-0">
          <p className="text-sm font-bold text-text-main mb-3">Фото клиента</p>
          {/* Main photo */}
          <div className="relative w-full aspect-video bg-[#E8E8E8] rounded-sm overflow-hidden">
            {request.photos[mainPhoto] && (
              <Image
                src={request.photos[mainPhoto]}
                alt="Фото устройства"
                fill
                className="object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
          </div>
          {/* Thumbnails */}
          <div className="flex gap-2 mt-2">
            {request.photos.map((photo, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setMainPhoto(idx)}
                className={`relative w-20 h-16 rounded-sm overflow-hidden border-2 transition-colors cursor-pointer ${
                  idx === mainPhoto ? 'border-brand-red' : 'border-transparent'
                }`}
              >
                <Image
                  src={photo}
                  alt=""
                  fill
                  className="object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
