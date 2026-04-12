'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Card, Modal, SkeletonCard } from '@asko/ui';
import { ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import { MONTH_NAMES_RU } from '@asko/shared/client';
import { scheduleApi } from '@/lib/api/schedule';
import type { ScheduleAggregateReport } from '@/lib/api/schedule';

interface ScheduleReportModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName?: string;
  canExportPdf?: boolean;
}

function formatMinutes(m: number): string {
  const h = Math.floor(m / 60);
  const mins = m % 60;
  if (h === 0) return `${mins} мин`;
  if (mins === 0) return `${h} ч`;
  return `${h} ч ${mins} мин`;
}

function monthRange(year: number, month: number): { dateFrom: string; dateTo: string } {
  const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { dateFrom: from, dateTo: to };
}

type MonthReport = ScheduleAggregateReport | null;

function sumReports(reports: MonthReport[]): ScheduleAggregateReport | null {
  const filled = reports.filter((r): r is ScheduleAggregateReport => r !== null);
  if (filled.length === 0) return null;
  return {
    userId: filled[0].userId,
    dateFrom: filled[0].dateFrom,
    dateTo: filled[filled.length - 1].dateTo,
    isCurrentlyActive: filled[filled.length - 1].isCurrentlyActive,
    totalDays: filled.reduce((s, r) => s + r.totalDays, 0),
    activeDays: filled.reduce((s, r) => s + r.activeDays, 0),
    inactiveDays: filled.reduce((s, r) => s + r.inactiveDays, 0),
    workDays: filled.reduce((s, r) => s + r.workDays, 0),
    restDays: filled.reduce((s, r) => s + r.restDays, 0),
    noPatternDays: filled.reduce((s, r) => s + r.noPatternDays, 0),
    vacationDays: filled.reduce((s, r) => s + r.vacationDays, 0),
    sickLeaveDays: filled.reduce((s, r) => s + r.sickLeaveDays, 0),
    overtimeCount: filled.reduce((s, r) => s + r.overtimeCount, 0),
    overtimeTotalMinutes: filled.reduce((s, r) => s + r.overtimeTotalMinutes, 0),
    extraDayCount: filled.reduce((s, r) => s + r.extraDayCount, 0),
    patternRevisions: filled.reduce((s, r) => s + r.patternRevisions, 0),
  };
}

function SummaryCards({ report }: { report: ScheduleAggregateReport }) {
  const items = [
    { label: 'Рабочие дни', value: report.workDays },
    { label: 'Выходные', value: report.restDays },
    { label: 'Отпуск (дни)', value: report.vacationDays },
    { label: 'Переработки', value: `${report.overtimeCount} (${formatMinutes(report.overtimeTotalMinutes)})` },
    { label: 'Больничные (дни)', value: report.sickLeaveDays },
    { label: 'Доп. дни', value: report.extraDayCount },
    { label: 'Дни активности', value: report.activeDays },
    { label: 'Дни неактивности', value: report.inactiveDays },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map((item) => (
        <Card key={item.label} padding="none" className="p-3 flex flex-col gap-1">
          <p className="text-[11px] text-text-sub">{item.label}</p>
          <p className="text-[20px] leading-[24px] font-semibold text-text-main">{item.value}</p>
        </Card>
      ))}
    </div>
  );
}

