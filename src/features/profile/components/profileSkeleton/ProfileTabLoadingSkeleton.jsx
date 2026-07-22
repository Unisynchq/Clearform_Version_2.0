import ProfileProfileTabSkeleton from '@/features/profile/components/profileSkeleton/ProfileProfileTabSkeleton';
import ProfileSecurityTabSkeleton from '@/features/profile/components/profileSkeleton/ProfileSecurityTabSkeleton';
import ProfileNotificationsTabSkeleton from '@/features/profile/components/profileSkeleton/ProfileNotificationsTabSkeleton';
import ProfileIntegrationsTabSkeleton from '@/features/profile/components/profileSkeleton/ProfileIntegrationsTabSkeleton';
import ProfileBillingTabSkeleton from '@/features/profile/components/profileSkeleton/ProfileBillingTabSkeleton';

const SKELETON_BY_TAB = {
  profile: ProfileProfileTabSkeleton,
  security: ProfileSecurityTabSkeleton,
  notifications: ProfileNotificationsTabSkeleton,
  integrations: ProfileIntegrationsTabSkeleton,
  billing: ProfileBillingTabSkeleton,
};

const ProfileTabLoadingSkeleton = ({ tab }) => {
  const Skeleton = SKELETON_BY_TAB[tab];
  if (!Skeleton) return null;
  return <Skeleton />;
};

export default ProfileTabLoadingSkeleton;
