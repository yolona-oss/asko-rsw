import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Container, Pagination, SkeletonBlock } from '@asko/ui';

export const metadata: Metadata = {
  title: 'Каталог техники ASKO — модели и характеристики',
  description: 'Полный каталог бытовой техники ASKO: стиральные машины, сушильные машины, посудомоечные машины, духовые шкафы и другое оборудование. Характеристики, цены, сервис.',
  openGraph: {
    title: 'Каталог техники ASKO',
    description: 'Полный каталог бытовой техники ASKO с характеристиками и ценами.',
    type: 'website',
  },
};
import { fetchDevices, fetchFirstDeviceImage } from '@/lib/api/device.server';
import { fetchDeviceCategories } from '@/lib/api/device-category.server';
import { getPlaceholderSrc } from '@/lib/placeholders';

const LIMIT = 12;

function DevicesListSkeleton() {
  return (
    <div className="bg-page-bg">
      <Container>
        <div className="py-8 md:py-12">
          <SkeletonBlock className="h-8 w-48 mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col">
                <SkeletonBlock className="aspect-square w-full" />
                <div className="p-3 md:p-4 flex flex-col gap-2">
                  <SkeletonBlock className="h-3 w-16" />
                  <SkeletonBlock className="h-4 w-full" />
                  <SkeletonBlock className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}

async function DevicesContent({ page }: { page: number }) {
  const [{ data: devices, overallCount: total }, categories] = await Promise.all([
    fetchDevices(page, LIMIT),
    fetchDeviceCategories(),
  ]);
  const typeLabels = Object.fromEntries(categories.map((c) => [c.name, c.label]));
  const totalPages = Math.ceil(total / LIMIT);

  const imageMap = new Map<string, string | null>();
  const imageResults = await Promise.all(
    devices.map((d) => fetchFirstDeviceImage(d.id)),
  );
  devices.forEach((d, i) => imageMap.set(d.id, imageResults[i]));

  return (
    <div className="bg-page-bg">
      <Container>
        <div className="py-8 md:py-12">
          <h1 className="text-2xl md:text-[32px] font-medium tracking-[-0.01em] text-text-main mb-8">
            Каталог товаров
          </h1>

          {devices.length === 0 ? (
            <p className="text-text-sub text-sm">Товары не найдены</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {devices.map((device) => {
                const imgUrl = imageMap.get(device.id);
                return (
                  <Link
                    key={device.id}
                    href={`/devices/${device.slug}`}
                    className="group flex flex-col bg-surface border border-border-light/30 rounded-sm overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="relative aspect-square bg-surface-hover">
                      <Image
                        src={imgUrl ?? getPlaceholderSrc('device', device.id)}
                        alt={device.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    </div>
                    <div className="p-3 md:p-4 flex flex-col gap-1">
                      <span className="text-[11px] text-text-sub uppercase tracking-wider">
                        {typeLabels[device.type] ?? device.type}
                      </span>
                      <h2 className="text-sm font-medium text-text-main line-clamp-2 leading-tight">
                        {device.name}
                      </h2>
                      <span className="text-xs text-text-sub">
                        {device.brand} {device.model}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          <Pagination
            page={page}
            totalPages={totalPages}
            hrefPattern="/devices?page={page}"
            className="justify-center mt-10"
          />
        </div>
      </Container>
    </div>
  );
}

export default async function DevicesListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);

  return (
    <Suspense fallback={<DevicesListSkeleton />}>
      <DevicesContent page={page} />
    </Suspense>
  );
}
