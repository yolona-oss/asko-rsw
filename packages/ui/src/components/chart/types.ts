export type ChartStyle = 'bar' | 'line';

export interface ChartBucket {
  start: Date;
  end: Date;
  total: number;
  count: number;
  label: string;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface RangePreset {
  key: string;
  label: string;
  ms: number;
}
