import Link from 'next/link';
import Image from 'next/image';
import { Container, Pagination } from '@asko/ui';
import { fetchDevices, fetchFirstDeviceImage } from '@/lib/api/device.server';
import { fetchDeviceCategories } from '@/lib/api/device-category.server';

const LIMIT = 12;

export default async function DevicesListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);

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
                    className="group flex flex-col bg-white border border-border-light/30 rounded-sm overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="relative aspect-square bg-gray-50">
                      <Image
                        src={imgUrl ?? '/images/placeholder.webp'}
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
            getHref={(p) => `/devices?page=${p}`}
            className="justify-center mt-10"
          />
        </div>
      </Container>
    </div>
  );
}
