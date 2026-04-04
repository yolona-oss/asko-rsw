'use client';

import { AlignLeft, BarChart3 } from 'lucide-react';
import type { Bucket, ChartStyle } from './types';
import { formatAmount } from './utils';
import { BarChart } from './bar-chart';
import { LineChart } from './line-chart';

export function PaymentChartCard({
  title,
  total,
  prevTotal,
  buckets,
  color,
  chartStyle,
  rangeLabel,
  onRangeClick,
  onStyleToggle,
}: {
  title: string;
  total: number;
  prevTotal: number;
  buckets: Bucket[];
  color: string;
  chartStyle: ChartStyle;
  rangeLabel: string;
  onRangeClick: () => void;
  onStyleToggle: () => void;
}) {
  const pctChange = prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : total > 0 ? 100 : 0;
  const pctColor = pctChange >= 0 ? 'text-[#2D8B57]' : 'text-brand-red';

  return (
    <div className="bg-white border border-[#EAEAEA] shadow-[0_10px_60px_rgba(226,236,249,0.5)] p-8 flex flex-col gap-1">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <p
            className="text-[#323232] font-bold tracking-[-0.01em]"
            style={{ fontSize: 52, lineHeight: '56px' }}
          >
            {formatAmount(total)} ₽
          </p>
          <p
            className="text-[#323232] font-normal tracking-[-0.01em]"
            style={{ fontSize: 24, lineHeight: '28px' }}
          >
            {title}
          </p>
          <p className="font-normal tracking-[-0.01em]" style={{ fontSize: 18, lineHeight: '22px' }}>
            <span className={pctColor}>{pctChange >= 0 ? '+' : ''}{pctChange}%</span>
            <span className="text-[#2D8B57]"> за период</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onStyleToggle}
          className="text-[#9C9C9C] hover:text-[#323232] transition-colors cursor-pointer p-1"
          title={chartStyle === 'bar' ? 'Линейный график' : 'Столбчатый график'}
        >
          {chartStyle === 'bar' ? (
            <AlignLeft className="w-5 h-5" />
          ) : (
            <BarChart3 className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Chart */}
      {buckets.length > 0 && (
        <>
          <div className="h-px bg-[#EDEFF1] my-3" />
          {chartStyle === 'bar'
            ? <BarChart buckets={buckets} color={color} />
            : <LineChart buckets={buckets} color={color} />}
        </>
      )}

      {/* Separator + date range */}
      <div className="h-px bg-[#EDEFF1] mt-3 mb-2" />
      <button
        type="button"
        onClick={onRangeClick}
        className="text-[#9C9C9C] font-normal tracking-[-0.01em] hover:text-[#323232] transition-colors cursor-pointer text-left"
        style={{ fontSize: 18, lineHeight: '22px' }}
      >
        {rangeLabel}
      </button>
    </div>
  );
}
