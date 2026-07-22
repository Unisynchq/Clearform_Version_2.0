import {
  SkBar,
  SkBlock,
  SkCard,
  SkCardHeader,
} from '@/features/profile/components/profileSkeleton/ProfileSkeletonPrimitives';

const UsageStatSkeleton = () => (
  <div className="flex flex-col gap-2 rounded-[10px] bg-[#f0f0ee] p-[14px]">
    <SkBar className="h-2.5 w-[88px]" />
    <SkBar className="h-5 w-[72px]" />
    <SkBar className="h-[5px] w-full rounded-[3px]" />
    <SkBar className="h-2.5 w-[120px]" />
  </div>
);

const ProfileBillingTabSkeleton = () => (
  <div className="flex flex-col gap-4">
    <SkCard>
      <SkCardHeader />
      <div className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <SkBlock className="size-10 shrink-0 rounded-[10px]" />
            <div>
              <SkBar className="h-4 w-[72px]" />
              <SkBar className="mt-2 h-3 w-[200px]" />
            </div>
          </div>
          <div className="text-right">
            <SkBar className="ml-auto h-5 w-10" />
            <SkBar className="mt-2 ml-auto h-2.5 w-16" />
          </div>
        </div>
        <SkBar className="h-px w-full" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <UsageStatSkeleton />
          <UsageStatSkeleton />
          <UsageStatSkeleton />
        </div>
      </div>
    </SkCard>
    <SkCard className="!bg-[#ece9e3]" />
    <SkCard>
      <SkCardHeader />
      <div className="flex flex-col items-center gap-3 px-5 py-8">
        <SkBlock className="size-9 rounded-full" />
        <SkBar className="h-3 w-[320px] max-w-full" />
      </div>
    </SkCard>
  </div>
);

export default ProfileBillingTabSkeleton;
