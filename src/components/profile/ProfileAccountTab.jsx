import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RiImageAddLine, RiRefreshLine } from 'react-icons/ri';
import AccountDeletionFlow from './AccountDeletionFlow';
import DeleteAccountModal from './DeleteAccountModal';
import { requestAccountDeletion } from './profileDeleteAccount';
import {
  CardHeader,
  DangerButton,
  DangerRow,
  FieldError,
  FieldHint,
  FieldLabelRequired,
  GhostButton,
  GoogleAvatarBadge,
  OutlineButton,
  ProfileBanner,
  SaveBar,
  SelectField,
  SettingsCard,
  TextInput,
} from './ProfileSettingsUi';
import {
  EMPTY_PROFILE,
  isProfileComplete,
  profileSnapshot,
  validateProfileForm,
} from './profileFormUtils';

export default function ProfileAccountTab({ onDirtyChange, onRequestDiscard }) {
  const baselineRef = useRef(profileSnapshot(EMPTY_PROFILE));
  const [values, setValues] = useState(EMPTY_PROFILE);
  const [errors, setErrors] = useState({});
  const [photoState, setPhotoState] = useState('empty');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePhase, setDeletePhase] = useState(null);
  const [modalDeleting, setModalDeleting] = useState(false);
  const deleteAbortRef = useRef(null);
  const dirty = profileSnapshot(values) !== baselineRef.current;
  const complete = isProfileComplete(values);
  const showIncompleteBanner = !complete && !dirty;

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => () => deleteAbortRef.current?.abort(), []);

  const runAccountDeletion = useCallback(() => {
    deleteAbortRef.current?.abort();
    const controller = new AbortController();
    deleteAbortRef.current = controller;
    setDeletePhase('loading');

    requestAccountDeletion({ signal: controller.signal })
      .then(() => {
        setDeletePhase('farewell');
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        setDeletePhase('error');
      })
      .finally(() => {
        setModalDeleting(false);
      });
  }, []);

  const handleConfirmDelete = () => {
    setModalDeleting(true);
    setDeleteModalOpen(false);
    runAccountDeletion();
  };

  const handleCancelDeleteFlow = () => {
    deleteAbortRef.current?.abort();
    setDeletePhase(null);
    setModalDeleting(false);
  };

  const update = (key, val) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: undefined, email: undefined }));
  };

  const handleSave = () => {
    const nextErrors = validateProfileForm(values, {
      emailTaken: values.email.trim().toLowerCase() === 'taken@example.com',
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (!complete) return;

    const initial = values.displayName.trim().charAt(0).toUpperCase() || '';
    const saved = {
      ...values,
      hasPhoto: photoState !== 'empty',
      photoInitial: initial,
    };
    setValues(saved);
    baselineRef.current = profileSnapshot(saved);
    if (photoState === 'upload-error') setPhotoState('filled');
    else if (photoState === 'empty') setPhotoState('filled');
  };

  const handleDiscard = () => {
    if (dirty) {
      onRequestDiscard?.(() => {
        setValues(JSON.parse(baselineRef.current));
        setErrors({});
        const snap = JSON.parse(baselineRef.current);
        setPhotoState(snap.hasPhoto ? 'filled' : 'empty');
      });
      return;
    }
    setValues(EMPTY_PROFILE);
    setErrors({});
    setPhotoState('empty');
    baselineRef.current = profileSnapshot(EMPTY_PROFILE);
  };

  const handleUpload = () => {
    setPhotoState('upload-error');
  };

  const photoBlock = useMemo(() => {
    if (photoState === 'upload-error') {
      return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex min-h-[88px] w-full max-w-[280px] flex-col items-center justify-center gap-2 rounded-[10px] border border-dashed border-[#fc8181] bg-[#fff5f5] px-4 py-5">
            <RiImageAddLine size={22} className="text-[#c53030]" aria-hidden />
            <p className="text-center text-[12.5px] font-medium text-[#c53030]">Upload failed</p>
            <p className="text-center text-[12px] text-[#9e9e9a]">File too large or unsupported format</p>
          </div>
          <div className="flex flex-col gap-2 pt-1">
            <p className="text-[13px] font-medium text-[#1a1a18]">Profile photo</p>
            <OutlineButton type="button" onClick={() => setPhotoState('filled')}>
              <RiRefreshLine size={14} className="mr-1.5 inline" aria-hidden />
              Try Again
            </OutlineButton>
            <p className="text-[12px] text-[#9e9e9a]">JPG, GIF or PNG. Max size 2MB.</p>
          </div>
        </div>
      );
    }

    if (photoState === 'filled' || values.hasPhoto) {
      const initial = values.photoInitial || values.displayName.trim().charAt(0).toUpperCase() || 'M';
      return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="relative shrink-0">
            <div className="flex size-[72px] items-center justify-center rounded-full border-2 border-[#e8e8e6] bg-[#7c3aed] text-[22px] font-semibold text-white">
              {initial}
            </div>
            <GoogleAvatarBadge />
          </div>
          <div className="flex flex-col gap-1.5 pt-0.5">
            <p className="text-[13px] font-medium text-[#1a1a18]">Profile photo</p>
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <OutlineButton type="button" onClick={handleUpload}>Change photo</OutlineButton>
              <GhostButton type="button" className="px-[15px] py-[7px]" onClick={() => setPhotoState('empty')}>
                Remove
              </GhostButton>
            </div>
            <p className="text-[12px] text-[#9e9e9a]">JPG, GIF or PNG. Max size 2MB.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex size-[72px] shrink-0 items-center justify-center rounded-full border-2 border-dashed border-[#e8e8e6] bg-[#fafaf8]">
          <RiImageAddLine size={22} className="text-[#9e9e9a]" aria-hidden />
        </div>
        <div className="flex flex-col gap-1.5 pt-1">
          <p className="text-[13px] font-medium text-[#1a1a18]">Profile photo</p>
          <OutlineButton type="button" onClick={handleUpload}>Upload photo</OutlineButton>
          <p className="text-[12px] text-[#9e9e9a]">JPG, GIF or PNG. Max size 2MB.</p>
        </div>
      </div>
    );
  }, [photoState, values.displayName, values.hasPhoto, values.photoInitial]);

  return (
    <div className="flex flex-col gap-6">
      {showIncompleteBanner ? (
        <ProfileBanner variant="warning">
          Complete your profile — add a display name and photo so teammates recognize you in shared forms.
        </ProfileBanner>
      ) : null}

      <div className="flex flex-col gap-8">
      <SettingsCard>
        <CardHeader title="Account Information" subtitle="Used in emails, exports, and shared views" />
        <div className="flex flex-col gap-[26px] p-7">
          {photoBlock}

          <div className="grid grid-cols-1 gap-x-7 gap-y-5 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <FieldLabelRequired required>Display name</FieldLabelRequired>
              <TextInput
                value={values.displayName}
                onChange={(e) => update('displayName', e.target.value)}
                error={errors.displayName}
                placeholder="Your name"
              />
              <FieldError>{errors.displayName}</FieldError>
              {!errors.displayName ? <FieldHint>Shown in shared forms and exports</FieldHint> : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabelRequired hint="optional">Username</FieldLabelRequired>
              <TextInput
                value={values.username}
                onChange={(e) => update('username', e.target.value)}
                placeholder="@username"
              />
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <FieldLabelRequired>Email address</FieldLabelRequired>
              <TextInput
                value={values.email}
                onChange={(e) => update('email', e.target.value)}
                error={errors.email}
              />
              <FieldError>{errors.email}</FieldError>
              {!errors.email ? <FieldHint>Used for login and notifications</FieldHint> : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabelRequired>Language</FieldLabelRequired>
              <SelectField value={values.language} onChange={(e) => update('language', e.target.value)}>
                <option value="en">English</option>
              </SelectField>
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabelRequired>Timezone</FieldLabelRequired>
              <SelectField value={values.timezone} onChange={(e) => update('timezone', e.target.value)}>
                <option value="utc">UTC+00:00 — Coordinated Universal Time</option>
              </SelectField>
            </div>
          </div>

          <SaveBar
            onDiscard={handleDiscard}
            onSave={handleSave}
            saveDisabled={!dirty || !complete}
          />
        </div>
      </SettingsCard>

      <SettingsCard borderClass="border-[#fed7d7]">
        <CardHeader
          title="Danger Zone"
          subtitle="These actions are irreversible — proceed with caution"
          titleClassName="text-[#c53030]"
        />
        <DangerRow
          title="Export all data"
          description="Download a full archive of your responses, forms, and account activity"
          action={<OutlineButton>Export data</OutlineButton>}
        />
        <DangerRow
          title="Sign out"
          description="You are currently signed in on this device via Google · Last active just now"
          action={<OutlineButton>Sign Out</OutlineButton>}
        />
        <DangerRow
          title="Delete account"
          description="Permanently remove your account and all associated data from Clearform"
          action={
            <DangerButton
              type="button"
              disabled={Boolean(deletePhase)}
              onClick={() => setDeleteModalOpen(true)}
            >
              Delete account
            </DangerButton>
          }
        />
      </SettingsCard>
      </div>

      <DeleteAccountModal
        open={deleteModalOpen}
        isDeleting={modalDeleting}
        onCancel={() => {
          if (modalDeleting) return;
          setDeleteModalOpen(false);
        }}
        onConfirm={handleConfirmDelete}
      />

      <AccountDeletionFlow
        phase={deletePhase}
        onRetry={runAccountDeletion}
        onCancel={handleCancelDeleteFlow}
        onFinished={() => setDeletePhase(null)}
      />
    </div>
  );
}
