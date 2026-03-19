import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@asko/ui';
import { fetchDevices, fetchFirstDeviceImage } from '@/lib/api/product';

const TYPE_LABELS: Record<string, string> = {
  washing_machine: 'Стиральная машина',
  dryer: 'Сушильная машина',
  dishwasher: 'Посудомоечная машина',
  oven: 'Духовой шкаф',
  cooktop: 'Варочная панель',
  refrigerator: 'Холодильник',
  freezer: 'Морозильник',
  hood: 'Вытяжка',
  other: 'Другое',
};

const LIMIT = 12;

export default async function ProductListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);

  const { data: devices, total } = await fetchDevices(page, LIMIT);
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
                    href={`/product/${device.slug}`}
                    className="group flex flex-col bg-white border border-border-light/30 rounded-sm overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="relative aspect-square bg-gray-50">
                      <Image
                        src={imgUrl ?? '/images/placeholder.png'}
                        alt={device.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    </div>
                    <div className="p-3 md:p-4 flex flex-col gap-1">
                      <span className="text-[11px] text-text-sub uppercase tracking-wider">
                        {TYPE_LABELS[device.type] ?? device.type}
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

          {totalPages > 1 && (
            <nav className="flex justify-center gap-2 mt-10">
              {page > 1 && (
                <Link
                  href={`/product?page=${page - 1}`}
                  className="px-3 py-2 text-sm border border-border-light/30 rounded-sm hover:bg-gray-50 text-text-main"
                >
                  &larr;
                </Link>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`/product?page=${p}`}
                  className={`px-3 py-2 text-sm rounded-sm ${
                    p === page
                      ? 'bg-brand-red text-white'
                      : 'border border-border-light/30 hover:bg-gray-50 text-text-main'
                  }`}
                >
                  {p}
                </Link>
              ))}
              {page < totalPages && (
                <Link
                  href={`/product?page=${page + 1}`}
                  className="px-3 py-2 text-sm border border-border-light/30 rounded-sm hover:bg-gray-50 text-text-main"
                >
                  &rarr;
                </Link>
              )}
            </nav>
          )}
        </div>
      </Container>
    </div>
  );
}
