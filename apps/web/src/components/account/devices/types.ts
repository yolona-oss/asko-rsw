export interface Device {
  id: string;
  name: string;
  type: string;
  model: string;
  brand: string;
  isFeatured?: boolean;
}

export interface ImportStatus {
  total: number;
  done: number;
  errors: string[];
  fileName: string;
  startedAt: number;
  batch: number;
  totalBatches: number;
}
