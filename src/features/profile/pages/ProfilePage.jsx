import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  RiCheckLine,
  RiAlertLine,
  RiUserLine,
  RiArrowDownSLine,
} from 'react-icons/ri';
import Topbar from '@/components/layout/Topbar';
import ConfirmActionModal from '@/components/ui/ConfirmActionModal';
import DiscardChangesModal from '@/features/profile/components/DiscardChangesModal';
import ProfileFieldError from '@/features/profile/components/ProfileFieldError';
import PhotoUploadErrorZone, {
  PhotoAvatarError,
} from '@/features/profile/components/PhotoUploadErrorZone';
import { logout, loginSuccess } from '@/store/slices/authSlice';
import { deleteAccount as deleteAccountOnServer, updateMe } from '@/api/services/authMeService';
import { isApiConfigured } from '@/config/env';
import { signOutUser } from '@/features/auth/services/firebaseAuthService';
import { upsertUserAccount } from '@/features/auth/utils/userAccountsStorage';
import {
  readProfileSettings,
  writeProfileSettings,
} from '@/features/profile/utils/profileSettingsStorage';
import {
  validateDisplayName,
  validateProfileEmail,
  validatePhotoFile,
} from '@/features/profile/utils/profileValidation';
import { useToast } from '@/hooks/useToast';
import { dispatchSyncSystemAlerts } from '@/utils/syncSystemAlertsToStore';
import { store } from '@/store/store';
import ProfileSecurityPanel from '@/features/profile/components/ProfileSecurityPanel';
import ProfileNotificationsPanel from '@/features/profile/components/ProfileNotificationsPanel';
import ProfileIntegrationsPanel from '@/features/profile/components/ProfileIntegrationsPanel';
import ProfileBillingPanel from '@/features/profile/components/ProfileBillingPanel';
import ProfileTabLoadingSkeleton from '@/features/profile/components/profileSkeleton/ProfileTabLoadingSkeleton';
import ExportReportModal from '@/features/profile/components/ExportReportModal';

const pageEase = [0.25, 0.1, 0.25, 1];
const PROFILE_TAB_LOAD_MS = 280;

const PROFILE_TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'security', label: 'Security' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'billing', label: 'Billing' },
];

const TAB_META = {
  profile: {
    title: 'Profile',
    subtitle: 'Manage your personal information and preferences',
  },
  security: {
    title: 'Security',
    subtitle: 'Manage your password, two-factor authentication, and active sessions',
  },
  notifications: {
    title: 'Notifications',
    subtitle: 'Choose what you hear about and how you hear about it',
  },
  integrations: {
    title: 'Integrations',
    subtitle: 'Connect Clearform with the tools your team already uses',
  },
  billing: {
    title: 'Billing',
    subtitle: 'Checkout your plans and invoices',
  },
};

const IMPLEMENTED_TABS = new Set([
  'profile',
  'security',
  'notifications',
  'integrations',
  'billing',
]);

const TIMEZONES = [
  { value: 'UTC', label: 'UTC+00:00 — Coordinated Universal Time' },
  { value: 'America/New_York', label: 'UTC-05:00 — Eastern Time' },
  { value: 'America/Los_Angeles', label: 'UTC-08:00 — Pacific Time' },
  { value: 'Europe/London', label: 'UTC+00:00 — London' },
  { value: 'Asia/Tokyo', label: 'UTC+09:00 — Tokyo' },
];

const inputClass =
  'w-full rounded-[6px] border border-[#e8e8e6] bg-white px-[13px] py-[10px] text-[13.5px] text-[#1a1a18] outline-none transition-colors placeholder:text-[#9e9e9a] focus:border-[#1a1a18]';

const inputErrorClass =
  'w-full rounded-[6px] border-[1.6px] border-[#fc8181] bg-white px-[14px] py-[10px] text-[14px] text-[#1a1a18] outline-none transition-colors placeholder:text-[#9e9e9a]';

const selectClass =
  'w-full appearance-none rounded-[6px] border border-[#e8e8e6] bg-white px-[13px] py-[10px] pr-9 text-[13.5px] text-[#1a1a18] outline-none transition-colors focus:border-[#1a1a18]';

