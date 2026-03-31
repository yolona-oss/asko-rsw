import type { MetadataRoute } from 'next';
import { fetchArticles } from '@/lib/api/article.server';
import { fetchDevices } from '@/lib/api/device.server';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://askoservis.ru';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articlesData, devicesData] = await Promise.all([
    fetchArticles(1, 1000),
    fetchDevices(1, 1000),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/articles`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/devices`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  const articlePages: MetadataRoute.Sitemap = (articlesData.data ?? []).map((article) => ({
    url: `${SITE_URL}/articles/${article.slug}`,
    lastModified: new Date(article.updatedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const devicePages: MetadataRoute.Sitemap = (devicesData.data ?? []).map((device) => ({
    url: `${SITE_URL}/devices/${device.slug}`,
    lastModified: new Date(device.updatedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...articlePages, ...devicePages];
}
