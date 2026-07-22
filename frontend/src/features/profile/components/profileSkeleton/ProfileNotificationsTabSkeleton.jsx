import {
  SkBar,
  SkBlock,
  SkCard,
  SkCardHeader,
  SkFooterActions,
} from '@/features/profile/components/profileSkeleton/ProfileSkeletonPrimitives';

const NotificationRowSkeleton = ({ bordered }) => (
  <div
    className={`grid grid-cols-1 gap-4 py-4 sm:grid-cols-[minmax(0,1fr)_90px_90px] sm:items-center ${
      bordered ? 'border-b border-[#f0f0ee]' : ''
    }`}
  >
    <div>
      <SkBar className="h-3 w-[130px]" />
      <SkBar className="mt-2 h-2.5 w-[210px]" />
    </div>
    <div className="flex justify-center">
      <SkBlock className="h-5 w-9 rounded-full" />
    </div>
    <div className="flex justify-center">
      <SkBlock className="h-5 w-9 rounded-full bg-[#ebebea]/80" />
    </div>
  </div>
);

const ProfileNotificationsTabSkeleton = () => (
  <SkCard>
    <SkCardHeader />

    <div className="hidden border-b border-[#e8e8e6] bg-[#f7f7f6] sm:grid sm:grid-cols-[minmax(0,1fr)_90px_90px] sm:px-7 sm:py-3">
      <SkBar className="h-3 w-[38px]" />
      <SkBar className="mx-auto h-3 w-[36px]" />
      <SkBar className="mx-auto h-3 w-[31px]" />
    </div>

    <div className="border-b border-[#f0f0ee] bg-[#f7f7f6] px-7 pb-2 pt-3">
      <SkBar className="h-3 w-[66px]" />
    </div>
    <div className="px-7">
      <NotificationRowSkeleton bordered />
      <NotificationRowSkeleton />
    </div>

    <div className="border-b border-[#f0f0ee] bg-[#f7f7f6] px-7 pb-2 pt-3">
      <SkBar className="h-3 w-[52px]" />
    </div>
    <div className="px-7">
      <NotificationRowSkeleton bordered />
      <NotificationRowSkeleton bordered />
      <NotificationRowSkeleton />
    </div>

    <div className="flex flex-wrap items-center justify-between gap-3 px-7 pb-5 pt-5">
      <SkBar className="h-8 w-[120px]" />
      <SkBar className="h-9 w-[140px] bg-gradient-to-r from-[#d0d0ce] via-[#e0e0dd] to-[#d0d0ce]" />
    </div>
  </SkCard>
);

export default ProfileNotificationsTabSkeleton;
