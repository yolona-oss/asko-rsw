export type ChartStyle = 'bar' | 'line';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface Bucket {
  start: Date;
  end: Date;
  total: number;
  count: number;
  label: string;
}
