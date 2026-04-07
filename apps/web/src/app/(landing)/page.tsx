import { Suspense } from 'react';
import type { Metadata } from 'next';
import { SkeletonBlock } from '@asko/ui';
import { HeroSection } from '@/components/landing/sections/hero';
import { AdvantagesSection } from '@/components/landing/sections/advantages';
import { ServicesSection } from '@/components/landing/sections/services';
import { PersonalAccountSection } from '@/components/landing/sections/personal-account';
import { AboutSection } from '@/components/landing/sections/about';
import { StoreBannerSection } from '@/components/landing/sections/store-banner';
import { ModelsSection } from '@/components/landing/sections/models';
import { VipSection } from '@/components/landing/sections/vip-section';
import { ArticlesSection } from '@/components/landing/sections/articles';
import { CtaSection } from '@/components/landing/sections/cta-section';
import { FaqSection } from '@/components/landing/sections/faq';

function SectionSkeleton() {
  return (
    <div className="py-16">
      <div className="max-w-[1200px] mx-auto px-4">
        <SkeletonBlock className="h-8 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[0, 1, 2].map((i) => (
            <SkeletonBlock key={i} className="h-64" />
          ))}
        </div>
      </div>
    </div>
  );
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://askoservis.ru';

export const metadata: Metadata = {
  title: 'ASKO — Профессиональный ремонт бытовой техники на дому',
  description:
    'Ремонт стиральных, сушильных, посудомоечных машин, духовых шкафов и другой техники ASKO с выездом на дом. Оригинальные запчасти, опытные мастера, гарантия на все виды работ.',
  keywords: [
    'ремонт ASKO',
    'ремонт бытовой техники',
    'ремонт стиральных машин ASKO',
    'ремонт посудомоечных машин ASKO',
    'ремонт духовых шкафов ASKO',
    'ремонт сушильных машин ASKO',
    'ремонт холодильников ASKO',
    'сервис ASKO',
    'мастер ASKO на дом',
    'оригинальные запчасти ASKO',
  ],
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: 'ASKO — Профессиональный ремонт бытовой техники на дому',
    description:
      'Оригинальные запчасти, опытные мастера, гарантия на все виды работ. Вызов мастера на дом.',
    url: SITE_URL,
    siteName: 'ASKO Сервис',
    locale: 'ru_RU',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/images/og-landing.jpg`,
        width: 1200,
        height: 630,
        alt: 'ASKO — Ремонт бытовой техники',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ASKO — Ремонт бытовой техники на дому',
    description:
      'Оригинальные запчасти, опытные мастера, гарантия. Вызов мастера на дом.',
    images: [`${SITE_URL}/images/og-landing.jpg`],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'LocalBusiness',
      '@id': `${SITE_URL}/#business`,
      name: 'ASKO Сервис',
      description:
        'Профессиональный ремонт бытовой техники ASKO с выездом на дом. Оригинальные запчасти и гарантия.',
      url: SITE_URL,
      telephone: '+7 (495) 000-00-00',
      priceRange: '₽₽',
      image: `${SITE_URL}/images/og-landing.jpg`,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Москва',
        addressCountry: 'RU',
      },
      serviceArea: {
        '@type': 'GeoCircle',
        geoMidpoint: { '@type': 'GeoCoordinates', latitude: 55.7558, longitude: 37.6173 },
        geoRadius: '50000',
      },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Услуги ремонта',
        itemListElement: [
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Ремонт стиральных машин ASKO' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Ремонт сушильных машин ASKO' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Ремонт посудомоечных машин ASKO' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Ремонт духовых шкафов ASKO' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Ремонт холодильников ASKO' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Ремонт варочных панелей ASKO' } },
        ],
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'ASKO Сервис',
      publisher: { '@id': `${SITE_URL}/#business` },
      inLanguage: 'ru-RU',
    },
  ],
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Сколько стоит ремонт техники?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Стоимость зависит от типа неисправности и модели техники. После диагностики мастер озвучит точную цену до начала работ. Диагностика бесплатна при последующем ремонте.',
      },
    },
    {
      '@type': 'Question',
      name: 'Используете ли вы оригинальные запчасти?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Да, мы используем только оригинальные комплектующие ASKO и проверенные детали от производителя. Это гарантирует полную совместимость, стабильную работу техники и длительный срок службы после ремонта.',
      },
    },
    {
      '@type': 'Question',
      name: 'Сколько времени занимает ремонт?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Большинство ремонтов выполняется за один визит мастера и занимает от 1 до 3 часов. В редких случаях, когда требуется заказ запчастей, срок может увеличиться до нескольких дней.',
      },
    },
    {
      '@type': 'Question',
      name: 'Предоставляете ли вы гарантию на ремонт?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Да, на все выполненные работы и установленные запчасти предоставляется гарантия. Срок гарантии зависит от вида ремонта и указывается в акте выполненных работ.',
      },
    },
    {
      '@type': 'Question',
      name: 'Можно ли вызвать мастера на дом?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Да, мы выполняем ремонт с выездом на дом. Мастер приедет в удобное для вас время с необходимыми инструментами и запчастями. Вы можете оставить заявку через форму на сайте или по телефону.',
      },
    },
    {
      '@type': 'Question',
      name: 'Какие бренды техники вы ремонтируете?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Мы специализируемся на ремонте бытовой техники ASKO — стиральных и сушильных машин, посудомоечных машин, духовых шкафов, варочных панелей, холодильников, морозильников и вытяжек.',
      },
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <HeroSection />
      <AdvantagesSection />
      <ServicesSection />
      <PersonalAccountSection />
      <AboutSection />
      <StoreBannerSection />
      <Suspense fallback={<SectionSkeleton />}>
        <ModelsSection />
      </Suspense>
      <VipSection />
      <Suspense fallback={<SectionSkeleton />}>
        <ArticlesSection />
      </Suspense>
      <CtaSection />
      <FaqSection />
    </>
  );
}