function MonthlyTable({ reports }: { reports: MonthReport[] }) {
  return (
    <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:mx-0">
      <table className="w-full text-[12px] sm:text-[13px] min-w-[700px]">
        <thead>
          <tr className="border-b border-border text-text-sub text-left">
            <th className="p-2 font-medium">Месяц</th>
            <th className="p-2 font-medium text-right">Раб. дни</th>
            <th className="p-2 font-medium text-right">Выходные</th>
            <th className="p-2 font-medium text-right">Отпуск</th>
            <th className="p-2 font-medium text-right">Больничные</th>
            <th className="p-2 font-medium text-right">Переработки</th>
            <th className="p-2 font-medium text-right">Доп. дни</th>
            <th className="p-2 font-medium text-right">Акт.</th>
            <th className="p-2 font-medium text-right">Неакт.</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r, i) => (
            <tr key={i} className="border-b border-border-light hover:bg-surface-hover transition-colors">
              <td className="p-2 font-medium text-text-main">{MONTH_NAMES_RU[i]}</td>
              {r ? (
                <>
                  <td className="p-2 text-right text-text-main">{r.workDays}</td>
                  <td className="p-2 text-right text-text-main">{r.restDays}</td>
                  <td className="p-2 text-right text-text-main">{r.vacationDays}</td>
                  <td className="p-2 text-right text-text-main">{r.sickLeaveDays}</td>
                  <td className="p-2 text-right text-text-main">
                    {r.overtimeCount > 0 ? `${r.overtimeCount} (${formatMinutes(r.overtimeTotalMinutes)})` : '0'}
                  </td>
                  <td className="p-2 text-right text-text-main">{r.extraDayCount}</td>
                  <td className="p-2 text-right text-text-main">{r.activeDays}</td>
                  <td className="p-2 text-right text-text-main">{r.inactiveDays}</td>
                </>
              ) : (
                <td colSpan={8} className="p-2 text-text-sub text-center">&mdash;</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function buildPrintHtml(year: number, userName: string, yearSummary: ScheduleAggregateReport, reports: MonthReport[]): string {
  const esc = (s: string | number) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const summaryItems = [
    ['Рабочие дни', yearSummary.workDays],
    ['Выходные', yearSummary.restDays],
    ['Отпуск (дни)', yearSummary.vacationDays],
    ['Переработки', `${yearSummary.overtimeCount} (${formatMinutes(yearSummary.overtimeTotalMinutes)})`],
    ['Больничные (дни)', yearSummary.sickLeaveDays],
    ['Доп. дни', yearSummary.extraDayCount],
    ['Дни активности', yearSummary.activeDays],
    ['Дни неактивности', yearSummary.inactiveDays],
  ];

  const summaryHtml = summaryItems
    .map(([label, value]) => `<div class="card"><div class="label">${esc(label)}</div><div class="value">${esc(value)}</div></div>`)
    .join('');

  const rowsHtml = reports
    .map((r, i) => {
      if (!r) return `<tr><td>${esc(MONTH_NAMES_RU[i])}</td><td colspan="8" style="text-align:center">&mdash;</td></tr>`;
      const ot = r.overtimeCount > 0 ? `${r.overtimeCount} (${formatMinutes(r.overtimeTotalMinutes)})` : '0';
      return `<tr>
        <td>${esc(MONTH_NAMES_RU[i])}</td>
        <td class="num">${esc(r.workDays)}</td>
        <td class="num">${esc(r.restDays)}</td>
        <td class="num">${esc(r.vacationDays)}</td>
        <td class="num">${esc(r.sickLeaveDays)}</td>
        <td class="num">${esc(ot)}</td>
        <td class="num">${esc(r.extraDayCount)}</td>
        <td class="num">${esc(r.activeDays)}</td>
        <td class="num">${esc(r.inactiveDays)}</td>
      </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
<title>Отчёт ${esc(userName)} — ${esc(year)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; padding: 32px; color: #323232; font-size: 13px; }
  h1 { font-size: 20px; font-weight: 600; margin-bottom: 4px; }
  .sub { color: #979797; margin-bottom: 20px; }
  .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .card { border: 1px solid #eaeaea; padding: 12px; }
  .card .label { font-size: 11px; color: #979797; margin-bottom: 4px; }
  .card .value { font-size: 18px; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 6px 8px; border-bottom: 1px solid #eaeaea; text-align: left; }
  th { font-weight: 500; color: #979797; font-size: 12px; }
  .num { text-align: right; }
  @media print { body { padding: 16px; } }
</style>
</head>
<body>
  <h1>Отчёт по расписанию — ${esc(year)}</h1>
  <p class="sub">${esc(userName)}</p>
  <div class="summary">${summaryHtml}</div>
  <table>
    <thead>
      <tr>
        <th>Месяц</th>
        <th class="num">Раб. дни</th>
        <th class="num">Выходные</th>
        <th class="num">Отпуск</th>
        <th class="num">Больничные</th>
        <th class="num">Переработки</th>
        <th class="num">Доп. дни</th>
        <th class="num">Акт.</th>
        <th class="num">Неакт.</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
</body>
</html>`;
}

export function ScheduleReportModal({ open, onClose, userId, userName, canExportPdf = false }: ScheduleReportModalProps) {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [reports, setReports] = useState<MonthReport[]>(Array(12).fill(null));
  const [loading, setLoading] = useState(false);

  const displayName = userName || userId.slice(0, 8);

  const fetchYear = useCallback(async (y: number) => {
    setLoading(true);
    setReports(Array(12).fill(null));
    try {
      const results = await Promise.all(
        Array.from({ length: 12 }, (_, m) => {
          const { dateFrom, dateTo } = monthRange(y, m);
          return scheduleApi.scheduleReport(userId, dateFrom, dateTo)
            .then((res) => res.data)
            .catch(() => null);
        }),
      );
      setReports(results);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (open) fetchYear(year);
  }, [open, year, fetchYear]);

  const yearSummary = sumReports(reports);

  const handleExportPdf = () => {
    if (!yearSummary) return;
    const html = buildPrintHtml(year, displayName, yearSummary, reports);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.addEventListener('afterprint', () => URL.revokeObjectURL(url));
      printWindow.onload = () => printWindow.print();
    } else {
      URL.revokeObjectURL(url);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <Modal open={open} onClose={onClose} className="w-full max-w-5xl p-4 sm:p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h2 className="text-[16px] sm:text-[18px] font-semibold text-text-main">Отчёт по расписанию</h2>
          <p className="text-[12px] sm:text-[13px] text-text-sub">{displayName}</p>
        </div>
        <div className="flex items-center gap-2">
          {canExportPdf && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportPdf}
              disabled={loading || !yearSummary}
            >
              <Printer className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Печать</span>
            </Button>
          )}
        </div>
      </div>

      {/* Year navigation */}
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => setYear((y) => y - 1)}
          className="p-1.5 hover:bg-surface-hover transition-colors text-text-sub hover:text-text-main"
          aria-label="Предыдущий год"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-[18px] sm:text-[24px] font-semibold text-text-main tabular-nums min-w-[80px] text-center">
          {year}
        </span>
        <button
          type="button"
          onClick={() => setYear((y) => y + 1)}
          disabled={year >= currentYear}
          className="p-1.5 hover:bg-surface-hover transition-colors text-text-sub hover:text-text-main disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Следующий год"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} className="h-[60px]" />
            ))}
          </div>
          <SkeletonCard className="h-[300px]" />
        </div>
      ) : yearSummary ? (
        <div className="flex flex-col gap-4">
          <SummaryCards report={yearSummary} />
          <MonthlyTable reports={reports} />
        </div>
      ) : (
        <p className="text-sm text-text-sub text-center py-8">Нет данных за {year} год</p>
      )}
    </Modal>
  );
}
