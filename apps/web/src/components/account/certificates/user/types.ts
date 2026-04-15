export interface UserDevice {
  id: string;
  serialNumber?: string;
  device?: { id?: string; name?: string; brand?: string; model?: string };
  address?: {
    id?: string;
    city?: string;
    street?: string;
    house?: string;
    building?: string;
    floor?: string;
    apartment?: string;
    entrance?: string;
    intercom?: string;
    comment?: string;
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
