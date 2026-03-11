export interface SpecRow {
  label: string;
  value: string;
}

export interface Product {
  slug: string;
  title: string;
  category: string;
  subtitle: string;
  rating: number;
  images: string[];
  badges: { icon: 'shield' | 'gem' | 'user'; label: string }[];
  specsPreview: SpecRow[];
  specsLeft: SpecRow[];
  specsRight: SpecRow[];
  careTitle: string;
  careDescription: string;
}

export const products: Product[] = [
  {
    slug: 't108hbw',
    title: 'Сушильная машины Asko-T108HBW',
    category: 'Сушильные машины',
    subtitle: 'Официальные запчасти от производителя',
    rating: 5,
    images: [
      '/images/7d57ebe13de0ab80138bca5f4062e2c0650cf8bb.png',
      '/images/00f921adbbe354ea048e60bb3ee0589764b18c7b.jpg',
      '/images/c421a86e871ef4c3367e99cf70ea788325c0bfa2.png',
      '/images/b9fd50ea648ab558085721e0f33610b5b0b61bac.png',
    ],
    badges: [
      { icon: 'shield', label: 'Оригинальные запчасти' },
      { icon: 'gem', label: 'Премиальный сервис' },
      { icon: 'user', label: 'Опытные специалисты' },
    ],
    specsPreview: [
      { label: 'Максимальная загрузка', value: '8 кг' },
      { label: 'Габаритные размеры (В*Ш*Г)', value: '85*59.5*63 см' },
      { label: 'Объем барабана', value: '117 л' },
      { label: 'Технология сушки', value: 'тепловой насос' },
      { label: 'Загрузка при сушке синтетика/ хлопок/шерсть', value: '4/8/2 кг' },
      { label: 'Встроенный теплообменник', value: 'Да' },
      { label: 'Тип мотора', value: 'инверторный' },
      { label: 'Тип управления', value: 'кнопочный/поворотный' },
    ],
    specsLeft: [
      { label: 'Страна', value: 'Словения' },
      { label: 'Максимальная загрузка', value: '8 кг' },
      { label: 'Габаритные размеры (В*Ш*Г)', value: '85*59.5*63 см' },
      { label: 'Объем барабана', value: '117 л' },
      { label: 'Технология сушки', value: 'тепловой насос' },
      { label: 'Загрузка при сушке синтетика/ хлопок/шерсть', value: '4/8/2 кг' },
      { label: 'Встроенный теплообменник', value: 'Да' },
      { label: 'Тип мотора', value: 'инверторный' },
      { label: 'Тип управления', value: 'кнопочный/поворотный' },
    ],
    specsRight: [
      { label: 'Управление', value: 'электронное' },
      { label: 'Переключатели', value: 'кнопочные' },
      { label: 'Объем барабана', value: '117 л' },
      { label: 'Материал барабана', value: 'нержавеющая сталь' },
      { label: 'Поверхность барабана', value: 'SoftCare Drum' },
      { label: 'Встроенный теплообменник', value: 'Да' },
      { label: 'Количество программ', value: '10' },
      { label: 'Дозагрузка белья во время программы', value: 'Да' },
    ],
    careTitle: 'О правильном уходе за сушильной машиной ASKO',
    careDescription: 'Сушильные машины ASKO отличаются высокой надежностью и продуманной конструкцией, однако для стабильной и долговечной работы важно регулярно выполнять базовое обслуживание. Правильный уход не только продлевает срок службы техники, но и помогает сохранять эффективность сушки, снижает энергопотребление и предотвращает возможные неисправности.',
  },
  {
    slug: 'w4114c',
    title: 'Стиральная машина Asko W4114C.W/3',
    category: 'Стиральные машины',
    subtitle: 'Официальные запчасти от производителя',
    rating: 5,
    images: [
      '/images/00f921adbbe354ea048e60bb3ee0589764b18c7b.jpg',
      '/images/7d57ebe13de0ab80138bca5f4062e2c0650cf8bb.png',
      '/images/c421a86e871ef4c3367e99cf70ea788325c0bfa2.png',
      '/images/b9fd50ea648ab558085721e0f33610b5b0b61bac.png',
    ],
    badges: [
      { icon: 'shield', label: 'Оригинальные запчасти' },
      { icon: 'gem', label: 'Премиальный сервис' },
      { icon: 'user', label: 'Опытные специалисты' },
    ],
    specsPreview: [
      { label: 'Максимальная загрузка', value: '11 кг' },
      { label: 'Габаритные размеры (В*Ш*Г)', value: '85*60*59 см' },
      { label: 'Объем барабана', value: '72 л' },
      { label: 'Максимальная скорость отжима', value: '1400 об/мин' },
      { label: 'Класс энергопотребления', value: 'A' },
      { label: 'Тип мотора', value: 'инверторный' },
      { label: 'Управление', value: 'электронное' },
      { label: 'Тип управления', value: 'кнопочный' },
    ],
    specsLeft: [
      { label: 'Страна', value: 'Словения' },
      { label: 'Максимальная загрузка', value: '11 кг' },
      { label: 'Габаритные размеры (В*Ш*Г)', value: '85*60*59 см' },
      { label: 'Объем барабана', value: '72 л' },
      { label: 'Максимальная скорость отжима', value: '1400 об/мин' },
      { label: 'Класс энергопотребления', value: 'A' },
      { label: 'Тип мотора', value: 'инверторный' },
      { label: 'Управление', value: 'электронное' },
      { label: 'Тип управления', value: 'кнопочный' },
    ],
    specsRight: [
      { label: 'Переключатели', value: 'кнопочные' },
      { label: 'Материал бака', value: 'нержавеющая сталь' },
      { label: 'Количество программ', value: '16' },
      { label: 'Дозагрузка белья', value: 'Да' },
      { label: 'Защита от протечек', value: 'Да' },
      { label: 'Контроль дисбаланса', value: 'Да' },
      { label: 'Контроль пенообразования', value: 'Да' },
      { label: 'Отложенный старт', value: 'Да' },
    ],
    careTitle: 'О правильном уходе за стиральной машиной ASKO',
    careDescription: 'Стиральные машины ASKO рассчитаны на долгий срок эксплуатации при соблюдении рекомендаций производителя. Регулярная очистка фильтра, использование подходящих моющих средств и периодическая профилактика помогают поддерживать высокое качество стирки и продлевают срок службы техники.',
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getAllProductSlugs(): string[] {
  return products.map((p) => p.slug);
}
