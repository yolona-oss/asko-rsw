'use client';

import {
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableCell,
  DataTableEmpty,
  DataTableFooter,
} from '@asko/ui';
import type { Certificate } from './types';
import { STATUS_LABELS, STATUS_COLORS, formatDate } from './constants';

export function CertificateTable({
  certificates,
  total,
}: {
  certificates: Certificate[];
  total: number;
}) {
  return (
    <DataTable>
      <DataTableHeader>
        <div className="w-[140px] flex-shrink-0">Номер</div>
        <div className="flex-1 px-4">Клиент</div>
        <div className="flex-1 px-4">Устройство</div>
        <div className="w-[100px] px-4">Статус</div>
        <div className="w-[100px] px-4">Выдан</div>
        <div className="w-[100px] px-4">Истекает</div>
      </DataTableHeader>
      {certificates.length === 0 ? (
        <DataTableEmpty>Нет сертификатов</DataTableEmpty>
      ) : (
        certificates.map((cert) => {
          const clientName = [cert.user?.lastName, cert.user?.firstName].filter(Boolean).join(' ')
            || cert.user?.email || '-';
          const deviceName = cert.userDevice?.device?.name ?? '-';

          return (
            <DataTableRow key={cert.id}>
              <DataTableCell mobileLabel="Номер:" className="lg:w-[140px] lg:flex-shrink-0">
                <p className="text-sm font-medium text-text-main">{cert.certificateNumber}</p>
              </DataTableCell>
              <DataTableCell mobileLabel="Клиент:" className="lg:flex-1 lg:px-4">
                <p className="text-sm text-text-main">{clientName}</p>
              </DataTableCell>
              <DataTableCell mobileLabel="Устройство:" className="lg:flex-1 lg:px-4">
                <p className="text-sm text-text-main">{deviceName}</p>
              </DataTableCell>
              <DataTableCell mobileLabel="Статус:" className="lg:w-[100px] lg:px-4">
                <span className={`text-sm font-medium ${STATUS_COLORS[cert.status] ?? 'text-text-main'}`}>
                  {STATUS_LABELS[cert.status] ?? cert.status}
                </span>
              </DataTableCell>
              <DataTableCell mobileLabel="Выдан:" className="lg:w-[100px] lg:px-4">
                <p className="text-sm text-text-main">{formatDate(cert.issuedAt)}</p>
              </DataTableCell>
              <DataTableCell mobileLabel="Истекает:" className="lg:w-[100px] lg:px-4">
                <p className="text-sm text-text-main">{formatDate(cert.expiresAt)}</p>
              </DataTableCell>
            </DataTableRow>
          );
        })
      )}
      <DataTableFooter>
        Показано {certificates.length} из {total}
      </DataTableFooter>
    </DataTable>
  );
}
