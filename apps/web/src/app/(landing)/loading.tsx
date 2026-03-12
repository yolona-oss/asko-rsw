import { SkeletonBlock, SkeletonCard } from '@/components/account/skeleton';
import { Container } from '@asko/ui';

export default function LandingLoading() {
  return (
    <>
      {/* Hero */}
      <section className="pt-8 md:pt-12 lg:pt-16">
        <Container>
          <div className="flex flex-col gap-8 md:gap-12">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-16">
              <div className="flex flex-col gap-3 flex-1">
                <SkeletonBlock className="h-10 md:h-12 lg:h-14 w-full max-w-[700px]" />
                <SkeletonBlock className="h-10 md:h-12 lg:h-14 w-full max-w-[500px]" />
              </div>
              <div className="flex flex-col gap-3 lg:max-w-[261px]">
                <SkeletonBlock className="h-4 w-full" />
                <SkeletonBlock className="h-4 w-3/4" />
                <SkeletonBlock className="h-4 w-32" />
              </div>
            </div>
            <SkeletonCard className="w-full aspect-[358/159] md:aspect-[1120/486]" />
          </div>
        </Container>
      </section>

      {/* Advantages */}
      <section className="py-8 md:py-12 lg:py-16">
        <Container>
          <div className="flex flex-col gap-2 md:grid md:grid-cols-3 md:gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2 md:gap-1">
                <SkeletonCard className="py-16 md:py-12 h-[180px] md:h-[220px]" />
                <SkeletonCard className="h-[80px]" />
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Services */}
      <section className="py-8 md:py-12 lg:py-16">
        <Container>
          <div className="flex flex-col gap-12">
            <div className="flex flex-col gap-6">
              <SkeletonBlock className="h-9 md:h-11 w-64" />
              <div className="hidden md:flex flex-wrap gap-4">
                {Array.from({ length: 7 }).map((_, i) => (
                  <SkeletonBlock key={i} className="h-10 w-40" />
                ))}
              </div>
              <SkeletonBlock className="md:hidden h-10 w-48" />
            </div>
            <div className="flex flex-col lg:flex-row items-start gap-4 lg:gap-[120px]">
              <div className="flex flex-col gap-4 lg:max-w-[357px] lg:flex-shrink-0 w-full">
                <SkeletonBlock className="h-8 w-full" />
                <SkeletonBlock className="h-4 w-full" />
                <SkeletonBlock className="h-4 w-full" />
                <SkeletonBlock className="h-4 w-2/3" />
                <SkeletonBlock className="h-10 w-40" />
              </div>
              <SkeletonCard className="w-full lg:flex-1 aspect-[358/231] lg:aspect-[643/413]" />
            </div>
          </div>
        </Container>
      </section>

      {/* About / Banner placeholder */}
      <section className="py-8 md:py-12 lg:py-16">
        <Container>
          <SkeletonCard className="h-[200px] md:h-[300px] w-full" />
        </Container>
      </section>

      {/* Models grid */}
      <section className="py-8 md:py-12 lg:py-16">
        <Container>
          <div className="flex flex-col gap-8">
            <SkeletonBlock className="h-9 md:h-11 w-72" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} className="aspect-[3/4]" />
              ))}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
