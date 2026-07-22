import {
  SkBar,
  SkBlock,
  SkCard,
  SkCardHeader,
} from '@/features/profile/components/profileSkeleton/ProfileSkeletonPrimitives';

const IntegrationRowSkeleton = ({ bordered }) => (
  <div
    className={`flex flex-wrap items-center gap-4 px-7 py-[18px] ${
      bordered ? 'border-b border-[#f0f0ee]' : ''
    }`}
  >
    <div className="flex min-w-0 flex-1 items-center gap-4">
      <SkBlock className="size-[42px] shrink-0 rounded-[10px]" />
      <div className="min-w-0 flex-1">
        <SkBar className="h-3.5 w-[100px]" />
        <SkBar className="mt-2 h-2.5 w-[260px] max-w-full" />
      </div>
    </div>
    <div className="flex shrink-0 flex-wrap items-center gap-2.5">
      <SkBar className="h-6 w-[88px] rounded-[4px]" />
      <SkBar className="h-8 w-[72px]" />
    </div>
  </div>
);

const ProfileIntegrationsTabSkeleton = () => (
  <SkCard>
    <SkCardHeader />
    <IntegrationRowSkeleton bordered />
    <IntegrationRowSkeleton />
    <div className="border-t border-[#f0f0ee] px-7 py-3">
      <SkBar className="h-3 w-[180px]" />
    </div>
  </SkCard>
);

export default ProfileIntegrationsTabSkeleton;
