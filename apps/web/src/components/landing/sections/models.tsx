'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Container, DataFilter } from '@asko/ui';
import type { FilterValues } from '@asko/ui';
import { SkeletonImage } from '@/components/landing/skeleton-image';
import { PlaceholderImage } from '@/components/placeholder-image';
import { deviceApi } from '@/lib/api/device';
import { useDeviceCategories } from '@/hooks/use-device-categories';

interface DeviceModel {
  id: string;
  slug: string;
  title: string;
  description: string;
  image: string | null;
}

function ModelCard({ model }: { model: DeviceModel }) {
  return (
    <div className="flex flex-col gap-6 lg:gap-10">
      <div className="relative w-full aspect-[358/400] lg:aspect-[548/769] overflow-hidden">
        {model.image ? (
          <SkeletonImage
            src={model.image}
            alt={model.title}
            fill
            className="object-cover"
          />
        ) : (
          <PlaceholderImage category="device" idOrIndex={model.id} fill className="object-cover" />
        )}
      </div>
      <div className="flex flex-col gap-4">
        <h3 className="text-2xl leading-7 md:text-[32px] md:leading-9 font-normal tracking-[-0.01em] text-text-main">
          {model.title}
        </h3>
        <div className="flex flex-col gap-4">
          <p className="text-base lg:text-lg leading-[22px] tracking-[-0.01em] text-text-sub">
            {model.description}
          </p>
          <Link
            href={`/devices/${model.slug}`}
            className="inline-flex items-center gap-2 text-base lg:text-lg font-bold text-text-main underline tracking-[-0.01em]"
          >
            Узнать больше...
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ModelsSection() {
  const [models, setModels] = useState<DeviceModel[]>([]);
  const [filterValues, setFilterValues] = useState<FilterValues>({ type: '' });
  const [loading, setLoading] = useState(true);
  const { data: categories } = useDeviceCategories();

  const typeFilters = useMemo(() => [{
    key: 'type',
    label: '',
    type: 'block' as const,
    options: [
      { value: '', label: 'Все' },
      ...(categories ?? []).map((c) => ({ value: c.name, label: c.labelPlural })),
    ],
  }], [categories]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params: Record<string, any> = { isFeatured: true, limit: 8, offset: 1 };
        if (filterValues.type) params.type = filterValues.type;

        const { data: resp } = await deviceApi.getAll(params);
        const devices = resp.data ?? [];

        const mapped: DeviceModel[] = await Promise.all(
          devices.map(async (d) => {
            let image: string | null = null;
            try {
              const { data: imgData } = await deviceApi.getImages(d.id);
              const imgs = (imgData.images ?? []).sort((a, b) => a.order - b.order);
              if (imgs.length > 0) {
                image = imgs[0].imageJson.medium?.secure_url ?? imgs[0].imageJson.original.secure_url;
              }
            } catch { /* ignore */ }
            return {
              id: d.id,
              slug: d.slug,
              title: d.name,
              description: d.description ?? '',
              image,
            };
          }),
        );
        setModels(mapped);
      } catch { /* keep empty */ }
      setLoading(false);
    })();
  }, [filterValues.type]);

  const leftModels = models.filter((_, i) => i % 2 === 0);
  const rightModels = models.filter((_, i) => i % 2 === 1);

  return (
    <section id="models" className="py-8 md:py-12 lg:py-16">
      <Container>
        <div className="flex flex-col gap-8 md:gap-12">
          <div className="flex flex-col gap-6 md:gap-12">
            <h2 className="text-[32px] leading-9 md:text-[42px] md:leading-[46px] font-normal tracking-[-0.01em] text-text-main">
              Описание моделей
            </h2>

            <DataFilter
              filters={typeFilters}
              values={filterValues}
              onChange={(key, value) => setFilterValues((prev) => ({ ...prev, [key]: value }))}
            />
          </div>

          {loading ? (
            <p className="text-sm text-text-sub py-8">Загрузка...</p>
          ) : models.length === 0 ? (
            <p className="text-sm text-text-sub py-8">Нет рекомендуемых моделей</p>
          ) : (
            <>
              {/* Mobile: single column */}
              <div className="flex flex-col gap-8 lg:hidden">
                {models.map((model) => (
                  <ModelCard key={model.id} model={model} />
                ))}
              </div>

              {/* Desktop: staggered 2-col */}
              <div className="hidden lg:grid grid-cols-2 gap-x-14">
                <div className="flex flex-col gap-16">
                  {leftModels.map((model) => (
                    <ModelCard key={model.id} model={model} />
                  ))}
                </div>
                <div className="flex flex-col gap-16 lg:mt-[350px]">
                  {rightModels.map((model) => (
                    <ModelCard key={model.id} model={model} />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </Container>
    </section>
  );
}
