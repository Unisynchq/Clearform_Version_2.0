import { useCallback, useEffect, useRef, useState } from 'react';
import {
  RiCheckLine,
  RiComputerLine,
  RiErrorWarningLine,
  RiMacbookLine,
} from 'react-icons/ri';
import { useToast } from '../../hooks/useToast';
import ConfirmActionModal from '../ui/ConfirmActionModal';
import {
  CardHeader,
  DangerOutlineButton,
  FieldError,
  GhostButton,
  PrimaryButton,
  SessionRow,
  SettingsCard,
  StatusBadge,
  TextInput,
  TextLinkButton,
} from './ProfileSettingsUi';
import { passwordStrengthSegments, validatePasswordForm } from './profileFormUtils';
import { revokeSessionsRequest } from './profileSessionActions';

const INITIAL_SESSIONS = [
  {
    id: 'current',
    icon: RiMacbookLine,
    iconWrapClass: 'border-[#e8e8e6] bg-[#f7f7f6]',
    title: 'MacBook Pro · Chrome 124',
    meta: 'Mumbai, India · 103.45.21.87',
    isCurrent: true,
    right: <span className="text-[12px] text-[#9e9e9a]">Active now</span>,
  },
  {
    id: 'windows',
    icon: RiComputerLine,
    iconWrapClass: 'border-[#e8e8e6] bg-[#f7f7f6]',
    title: 'Windows PC · Firefox 125',
    meta: 'Pune, India · 182.70.44.12',
    right: <span className="text-[12px] text-[#9e9e9a]">Yesterday, 4:30 PM</span>,
  },
  {
    id: 'unknown',
    icon: RiErrorWarningLine,
    iconWrapClass: 'border-[#fed7d7] bg-[#fff5f5] text-[#c53030]',
    title: 'Unknown device · Unknown browser',
    meta: 'Singapore · 128.199.44.77 · Unrecognised location',
    titleClass: 'text-[#c53030]',
    right: <span className="text-[12px] text-[#c53030]">3 days ago</span>,
    suspicious: true,
  },
];

function PasswordStrength({ password }) {
  const segments = passwordStrengthSegments(password);
  const filled = segments.filter(Boolean).length;
  const label =
    filled >= 4 ? 'Strong password' : filled >= 2 ? 'Good password' : filled >= 1 ? 'Weak password' : '';
  const color = filled >= 4 ? '#2e7d52' : filled >= 2 ? '#d97706' : '#c53030';

  if (!password) return null;

  return (
    <div className="pt-2">
      <div className="flex gap-1">
        {segments.map((on, i) => (
          <span
            key={i}
            className="h-[3px] flex-1 rounded-[2px]"
            style={{ backgroundColor: on ? color : '#e8e8e6' }}
          />
        ))}
      </div>
      {label ? (
        <p className="pt-[5px] text-[11.5px] font-medium" style={{ color }}>
          {label}
        </p>
      ) : null}
    </div>
  );
}

