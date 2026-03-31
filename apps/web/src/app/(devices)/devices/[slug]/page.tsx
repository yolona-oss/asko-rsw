import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Product, SpecRow } from '@/lib/devices';
import { Container } from '@asko/ui';
import { ProductGallery } from '@/components/devices/product-gallery';
import { ProductInfo } from '@/components/devices/product-info';
import { ProductSpecs } from '@/components/devices/product-specs';
import { ProductCare } from '@/components/devices/product-care';
import { ProductAllSpecs } from '@/components/devices/product-all-specs';
import { ArticleRecommendations } from '@/components/articles/article-recommendations';
import { fetchDeviceBySlug, fetchDeviceImageUrlsBySlug, fetchDeviceImagesBySlug } from '@/lib/api/device.server';
import { fetchDeviceCategories } from '@/lib/api/device-category.server';
import { fetchArticlesByTags, fetchArticlePreviewImage } from '@/lib/api/article.server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [device, images] = await Promise.all([
    fetchDeviceBySlug(slug),
    fetchDeviceImagesBySlug(slug),
  ]);

  if (!device) return {};

  const description = device.description?.slice(0, 160).trim() || `${device.name} — характеристики, цена, сервис ASKO`;
  const previewImage = images.sort((a, b) => a.order - b.order)[0];
  const ogImage =
    previewImage?.imageJson.medium?.secure_url ??
    previewImage?.imageJson.original.secure_url;

  return {
    title: `${device.name} — ASKO`,
    description,
    openGraph: {
      title: device.name,
      description,
      type: 'website',
      ...(ogImage && { images: [ogImage] }),
    },
  };
}

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

  // Fetch related articles by device tags
  const deviceTags = [
    typeLabels[device.type]?.toLowerCase(),
    device.brand?.toLowerCase(),
    device.model?.toLowerCase(),
  ].filter(Boolean) as string[];

  const relatedArticles = deviceTags.length > 0 ? await fetchArticlesByTags(deviceTags, 4) : [];
  const articleImageMap = new Map<string, string | null>();
  const articleImgResults = await Promise.all(
    relatedArticles.map((a) => fetchArticlePreviewImage(a.slug)),
  );
  relatedArticles.forEach((a, i) => articleImageMap.set(a.id, articleImgResults[i]));

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

          {/* Related articles */}
          <ArticleRecommendations
            articles={relatedArticles}
            imageMap={articleImageMap}
            title="Статьи по обслуживанию"
          />
        </div>
      </Container>
    </div>
  );
}
