export interface PartFormData {
  deviceId: string;
  categoryId: string;
  group: string;
  name: string;
  partNumber: string;
  price: string;
  description: string;
}

export const EMPTY_PART_FORM: PartFormData = {
  deviceId: '',
  categoryId: '',
  group: '',
  name: '',
  partNumber: '',
  price: '',
  description: '',
};
