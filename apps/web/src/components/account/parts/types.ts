export interface PartFormData {
  deviceId: string;
  name: string;
  partNumber: string;
  price: string;
  description: string;
}

export const EMPTY_PART_FORM: PartFormData = {
  deviceId: '',
  name: '',
  partNumber: '',
  price: '',
  description: '',
};
