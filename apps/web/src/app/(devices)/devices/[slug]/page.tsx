import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Product, SpecRow } from '@/lib/devices';
import type { DeviceRecord } from '@/lib/api/types';
import { Container, SkeletonBlock } from '@asko/ui';
import { ProductGallery } from '@/components/devices/product-gallery';
import { ProductInfo } from '@/components/devices/product-info';
import { ProductSpecs } from '@/components/devices/product-specs';
import { ProductCare } from '@/components/devices/product-care';
import { ProductAllSpecs } from '@/components/devices/product-all-specs';
import { ArticleRecommendations } from '@/components/articles/article-recommendations';
import { fetchDeviceBySlug, fetchDeviceImageUrlsBySlug, fetchDeviceImagesBySlug } from '@/lib/api/device.server';
import { fetchDeviceCategories } from '@/lib/api/device-category.server';
import { fetchArticles, fetchArticlesByTags, fetchArticlePreviewImage } from '@/lib/api/article.server';
import { getImageUrl } from '@/lib/image-url';

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
  const ogImage = getImageUrl(previewImage, 'medium');

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

function deviceToProduct(device: DeviceRecord, images: string[], typeLabels: Record<string, string>): Product {
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

function ProductDetailSkeleton() {
  return (
    <div className="bg-page-bg">
      <Container>
        <div className="flex flex-col gap-8 md:gap-12 py-6 md:py-8 lg:py-10">
          {/* Desktop skeleton: gallery + info */}
          <div className="hidden lg:flex gap-14">
            <SkeletonBlock className="w-[500px] h-[500px]" />
            <div className="flex-1 flex flex-col gap-4">
              <SkeletonBlock className="h-4 w-24" />
              <SkeletonBlock className="h-8 w-72" />
              <SkeletonBlock className="h-4 w-48" />
              <div className="mt-4 flex flex-col gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonBlock key={i} className="h-4 w-full" />
                ))}
              </div>
            </div>
          </div>
          {/* Mobile skeleton */}
          <div className="lg:hidden flex flex-col gap-6">
            <SkeletonBlock className="h-6 w-48" />
            <SkeletonBlock className="aspect-square w-full" />
            <SkeletonBlock className="h-12 w-full" />
          </div>
          {/* Care skeleton */}
          <SkeletonBlock className="h-32 w-full" />
          {/* Specs skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SkeletonBlock className="h-48" />
            <SkeletonBlock className="h-48" />
          </div>
        </div>
      </Container>
    </div>
  );
}

async function ProductDetailContent({ slug }: { slug: string }) {
  const [device, images, categories] = await Promise.all([
    fetchDeviceBySlug(slug),
    fetchDeviceImageUrlsBySlug(slug),
    fetchDeviceCategories(),
  ]);

  if (!device) {
    notFound();
  }

  const typeLabels = Object.fromEntries(categories.map((c: { name: string; label: string }) => [c.name, c.label]));
  const product = deviceToProduct(device, images, typeLabels);

  // Fetch related articles by device tags, fallback to latest if fewer than 4
  const deviceTags = [
    typeLabels[device.type]?.toLowerCase(),
    device.brand?.toLowerCase(),
    device.model?.toLowerCase(),
  ].filter(Boolean) as string[];

  let relatedArticles = deviceTags.length > 0 ? await fetchArticlesByTags(deviceTags, 4) : [];

  if (relatedArticles.length < 4) {
    const existing = new Set(relatedArticles.map((a) => a.id));
    const fallback = await fetchArticles(1, 4);
    const extra = (fallback.data ?? []).filter((a) => !existing.has(a.id));
    relatedArticles = [...relatedArticles, ...extra].slice(0, 4);
  }

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
              className="flex items-center justify-center w-full py-3 text-sm font-medium text-text-on-brand bg-brand-red-dark shadow-sm"
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

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <ProductDetailContent slug={slug} />
    </Suspense>
  );
}
