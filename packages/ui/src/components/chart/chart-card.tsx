'use client';

import { AlignLeft, BarChart3 } from 'lucide-react';
import type { ChartBucket, ChartStyle } from './types';
import { BarChart } from './bar-chart';
import { LineChart } from './line-chart';
import type { ReactNode } from 'react';

export interface ChartCardProps {
  /** Title below the value */
  title: string;
  /** Formatted main value (e.g. "12 345 ₽") */
  formattedValue: string;
  /** Percentage change vs previous period */
  pctChange: number;
  /** Label for the period change (e.g. "за период") */
  pctLabel?: string;
  /** Data buckets */
  buckets: ChartBucket[];
  /** Chart color */
  color: string;
  /** Current chart style */
  chartStyle: ChartStyle;
  /** Date range label (e.g. "С 1 марта по 1 апреля 2025 г.") */
  rangeLabel: string;
  /** Called when range label is clicked */
  onRangeClick: () => void;
  /** Called to toggle chart style */
  onStyleToggle: () => void;
  /** Custom tooltip render */
  renderTooltip?: (bucket: ChartBucket) => ReactNode;
  /** Format tooltip value */
  formatValue?: (value: number) => string;
  /** Suffix after value in tooltip */
  valueSuffix?: string;
  /** Called when a chart bucket is clicked */
  onBucketClick?: (bucket: ChartBucket, index: number) => void;
}

export function ChartCard({
  title,
  formattedValue,
  pctChange,
  pctLabel = 'за период',
  buckets,
  color,
  chartStyle,
  rangeLabel,
  onRangeClick,
  onStyleToggle,
  renderTooltip,
  formatValue,
  valueSuffix,
  onBucketClick,
}: ChartCardProps) {
  const pctColor = pctChange >= 0 ? 'text-[#2D8B57]' : 'text-brand-red';

  return (
    <div className="bg-surface border border-border shadow-sm p-8 flex flex-col gap-1">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <p
            className="text-text-main font-bold tracking-[-0.01em]"
            style={{ fontSize: 52, lineHeight: '56px' }}
          >
            {formattedValue}
          </p>
          <p
            className="text-text-main font-normal tracking-[-0.01em]"
            style={{ fontSize: 24, lineHeight: '28px' }}
          >
            {title}
          </p>
          <p className="font-normal tracking-[-0.01em]" style={{ fontSize: 18, lineHeight: '22px' }}>
            <span className={pctColor}>{pctChange >= 0 ? '+' : ''}{pctChange}%</span>
            <span className="text-[#2D8B57]"> {pctLabel}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onStyleToggle}
          className="text-text-sub hover:text-text-main transition-colors cursor-pointer p-1"
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
          <div className="h-px bg-border-divider my-3" />
          {chartStyle === 'bar'
            ? <BarChart buckets={buckets} color={color} renderTooltip={renderTooltip} formatValue={formatValue} valueSuffix={valueSuffix} onBucketClick={onBucketClick} />
            : <LineChart buckets={buckets} color={color} renderTooltip={renderTooltip} formatValue={formatValue} valueSuffix={valueSuffix} onBucketClick={onBucketClick} />}
        </>
      )}

      {/* Date range */}
      <div className="h-px bg-border-divider mt-3 mb-2" />
      <button
        type="button"
        onClick={onRangeClick}
        className="text-text-sub font-normal tracking-[-0.01em] hover:text-text-main transition-colors cursor-pointer text-left"
        style={{ fontSize: 18, lineHeight: '22px' }}
      >
        {rangeLabel}
      </button>
    </div>
  );
}