const outlineBtnClass =
  'rounded-[6px] border border-[#e8e8e6] bg-white px-[15px] py-[7px] text-[13px] font-medium text-[#1a1a18] hover:bg-[#f7f7f6] transition-colors';

const ghostBtnClass =
  'rounded-[6px] px-[15px] py-[7px] text-[13px] font-medium text-[#6b6b68] hover:bg-[#f7f7f6] transition-colors';

function splitDisplayName(name) {
  const trimmed = name.trim();
  if (!trimmed) return { firstName: '', lastName: '' };
  const parts = trimmed.split(/\s+/);
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  };
}

function getInitials(displayName, email) {
  const fromName = displayName?.trim();
  if (fromName) return fromName.slice(0, 2).toUpperCase();
  const local = email?.split('@')[0]?.trim();
  if (local) return local.slice(0, 2).toUpperCase();
  return '?';
}

const GoogleBadge = () => (
  <span
    className="absolute -bottom-0.5 -right-0.5 flex size-[22px] items-center justify-center rounded-full border-2 border-white bg-white shadow-sm"
    aria-hidden
  >
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  </span>
);

const ProfileTab = ({ active, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative pb-[11px] pt-[9px] text-[14px] font-medium transition-colors duration-200 ${
      active ? 'text-[#1a1a18]' : 'text-[#9e9e9a] hover:text-[#6b6b68]'
    }`}
  >
    {active ? (
      <motion.span
        layoutId="profile-active-tab"
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className="absolute inset-x-0 bottom-0 h-[1.6px] bg-[#1a1a18]"
        aria-hidden
      />
    ) : null}
    <span className="relative z-10">{label}</span>
  </button>
);

const FieldLabel = ({ children, required, optional }) => (
  <label className="text-[13px] font-medium text-[#1a1a18]">
    {children}
    {required ? <span className="text-[#c53030]"> *</span> : null}
    {optional ? (
      <span className="font-normal text-[#9e9e9a]"> optional</span>
    ) : null}
  </label>
);

const DangerRow = ({ title, description, actionLabel, actionClass = outlineBtnClass, onAction }) => (
  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#fee2e2] px-7 py-[18px] first:border-t-0">
    <div className="min-w-0 flex-1">
      <p className="text-[13.5px] font-medium text-[#1a1a18]">{title}</p>
      <p className="mt-0.5 text-[12.5px] text-[#6b6b68]">{description}</p>
    </div>
    <button type="button" onClick={onAction} className={`shrink-0 ${actionClass}`}>
      {actionLabel}
    </button>
  </div>
);

const ProfilePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const { email } = useSelector((s) => s.auth);

  const saved = useMemo(() => readProfileSettings(email), [email]);

  const paramTab = searchParams.get('tab');
  const activeTab = IMPLEMENTED_TABS.has(paramTab) ? paramTab : 'profile';
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [photoUrl, setPhotoUrl] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [pendingTab, setPendingTab] = useState(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tabContentLoading, setTabContentLoading] = useState(true);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [photoUploadError, setPhotoUploadError] = useState(null);

  const fileInputRef = useRef(null);
  const visitedTabsRef = useRef(new Set());
  const [profileBaseline, setProfileBaseline] = useState(null);

  const hydrateFromStore = useCallback(() => {
    const display = saved?.displayName?.trim() ?? '';
    const baseline = {
      displayName: display,
      username: saved?.username ?? '',
      profileEmail: saved?.email ?? email ?? '',
      timezone: saved?.timezone ?? 'UTC',
      photoUrl: saved?.photoUrl ?? null,
    };
    setDisplayName(display);
    setUsername(baseline.username);
    setProfileEmail(baseline.profileEmail);
    setTimezone(baseline.timezone);
    setPhotoUrl(baseline.photoUrl);
    setProfileBaseline(baseline);
  }, [email, saved]);

  useEffect(() => {
    hydrateFromStore();
  }, [hydrateFromStore]);

  useEffect(() => {
    if (!IMPLEMENTED_TABS.has(activeTab)) {
      setTabContentLoading(false);
      return;
    }
    if (visitedTabsRef.current.has(activeTab)) {
      setTabContentLoading(false);
      return;
    }
    setTabContentLoading(true);
    const timer = window.setTimeout(() => {
      visitedTabsRef.current.add(activeTab);
      setTabContentLoading(false);
    }, PROFILE_TAB_LOAD_MS);
    return () => clearTimeout(timer);
  }, [activeTab]);

  /** Figma 2439:3698 — empty profile until user saves a display name in settings. */
  const isIncomplete = !saved?.displayName?.trim();
  const emailVerified = Boolean(profileEmail.trim());
  const hasChanges = useMemo(() => {
    if (!profileBaseline) return false;
    return (
      displayName !== profileBaseline.displayName ||
      username !== profileBaseline.username ||
      profileEmail !== profileBaseline.profileEmail ||
      timezone !== profileBaseline.timezone ||
      photoUrl !== profileBaseline.photoUrl
    );
  }, [displayName, username, profileEmail, timezone, photoUrl, profileBaseline]);

  const canSave = hasChanges && displayName.trim().length > 0;

  const initials = getInitials(displayName, profileEmail || email);
  const avatarColor = photoUrl ? null : '#7c3aed';

  const applyTabChange = (tabId) => {
    const next = new URLSearchParams(searchParams);
    if (tabId === 'profile') next.delete('tab');
    else next.set('tab', tabId);
    setSearchParams(next, { replace: true });
  };

  const handleTabClick = (tabId) => {
    if (!IMPLEMENTED_TABS.has(tabId)) {
      showToast({ type: 'info', message: 'This section is coming soon.', duration: 2200 });
      return;
    }
    if (activeTab === 'profile' && hasChanges && tabId !== 'profile') {
      setPendingTab(tabId);
      setDiscardOpen(true);
      return;
    }
    applyTabChange(tabId);
  };

  const pageMeta = TAB_META[activeTab] ?? TAB_META.profile;

  const defaultExportReportName = useMemo(() => {
    const name = displayName.trim();
    if (name) return `${name} — Account Export`;
    return 'Clearform Account Export';
  }, [displayName]);

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uploadError = validatePhotoFile(file);
    if (uploadError) {
      setPhotoUploadError(uploadError);
      e.target.value = '';
      return;
    }
    setPhotoUploadError(null);
    const reader = new FileReader();
    reader.onload = () => setPhotoUrl(reader.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDiscardRequest = () => {
    if (!hasChanges) return;
    setDiscardOpen(true);
  };

  const handleDiscardConfirm = () => {
    setDiscardOpen(false);
    setPendingTab(null);
    setSubmitAttempted(false);
    setFieldErrors({});
    setPhotoUploadError(null);
    hydrateFromStore();
  };

  const handleKeepEditing = () => {
    setDiscardOpen(false);
    setPendingTab(null);
  };

  const handleDiscardAndLeaveTab = () => {
    const nextTab = pendingTab;
    handleDiscardConfirm();
    if (nextTab) applyTabChange(nextTab);
  };

  const handleSave = async () => {
    if (!canSave) return;
    setSubmitAttempted(true);
    const nextErrors = {
      displayName: validateDisplayName(displayName),
      profileEmail: validateProfileEmail(profileEmail, email),
    };
    setFieldErrors(nextErrors);
    if (nextErrors.displayName || nextErrors.profileEmail) return;

    setIsSaving(true);

    const trimmedDisplayName = displayName.trim();
    const trimmedUsername = username.trim();
    const trimmedProfileEmail = profileEmail.trim();
    const { firstName: fn, lastName: ln } = splitDisplayName(trimmedDisplayName);

    try {
      if (isApiConfigured()) {
        await updateMe({
          displayName: trimmedDisplayName,
          username: trimmedUsername,
          email: trimmedProfileEmail,
          language: 'English',
          timezone,
          photoUrl: photoUrl || null,
          firstName: fn,
          lastName: ln,
        });
      }

      writeProfileSettings(email, {
        displayName: trimmedDisplayName,
        username: trimmedUsername,
        email: trimmedProfileEmail,
        language: 'English',
        timezone,
        photoUrl,
      });
      upsertUserAccount({ email, firstName: fn, lastName: ln });

      dispatch(loginSuccess({ email, firstName: fn, lastName: ln }));

      const nextBaseline = {
        displayName: trimmedDisplayName,
        username: trimmedUsername,
        profileEmail: trimmedProfileEmail,
        timezone,
        photoUrl,
      };
      setDisplayName(trimmedDisplayName);
      setUsername(trimmedUsername);
      setProfileEmail(trimmedProfileEmail);
      setProfileBaseline(nextBaseline);

      setSubmitAttempted(false);
      setFieldErrors({});
      setPhotoUploadError(null);
      dispatchSyncSystemAlerts(dispatch, store.getState());
      showToast({ type: 'success', message: 'Profile saved.', duration: 2200 });
    } catch (err) {
      showToast({
        type: 'error',
        message: err?.message ?? 'Could not save your profile. Please try again.',
        duration: 3200,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = () => {
    dispatch(logout());
    signOutUser();
    navigate('/signin');
  };

  const handleDeleteAccount = async () => {
    setDeleteOpen(false);
    if (!isApiConfigured()) {
      showToast({
        type: 'info',
        message: 'Account deletion requires a connected API.',
        duration: 2800,
      });
      return;
    }
    try {
      await deleteAccountOnServer();
      dispatch(logout());
      signOutUser();
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('clearform:auth-token');
      }
      showToast({ type: 'success', message: 'Your account has been deleted.', duration: 2800 });
      navigate('/signin');
    } catch (err) {
      showToast({
        type: 'error',
        message: err?.message ?? 'Could not delete your account. Please try again.',
        duration: 3200,
      });
    }
  };

  return (
    <>
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f5f4f0]">
        <Topbar
          title={
            activeTab === 'profile' ? 'Profile' : `Profile > ${pageMeta.title}`
          }
          useFormsLoading={false}
        />

        <nav
          className="flex shrink-0 gap-8 border-b border-[#e8e8e6] bg-[#f5f4f0] px-8"
          aria-label="Profile settings sections"
        >
          {PROFILE_TABS.map((tab) => (
            <ProfileTab
              key={tab.id}
              label={tab.label}
              active={activeTab === tab.id}
              onClick={() => handleTabClick(tab.id)}
            />
          ))}
        </nav>

        <div className="flex-1 min-h-0 overflow-y-auto px-8 py-8">
          <div className="mx-auto w-full max-w-[1150px]">
            <AnimatePresence mode="wait">
              {tabContentLoading && IMPLEMENTED_TABS.has(activeTab) ? (
                <motion.div
                  key={`skel-${activeTab}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18, ease: pageEase }}
                >
                  <ProfileTabLoadingSkeleton tab={activeTab} />
                </motion.div>
              ) : (
                <motion.div
                  key={`content-${activeTab}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.24, ease: pageEase }}
                  className="flex flex-col gap-8"
                >
            {activeTab !== 'profile' ? (
              <header>
                <h1 className="text-[22px] font-semibold tracking-[-0.4px] text-[#1a1a18]">
                  {pageMeta.title}
                </h1>
                <p className="mt-0.5 text-[13.5px] text-[#6b6b68]">{pageMeta.subtitle}</p>
              </header>
            ) : null}

            {activeTab === 'profile' && isIncomplete ? (
              <div
                className="flex gap-3 rounded-[8px] border border-[#fde68a] bg-[#fffbeb] px-4 py-4"
                role="status"
              >
                <RiAlertLine className="mt-0.5 size-5 shrink-0 text-[#d97706]" aria-hidden />
                <div>
                  <p className="text-[14px] font-semibold text-[#d97706]">Complete your profile</p>
                  <p className="mt-1 text-[13px] leading-[19.5px] text-[#d97706]">
                    Add your name and photo so teammates can recognise you in shared views and
                    exports.
                  </p>
                </div>
              </div>
            ) : null}

            {activeTab === 'security' ? (
              <ProfileSecurityPanel email={email} profileEmail={profileEmail} />
            ) : null}

            {activeTab === 'notifications' ? (
              <ProfileNotificationsPanel email={email} />
            ) : null}

            {activeTab === 'integrations' ? <ProfileIntegrationsPanel /> : null}

            {activeTab === 'billing' ? <ProfileBillingPanel /> : null}

            {activeTab === 'profile' ? (
              <>
            {/* Account Information */}
            <section className="overflow-hidden rounded-[12px] border border-[#e8e8e6] bg-white">
              <div className="border-b border-[#f0f0ee] px-7 pb-[18px] pt-[22px]">
                <h2 className="text-[14px] font-semibold tracking-[-0.2px] text-[#1a1a18]">
                  Account Information
                </h2>
                <p className="mt-0.5 text-[12.5px] text-[#9e9e9a]">
                  Used in emails, exports, and shared views
                </p>
              </div>

              <div className="flex flex-col gap-[26px] p-7">
                {/* Photo row */}
                <div className="flex flex-col gap-5">
                  <div className="flex flex-wrap items-start gap-5">
                    <div className="relative shrink-0">
                      {photoUploadError ? (
                        <PhotoAvatarError />
                      ) : photoUrl ? (
                        <img
                          src={photoUrl}
                          alt=""
                          className="size-16 rounded-full border-2 border-[#e8e8e6] object-cover"
                        />
                      ) : (
                        <div
                          className={`flex items-center justify-center rounded-full border border-[#e8e8e6] text-[22px] font-semibold text-white ${
                            isIncomplete ? 'size-[72px] bg-[#f7f7f6]' : 'size-16'
                          }`}
                          style={isIncomplete ? undefined : { backgroundColor: avatarColor }}
                        >
                          {isIncomplete ? (
                            <RiUserLine className="text-[#9e9e9a]" size={32} aria-hidden />
                          ) : (
                            initials.charAt(0)
                          )}
                        </div>
                      )}
                      {!photoUploadError && !isIncomplete && emailVerified ? (
                        <GoogleBadge />
                      ) : null}
                    </div>

                    <div className="flex min-w-0 flex-col gap-1.5">
                      <p className="text-[13px] font-medium text-[#1a1a18]">
                        Profile photo
                        {isIncomplete ? (
                          <span className="font-normal text-[#9e9e9a]"> optional</span>
                        ) : null}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <button
                          type="button"
                          className={outlineBtnClass}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {photoUploadError
                            ? 'Try Again'
                            : photoUrl || !isIncomplete
                              ? 'Change photo'
                              : 'Upload photo'}
                        </button>
                        {photoUrl && !photoUploadError ? (
                          <button
                            type="button"
                            className={ghostBtnClass}
                            onClick={() => {
                              setPhotoUrl(null);
                              setPhotoUploadError(null);
                            }}
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                      <p className="text-[12px] text-[#9e9e9a]">
                        JPG, GIF or PNG. Max size 2MB.
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif"
                        className="hidden"
                        onChange={handlePhotoSelect}
                      />
                    </div>
                  </div>

                  {photoUploadError ? (
                    <PhotoUploadErrorZone
                      title={photoUploadError.title}
                      detail={photoUploadError.detail}
                    />
                  ) : null}
                </div>

                {/* Form grid */}
                <div className="grid grid-cols-1 gap-x-7 gap-y-5 md:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel required>
                      Display name
                    </FieldLabel>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => {
                        setDisplayName(e.target.value);
                        if (fieldErrors.displayName) {
                          setFieldErrors((prev) => ({ ...prev, displayName: null }));
                        }
                      }}
                      placeholder="e.g. Alex Johnson"
                      className={
                        submitAttempted && fieldErrors.displayName
                          ? inputErrorClass
                          : inputClass
                      }
                      aria-invalid={fieldErrors.displayName ? 'true' : undefined}
                    />
                    {submitAttempted && fieldErrors.displayName ? (
                      <ProfileFieldError message={fieldErrors.displayName} />
                    ) : (
                      <p className="pt-0.5 text-[12px] text-[#9e9e9a]">
                        {isIncomplete
                          ? 'Required to save your profile'
                          : 'Shown in shared forms and exports'}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <FieldLabel optional>Username</FieldLabel>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="@username"
                      className={inputClass}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <FieldLabel>Email address</FieldLabel>
                    <div className="relative">
                      <input
                        type="email"
                        value={profileEmail}
                        onChange={(e) => {
                          setProfileEmail(e.target.value);
                          if (fieldErrors.profileEmail) {
                            setFieldErrors((prev) => ({ ...prev, profileEmail: null }));
                          }
                        }}
                        placeholder="you@example.com"
                        className={`${
                          submitAttempted && fieldErrors.profileEmail
                            ? inputErrorClass
                            : inputClass
                        } ${emailVerified && !fieldErrors.profileEmail ? 'pr-24' : ''}`}
                        aria-invalid={fieldErrors.profileEmail ? 'true' : undefined}
                      />
                      {emailVerified && !fieldErrors.profileEmail ? (
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-[4px] bg-[#f0fff4] px-2 py-[3px] text-[11.5px] font-medium text-[#2e7d52]">
                          Verified
                        </span>
                      ) : null}
                    </div>
                    {submitAttempted && fieldErrors.profileEmail ? (
                      <ProfileFieldError message={fieldErrors.profileEmail} />
                    ) : (
                      <p className="pt-0.5 text-[12px] text-[#9e9e9a]">
                        Used for login and notifications
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Timezone</FieldLabel>
                    <div className="relative">
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className={selectClass}
                      >
                        {TIMEZONES.map((tz) => (
                          <option key={tz.value} value={tz.value}>
                            {tz.label}
                          </option>
                        ))}
                      </select>
                      <RiArrowDownSLine
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9e9e9a]"
                        size={16}
                        aria-hidden
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[#f0f0ee] pt-6">
                  <button
                    type="button"
                    onClick={handleDiscardRequest}
                    disabled={!hasChanges}
                    className={`${ghostBtnClass} disabled:opacity-40 disabled:pointer-events-none`}
                  >
                    Discard changes
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={!canSave || isSaving}
                    className={`inline-flex items-center gap-1.5 rounded-[6px] px-5 py-[9px] text-[13.5px] font-medium text-white transition-colors ${
                      canSave
                        ? 'bg-[#1a1a18] hover:bg-[#2d2d2b]'
                        : 'bg-[#6b6b68] cursor-not-allowed'
                    }`}
                  >
                    <RiCheckLine size={14} aria-hidden />
                    {isSaving ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </div>
            </section>

            {/* Danger Zone */}
            <section className="overflow-hidden rounded-[14px] border border-[#fed7d7] bg-white">
              <div className="border-b border-[#fee2e2] px-7 pb-[19px] pt-[22px]">
                <h2 className="text-[14px] font-semibold tracking-[-0.2px] text-[#c53030]">
                  Danger Zone
                </h2>
                <p className="mt-0.5 text-[12.5px] text-[#9e9e9a]">
                  These actions are irreversible — proceed with caution
                </p>
              </div>

              <DangerRow
                title="Export all data"
                description="Download a full archive of your responses, forms, and account activity"
                actionLabel="Export data"
                onAction={() => setExportModalOpen(true)}
              />
              <DangerRow
                title="Sign out"
                description="You are currently signed in on this device via Google · Last active just now"
                actionLabel="Sign Out"
                onAction={handleSignOut}
              />
              <DangerRow
                title="Delete account"
                description="Permanently remove your account and all associated data from Clearform"
                actionLabel="Delete account"
                actionClass="rounded-[6px] border border-[#fecdcd] bg-[#fff5f5] px-[17px] py-[10px] text-[13px] font-medium text-[#c53030] hover:bg-[#fee2e2] transition-colors"
                onAction={() => setDeleteOpen(true)}
              />
            </section>
              </>
            ) : null}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <ExportReportModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        defaultReportName={defaultExportReportName}
      />

      <DiscardChangesModal
        open={discardOpen}
        onKeepEditing={handleKeepEditing}
        onDiscard={pendingTab ? handleDiscardAndLeaveTab : handleDiscardConfirm}
      />

      <ConfirmActionModal
        open={deleteOpen}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Delete account?"
        warning="This will permanently remove your account and all associated data. This action cannot be undone."
        confirmLabel="Delete account"
        confirmClassName="bg-[#c53030] text-white hover:bg-[#9b2c2c]"
      />
    </>
  );
};

export default ProfilePage;
