export interface PartFormData {
  name: string;
  partNumber: string;
  price: string;
  description: string;
}

export interface FormData {
  name: string;
  type: string;
  model: string;
  brand: string;
  description: string;
  slug: string;
  isFeatured: boolean;
}

export interface AdminDeviceFormProps {
  deviceId?: string;
}
