import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Product, SpecRow } from '@/lib/products';
import { Container } from '@asko/ui';
import { ProductGallery } from '@/components/product/product-gallery';
import { ProductInfo } from '@/components/product/product-info';
import { ProductSpecs } from '@/components/product/product-specs';
import { ProductCare } from '@/components/product/product-care';
import { ProductAllSpecs } from '@/components/product/product-all-specs';
import { ProductRecommendations } from '@/components/product/product-recommendations';
import { fetchDeviceBySlug, fetchDeviceImageUrlsBySlug } from '@/lib/api/product.server';
import { fetchDeviceCategories } from '@/lib/api/device-category.server';

const DEFAULT_BADGES: Product['badges'] = [
  { icon: 'shield', label: 'Оригинальные запчасти' },
  { icon: 'gem', label: 'Премиальный сервис' },
  { icon: 'user', label: 'Опытные специалисты' },
];

function kvToSpecs(obj?: Record<string, any> | null): SpecRow[] {
  if (!obj || typeof obj !== 'object') return [];
  return Object.entries(obj).map(([label, value]) => ({
    label,
    value: String(value ?? ''),
  }));
}

function deviceToProduct(device: any, images: string[], typeLabels: Record<string, string>): Product {
  const specs = kvToSpecs(device.specifications);
  const features = kvToSpecs(device.features);
  const allSpecs = [...specs, ...features];

  const mid = Math.ceil(allSpecs.length / 2);

  return {
    slug: device.id,
    title: `${device.name}`,
    category: typeLabels[device.type] ?? device.type,
    subtitle: 'Официальные запчасти от производителя',
    rating: 5,
    images,
    badges: DEFAULT_BADGES,
    specsPreview: allSpecs.slice(0, 8),
    specsLeft: allSpecs.slice(0, mid),
    specsRight: allSpecs.slice(mid),
    careTitle: `О правильном уходе за ${device.brand ?? 'ASKO'} ${device.model ?? ''}`.trim(),
    careDescription: device.description ?? '',
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [device, images, categories] = await Promise.all([
    fetchDeviceBySlug(slug),
    fetchDeviceImageUrlsBySlug(slug),
    fetchDeviceCategories(),
  ]);

  if (!device) {
    notFound();
  }

  const typeLabels = Object.fromEntries(categories.map((c) => [c.name, c.label]));
  const product = deviceToProduct(device, images, typeLabels);

  return (
    <div className="bg-page-bg">
      <Container>
        <div className="flex flex-col gap-8 md:gap-12 py-6 md:py-8 lg:py-10">
          {/* Desktop: gallery + info side by side */}
          <div className="hidden lg:flex gap-14">
            <ProductGallery images={product.images} title={product.title} />
            <ProductInfo product={product} />
          </div>

          {/* Mobile: info first, then gallery, then CTA, then specs */}
          <div className="lg:hidden flex flex-col gap-6">
            <ProductInfo product={product} mobileLayout />
            <ProductGallery images={product.images} title={product.title} mobile />
            <Link
              href="#cta"
              className="flex items-center justify-center w-full py-3 text-sm font-medium text-white bg-[#D7102A] shadow-sm"
            >
              Вызвать мастера
            </Link>
            <ProductSpecs specs={product.specsPreview} />
          </div>

          {/* Care section */}
          <ProductCare
            title={product.careTitle}
            description={product.careDescription}
          />

          {/* All specifications */}
          <ProductAllSpecs
            specsLeft={product.specsLeft}
            specsRight={product.specsRight}
          />

          {/* Recommendations */}
          <ProductRecommendations />
        </div>
      </Container>
    </div>
  );
}
