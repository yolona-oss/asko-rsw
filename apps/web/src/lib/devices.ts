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
