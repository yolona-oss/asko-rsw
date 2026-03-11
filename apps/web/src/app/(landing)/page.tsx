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

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <AdvantagesSection />
      <ServicesSection />
      <PersonalAccountSection />
      <AboutSection />
      <StoreBannerSection />
      <ModelsSection />
      <VipSection />
      <ArticlesSection />
      <CtaSection />
      <FaqSection />
    </>
  );
}
