import {
  SkBar,
  SkCard,
  SkCardHeader,
  SkCircle,
  SkFieldColumn,
  SkFooterActions,
} from '@/features/profile/components/profileSkeleton/ProfileSkeletonPrimitives';

const ProfileProfileTabSkeleton = () => (
  <div className="flex flex-col gap-5">
    <SkCard>
      <SkCardHeader />
      <div className="flex flex-col gap-6 p-7">
        <div className="flex flex-col gap-3">
          <SkBar className="h-3 w-[70px]" />
          <div className="flex items-center gap-3.5">
            <SkCircle className="size-[52px]" />
            <div className="flex flex-col gap-1.5">
              <SkBar className="h-7 w-[100px]" />
              <SkBar className="h-2.5 w-[160px]" />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <SkFieldColumn labelWidth="w-[80px]" />
          <SkFieldColumn labelWidth="w-[65px]" />
        </div>

        <div className="flex flex-col gap-1.5">
          <SkBar className="h-3 w-[90px]" />
          <SkBar className="h-9 w-full" />
          <SkBar className="h-2.5 w-[170px]" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <SkFieldColumn labelWidth="w-[60px]" />
          <SkFieldColumn labelWidth="w-[65px]" />
        </div>
      </div>
      <SkFooterActions />
    </SkCard>

    <SkCard className="border-[#fed7d7]">
      <div className="border-b border-[#fee2e2] px-7 pb-5 pt-[22px]">
        <SkBar className="h-3 w-[90px]" />
        <SkBar className="mt-2 h-2.5 w-[230px]" />
      </div>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`flex flex-wrap items-center justify-between gap-4 px-7 py-[18px] ${
            i < 3 ? 'border-b border-[#fee2e2]' : ''
          }`}
        >
          <div className="min-w-0 flex-1">
            <SkBar className="h-3 w-[110px]" />
            <SkBar className="mt-2 h-2.5 w-[200px]" />
          </div>
          <SkBar className="h-8 w-[90px]" />
        </div>
      ))}
    </SkCard>
  </div>
);

export default ProfileProfileTabSkeleton;
