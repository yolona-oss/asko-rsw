import { LandingHeader } from '@/components/landing/header';
import { LandingFooter } from '@/components/landing/footer';

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <link rel="preload" href="/images/hero-bg.webp" as="image" type="image/webp" fetchPriority="high" />
      <LandingHeader />
      <main className="flex-1">{children}</main>
      <LandingFooter />
    </>
  );
}
