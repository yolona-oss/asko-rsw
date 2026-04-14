export type Step = 1 | 2 | 3;

export interface CatalogDevice {
  id: string;
  name: string;
  brand: string;
  model: string;
}

export interface FormData {
  clientUserId: string;
  deviceId: string;
  serialNumber: string;
  country: string;
  city: string;
  street: string;
  house: string;
  building: string;
  floor: string;
  room: string;
  durationMonths: string;
  purchaseReceiptUrl: string;
  description: string;
}
