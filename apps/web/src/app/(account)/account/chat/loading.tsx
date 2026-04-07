import { SkeletonBlock } from '@asko/ui';

export default function ChatLoading() {
  return (
    <div className="flex-1 min-h-0 flex flex-col lg:flex-initial lg:p-8 lg:gap-8">
      <SkeletonBlock className="h-8 w-32 hidden lg:block" />
      <SkeletonBlock className="flex-1 lg:flex-none lg:h-[calc(100vh-180px)] w-full" />
    </div>
  );
}
