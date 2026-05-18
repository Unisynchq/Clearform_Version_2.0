import { RiMailLine, RiSmartphoneLine } from 'react-icons/ri';
import { CardHeader, SettingsCard } from './ProfileSettingsUi';
import { SkBar, SkBlock, SkCircle, SkIconBox, SkToggle } from './ProfileSkeletonUi';

/* ── Profile tab — Figma 2477:1967 ── */
export function ProfileAccountTabSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-label="Loading profile settings">
      <SettingsCard className="border-[#e5e5e3] px-[25px] pb-[25px] pt-[33px]">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-[13.5px] font-semibold tracking-[-0.2px] text-[#1a1a18]">Account Information</h2>
          <p className="text-[12px] text-[#8c8b86]">Used in emails, exports, and shared views</p>
        </div>

        <div className="flex flex-col gap-3 pt-[18px]">
          <SkBlock className="h-3 w-[70px]" />
          <div className="flex items-center gap-[14px]">
            <SkCircle size={52} />
            <div className="flex flex-col gap-1.5">
              <SkBlock className="h-7 w-[100px]" />
              <SkBlock className="mt-1 h-2.5 w-40" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 pt-[22px] md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <SkBlock className="h-3 w-20" />
            <SkBlock className="h-9 w-full" />
            <SkBlock className="h-2.5 w-[140px]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <SkBlock className="h-3 w-[65px]" />
            <SkBlock className="h-9 w-full" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 pt-3.5">
          <SkBlock className="h-3 w-[90px]" />
          <SkBlock className="h-9 w-full" />
          <SkBlock className="h-2.5 w-[170px]" />
        </div>

        <div className="grid grid-cols-1 gap-4 pb-3.5 pt-3.5 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <SkBlock className="h-3 w-[60px]" />
            <SkBlock className="h-9 w-full" />
          </div>
          <div className="flex flex-col gap-1.5">
            <SkBlock className="h-3 w-[65px]" />
            <SkBlock className="h-9 w-full" />
          </div>
        </div>

        <div className="flex justify-end gap-2.5 border-t border-[#eeede9] pt-[21px]">
          <SkBlock className="h-8 w-[110px]" />
          <SkBar className="h-8 w-[110px] !bg-[#d0d0ce]" shimmer />
        </div>
      </SettingsCard>

      <SettingsCard className="border-[#e5e5e3]">
        <div className="border-b border-[#eeede9] px-6 pb-4 pt-[18px]">
          <SkBlock className="mb-1 h-[13px] w-[90px]" />
          <SkBlock className="h-[11px] w-[230px]" />
        </div>
        {[110, 55, 95].map((titleW, i) => (
          <div
            key={i}
            className={`flex items-center justify-between px-6 py-4 ${i < 2 ? 'border-b border-[#eeede9]' : ''}`}
          >
            <div className="flex flex-col gap-1">
              <SkBlock className="h-[13px]" style={{ width: titleW }} />
              <SkBlock className="h-[11px] w-[200px]" />
            </div>
            <SkBlock className="h-[30px] w-[70px]" />
          </div>
        ))}
      </SettingsCard>
    </div>
  );
}

