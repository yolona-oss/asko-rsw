import { SkeletonBlock, SkeletonCircle } from '@asko/ui';

export default function ProfileLoading() {
  return (
    <div className="p-4 lg:p-8 flex flex-col gap-6 lg:gap-8">
      <SkeletonBlock className="h-8 w-48" />
      <div className="bg-white border border-[#eaeaea] p-6">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <SkeletonCircle className="w-24 h-24 flex-shrink-0" />
            <div className="flex flex-col gap-2 w-full">
              <SkeletonBlock className="h-5 w-40" />
              <SkeletonBlock className="h-20 w-full max-w-md" />
            </div>
          </div>
          <div className="h-px bg-border-light" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col gap-2">
                <SkeletonBlock className="h-4 w-20" />
                <SkeletonBlock className="h-10 w-full" />
              </div>
            ))}
          </div>
          <SkeletonBlock className="h-10 w-32" />
        </div>
      </div>
    </div>
  );
}
