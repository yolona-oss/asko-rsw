import type { PartFormData, FormData } from './types';

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

export const EMPTY_PART_FORM: PartFormData = {
  name: '',
  partNumber: '',
  price: '',
  description: '',
};

export const INITIAL_DATA: FormData = {
  name: '',
  type: '',
  model: '',
  brand: 'ASKO',
  description: '',
  slug: '',
};

export const DEVICE_TYPES = [
  { value: 'washing_machine', label: 'Стиральная машина' },
  { value: 'dryer', label: 'Сушильная машина' },
  { value: 'dishwasher', label: 'Посудомоечная машина' },
  { value: 'oven', label: 'Духовой шкаф' },
  { value: 'cooktop', label: 'Варочная панель' },
  { value: 'refrigerator', label: 'Холодильник' },
  { value: 'freezer', label: 'Морозильник' },
  { value: 'hood', label: 'Вытяжка' },
  { value: 'other', label: 'Другое' },
];