/* ── Security tab — Figma 2477:2372 ── */
export function ProfileSecurityTabSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-label="Loading security settings">
      <SettingsCard className="border-[#e5e5e3]">
        <div className="flex items-start justify-between gap-4 border-b border-[#eeede9] px-6 pb-3.5 pt-8">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-[13.5px] font-semibold tracking-[-0.2px] text-[#1a1a18]">Password</h2>
            <p className="text-[12px] text-[#8c8b86]">
              Last changed 3 months ago · Choose a strong, unique password
            </p>
          </div>
          <SkBar className="h-[22px] w-[60px] rounded-[20px]" />
        </div>

        <div className="flex flex-col gap-6 px-6 pb-7 pt-6">
          <div className="flex flex-col gap-1.5">
            <SkBlock className="h-3 w-[110px]" />
            <SkBlock className="h-[38px] w-full" />
          </div>

          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <SkBlock className="h-3 w-[90px]" />
              <SkBlock className="h-[38px] w-full" />
            </div>
            <div className="flex flex-col gap-1.5">
              <SkBlock className="h-3 w-[130px]" />
              <SkBlock className="h-[38px] w-full" />
            </div>
          </div>

          <div className="flex gap-1 pt-1.5">
            {[0, 1, 2, 3].map((i) => (
              <SkBar key={i} className="h-[3px] flex-1 rounded-[2px]" shimmer={i < 3} />
            ))}
          </div>
          <SkBlock className="h-[11px] w-20" />

          <div className="flex justify-end gap-2.5 border-t border-[#eeede9] pt-[21px]">
            <SkBlock className="h-8 w-[70px]" />
            <SkBlock className="h-8 w-[120px]" />
          </div>
        </div>
      </SettingsCard>

      <SettingsCard className="border-[#e5e5e3] p-[25px]">
        <div className="flex items-start justify-between gap-4 pb-5">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-[13.5px] font-semibold tracking-[-0.2px] text-[#1a1a18]">Active sessions</h2>
            <p className="text-[12px] text-[#8c8b86]">Devices currently signed in to your Clearform account</p>
          </div>
          <SkBlock className="h-[30px] w-40" />
        </div>

        {[
          { metaW: 70, right: 'time' },
          { metaW: 80, right: 'revoke' },
          { metaW: 60, right: 'revoke' },
        ].map((row, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 py-3.5 ${i < 2 ? 'border-b border-[#eeede9]' : ''}`}
          >
            <SkIconBox />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <SkBlock className="h-[13px] w-[210px] max-w-full" />
              <SkBlock className="h-[11px] w-[150px] max-w-full" />
            </div>
            {row.right === 'time' ? (
              <SkBlock className="h-[11px] w-[70px]" />
            ) : (
              <div className="flex items-center gap-3">
                <SkBlock className="h-[11px]" style={{ width: row.metaW }} />
                <SkBlock className="h-[26px] w-[50px]" />
              </div>
            )}
          </div>
        ))}
      </SettingsCard>
    </div>
  );
}

/* ── Notifications tab — Figma 2477:2810 ── */
function NotificationSkeletonRow({ emailOn = true, pushOn = false }) {
  return (
    <div className="flex items-stretch">
      <div className="flex min-w-0 flex-1 flex-col gap-1 border-b border-[#eeede9] px-3.5 py-3.5">
        <SkBlock className="h-[13px] w-[130px]" />
        <SkBlock className="h-[11px] w-[210px] max-w-full" />
      </div>
      <div className="flex w-[90px] shrink-0 items-center justify-center border-b border-[#eeede9] px-3.5 py-[19px]">
        <SkToggle on={emailOn} />
      </div>
      <div className="flex w-[90px] shrink-0 items-center justify-center border-b border-[#eeede9] px-3.5 py-[19px]">
        <SkToggle on={pushOn} />
      </div>
    </div>
  );
}

export function ProfileNotificationsTabSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading notification settings">
      <SettingsCard className="overflow-hidden rounded-[14px] border-[#e8e8e6] pt-[13px]">
        <CardHeader
          title="Notification preferences"
          subtitle="Control which events trigger notifications and through which channels"
          titleClassName="text-[14px]"
        />

        <div className="flex h-[39px] items-center border-b border-[#e8e8e6] bg-[#f7f7f6]">
          <div className="flex flex-1 items-center px-7">
            <span className="text-[11px] font-semibold uppercase tracking-[0.66px] text-[#9e9e9a]">Event</span>
          </div>
          <div className="flex w-[90px] items-center justify-center gap-1 text-[#9e9e9a]">
            <RiMailLine size={13} aria-hidden />
            <span className="text-[11px] font-semibold uppercase tracking-[0.66px]">Email</span>
          </div>
          <div className="flex w-[90px] items-center justify-center gap-1 text-[#9e9e9a]">
            <RiSmartphoneLine size={13} aria-hidden />
            <span className="text-[11px] font-semibold uppercase tracking-[0.66px]">Push</span>
          </div>
        </div>

        <div className="border-b border-t border-[#f0f0ee] bg-[#f7f7f6] px-7 py-2.5">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.74px] text-[#9e9e9a]">
            Responses
          </span>
        </div>

        <div className="px-4">
          <NotificationSkeletonRow emailOn pushOn={false} />
          <NotificationSkeletonRow emailOn pushOn={false} />
          <NotificationSkeletonRow emailOn pushOn={false} />
        </div>

        <div className="flex items-center justify-between border-t border-[#f0f0ee] px-7 pb-5 pt-[21px]">
          <SkBlock className="h-[13px] w-[130px]" />
          <SkBlock className="h-8 w-[130px]" />
        </div>
      </SettingsCard>
    </div>
  );
}

/* ── Integrations tab — Figma 2477:3411 ── */
export function ProfileIntegrationsTabSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading integrations">
      <SettingsCard className="overflow-hidden rounded-[14px] border-[#e8e8e6] pt-[13px]">
        <CardHeader
          title="Connected apps"
          subtitle="Apps currently linked to your Clearform account"
          titleClassName="text-[14px]"
        />
        {[0, 1].map((i) => (
          <div
            key={i}
            className={`flex items-center gap-10 px-4 py-3.5 ${i === 0 ? 'border-b border-[#eeede9]' : ''}`}
          >
            <SkIconBox />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <SkBlock className="h-[13px] w-[230px] max-w-full" />
              <SkBlock className="h-[11px] w-[150px] max-w-full" />
            </div>
            <SkBlock className="h-[11px] w-[70px] shrink-0" />
          </div>
        ))}
      </SettingsCard>
    </div>
  );
}

export function ProfileTabSkeleton({ tab }) {
  switch (tab) {
    case 'security':
      return <ProfileSecurityTabSkeleton />;
    case 'notifications':
      return <ProfileNotificationsTabSkeleton />;
    case 'integrations':
      return <ProfileIntegrationsTabSkeleton />;
    default:
      return <ProfileAccountTabSkeleton />;
  }
}
