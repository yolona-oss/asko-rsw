import { SkeletonBlock, SkeletonCircle } from '@asko/ui';

export default function ChatLoading() {
  return (
    <div className="flex-1 min-h-0 flex flex-col lg:flex-initial lg:p-8 lg:gap-8">
      <div className="flex flex-1 min-h-0 lg:flex-none lg:h-[calc(100vh-180px)] bg-white border-y lg:border border-border-light lg:rounded-sm overflow-hidden">
        {/* Conversation list */}
        <div className="w-full lg:w-80 lg:border-r lg:border-border-light flex flex-col">
          <div className="p-3 border-b border-border-light flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <SkeletonBlock className="h-5 w-12" />
              <SkeletonBlock className="h-7 w-24" />
            </div>
            <SkeletonBlock className="h-9 w-full" />
          </div>
          <div className="flex-1 flex flex-col">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-[#edeff1] last:border-b-0">
                <SkeletonCircle className="w-10 h-10" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <SkeletonBlock className="h-4 w-28" />
                  <SkeletonBlock className="h-3 w-40" />
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Empty state */}
        <div className="hidden lg:flex flex-1 items-center justify-center">
          <SkeletonBlock className="h-5 w-52" />
        </div>
      </div>
    </div>
  );
}
