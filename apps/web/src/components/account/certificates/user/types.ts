export interface UserDevice {
  id: string;
  serialNumber?: string;
  device?: { id?: string; name?: string; brand?: string; model?: string };
  address?: {
    id?: string;
    country?: string;
    city?: string;
    street?: string;
    house?: number;
    building?: number;
    floor?: number;
    room?: number;
    latitude?: number;
    longitude?: number;
    validationStatus?: string;
    validationError?: string;
  };
  createdAt?: Date | string;
}

export interface CatalogDevice {
  id: string;
  name: string;
  brand: string;
  model: string;
}
