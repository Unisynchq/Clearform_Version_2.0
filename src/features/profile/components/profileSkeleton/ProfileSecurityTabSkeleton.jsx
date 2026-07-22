import {
  SkBar,
  SkBlock,
  SkCard,
  SkFieldColumn,
  SkFooterActions,
} from '@/features/profile/components/profileSkeleton/ProfileSkeletonPrimitives';

const SessionRowSkeleton = ({ bordered }) => (
  <div
    className={`flex items-center gap-3 px-7 py-4 ${bordered ? 'border-b border-[#f0f0ee]' : ''}`}
  >
    <SkBlock className="size-8 shrink-0 rounded-[8px]" />
    <div className="min-w-0 flex-1">
      <SkBar className="h-3 w-[190px]" />
      <SkBar className="mt-2 h-2.5 w-[130px]" />
    </div>
    <SkBar className="h-2.5 w-[70px]" />
  </div>
);

const ProfileSecurityTabSkeleton = () => (
  <div className="flex flex-col gap-5">
    <SkCard>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#f0f0ee] px-7 pb-5 pt-7">
        <div>
          <SkBar className="h-3.5 w-[62px]" />
          <SkBar className="mt-2 h-2.5 w-[280px]" />
        </div>
        <SkBar className="h-5 w-[60px]" />
      </div>

      <div className="flex flex-col gap-5 p-7">
        <SkFieldColumn labelWidth="w-[110px]" />

        <div className="grid gap-4 lg:grid-cols-2">
          <SkFieldColumn labelWidth="w-[90px]" />
          <SkFieldColumn labelWidth="w-[130px]" />
        </div>

        <div className="flex gap-2 pt-1">
          {[0, 1, 2, 3].map((i) => (
            <SkBar
              key={i}
              className={`h-[3px] flex-1 max-w-[110px] ${i === 3 ? 'opacity-40' : ''}`}
            />
          ))}
        </div>
        <SkBar className="h-2.5 w-[80px]" />
      </div>

      <SkFooterActions />
    </SkCard>

    <SkCard>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#f0f0ee] px-7 pb-5 pt-7">
        <div>
          <SkBar className="h-3.5 w-[98px]" />
          <SkBar className="mt-2 h-2.5 w-[240px]" />
        </div>
        <SkBar className="h-8 w-[160px]" />
      </div>

      <SessionRowSkeleton bordered />
      <SessionRowSkeleton bordered />
      <SessionRowSkeleton />
    </SkCard>
  </div>
);

export default ProfileSecurityTabSkeleton;