export default function ProfileSecurityTab({ onDirtyChange }) {
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const dirty = currentPassword.length > 0 || newPassword.length > 0 || confirmPassword.length > 0;

  const [sessions, setSessions] = useState(INITIAL_SESSIONS);
  const [revokeModal, setRevokeModal] = useState(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const abortRef = useRef(null);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const closeRevokeModal = useCallback(() => {
    if (isRevoking) return;
    setRevokeModal(null);
  }, [isRevoking]);

  const runRevoke = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsRevoking(true);

    try {
      await revokeSessionsRequest({ signal: controller.signal });

      if (revokeModal === 'all') {
        setSessions((prev) => prev.filter((s) => s.isCurrent));
        showToast({
          type: 'success',
          message: 'All other sessions have been revoked.',
          duration: 4000,
        });
      } else if (revokeModal) {
        setSessions((prev) => prev.filter((s) => s.id !== revokeModal));
        showToast({
          type: 'success',
          message: 'Session revoked successfully.',
          duration: 3500,
        });
      }

      setRevokeModal(null);
    } catch (err) {
      if (err?.name === 'AbortError') return;
      showToast({
        type: 'error',
        message: 'Could not revoke sessions. Try again.',
        duration: 4500,
        action: {
          label: 'Retry',
          onClick: () => runRevoke(),
        },
      });
    } finally {
      setIsRevoking(false);
    }
  }, [revokeModal, showToast]);

  const revokeTitle =
    revokeModal === 'all'
      ? 'Are you sure you want to revoke all sessions?'
      : 'Are you sure you want to revoke this session?';

  const revokeWarning =
    revokeModal === 'all'
      ? 'All the sessions will be revoked immediately.'
      : 'This device will be signed out immediately.';

  const revokeConfirmLabel = revokeModal === 'all' ? 'Revoke all sessions' : 'Revoke session';

  const handleUpdate = () => {
    const nextErrors = validatePasswordForm(
      { current: currentPassword, next: newPassword, confirm: confirmPassword },
      { wrongPassword: currentPassword === 'wrong' },
    );
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
    showToast({
      type: 'success',
      message:
        'Password updated successfully. Other sessions have been signed out for security.',
      duration: 4000,
    });
  };

  const handleCancel = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
  };

  const otherSessions = sessions.filter((s) => !s.isCurrent);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-8">
        <SettingsCard className="pt-3">
          <CardHeader
            title="Password"
            subtitle="Last changed 3 months ago · Choose a strong, unique password"
            action={
              newPassword ? (
                <StatusBadge
                  label={
                    passwordStrengthSegments(newPassword).filter(Boolean).length >= 4
                      ? 'Strong'
                      : 'Weak'
                  }
                />
              ) : null
            }
          />
          <div className="flex flex-col gap-6 p-7">
            <div className="grid grid-cols-1 gap-x-7 gap-y-[18px] md:grid-cols-2">
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-[13px] font-medium text-[#1a1a18]">Current password</label>
                <TextInput
                  type="password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setErrors((prev) => ({ ...prev, current: undefined }));
                  }}
                  error={errors.current}
                  placeholder="Enter current password"
                />
                <FieldError>{errors.current}</FieldError>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-[#1a1a18]">New password</label>
                <TextInput
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setErrors((prev) => ({ ...prev, strength: undefined }));
                  }}
                  error={errors.strength}
                  placeholder="Min. 12 characters"
                />
                <FieldError>{errors.strength}</FieldError>
                <PasswordStrength password={newPassword} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-[#1a1a18]">Confirm new password</label>
                <TextInput
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrors((prev) => ({ ...prev, confirm: undefined }));
                  }}
                  error={errors.confirm}
                  placeholder="Re-enter new password"
                />
                <FieldError>{errors.confirm}</FieldError>
              </div>
            </div>
            <div className="flex flex-col-reverse items-stretch justify-between gap-3 border-t border-[#f0f0ee] pt-[23px] sm:flex-row sm:items-center">
              <GhostButton type="button" onClick={handleCancel}>
                Cancel
              </GhostButton>
              <PrimaryButton type="button" icon={RiCheckLine} onClick={handleUpdate} disabled={!dirty}>
                Update password
              </PrimaryButton>
            </div>
          </div>
        </SettingsCard>

        <SettingsCard>
          <CardHeader
            title="Active sessions"
            subtitle="Devices currently signed in to your Clearform account"
            action={
              otherSessions.length > 0 ? (
                <DangerOutlineButton
                  type="button"
                  onClick={() => setRevokeModal('all')}
                  disabled={Boolean(revokeModal) || isRevoking}
                >
                  Revoke all other sessions
                </DangerOutlineButton>
              ) : null
            }
          />
          <div className="py-2">
            {sessions.map((session) => (
              <SessionRow
                key={session.id}
                icon={session.icon}
                iconWrapClass={session.iconWrapClass}
                title={session.title}
                meta={session.meta}
                titleClass={session.titleClass}
                badge={
                  session.isCurrent ? (
                    <span className="inline-flex items-center rounded-[4px] border border-[#c6f0d8] bg-[#f7f7f6] px-2 py-[3px] text-[10.5px] font-medium text-[#2e7d52]">
                      Current
                    </span>
                  ) : null
                }
                right={session.right}
                action={
                  session.isCurrent ? null : (
                    session.suspicious ? (
                      <DangerOutlineButton
                        type="button"
                        className="px-[15px] py-2"
                        disabled={isRevoking}
                        onClick={() => setRevokeModal(session.id)}
                      >
                        Revoke
                      </DangerOutlineButton>
                    ) : (
                      <TextLinkButton
                        type="button"
                        disabled={isRevoking}
                        onClick={() => setRevokeModal(session.id)}
                      >
                        Revoke
                      </TextLinkButton>
                    )
                  )
                }
              />
            ))}
          </div>
        </SettingsCard>
      </div>

      <ConfirmActionModal
        open={Boolean(revokeModal)}
        onCancel={closeRevokeModal}
        onConfirm={runRevoke}
        isLoading={isRevoking}
        title={revokeTitle}
        warning={revokeWarning}
        confirmLabel={revokeConfirmLabel}
        loadingLabel="Revoking…"
        headerIcon={RiErrorWarningLine}
      />
    </div>
  );
}
