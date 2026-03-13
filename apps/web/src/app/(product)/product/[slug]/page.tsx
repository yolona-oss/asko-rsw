import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductBySlug, getAllProductSlugs } from '@/lib/products';
import { Container } from '@asko/ui';
import { ProductGallery } from '@/components/product/product-gallery';
import { ProductInfo } from '@/components/product/product-info';
import { ProductSpecs } from '@/components/product/product-specs';
import { ProductCare } from '@/components/product/product-care';
import { ProductAllSpecs } from '@/components/product/product-all-specs';
import { ProductRecommendations } from '@/components/product/product-recommendations';

export async function generateStaticParams() {
  return getAllProductSlugs().map((slug) => ({ slug }));
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

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
