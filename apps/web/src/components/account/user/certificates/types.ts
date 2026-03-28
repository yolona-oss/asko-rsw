export interface UserDevice {
  id: string;
  serialNumber?: string;
  device?: { name?: string; brand?: string; model?: string };
  address?: { city?: string; street?: string; house?: number; validationStatus?: string; validationError?: string };
  createdAt?: Date | string;
}

export interface CatalogDevice {
  id: string;
  name: string;
  brand: string;
  model: string;
}
