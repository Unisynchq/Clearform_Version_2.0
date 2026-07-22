import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  RiCheckLine,
  RiComputerLine,
  RiErrorWarningLine,
  RiEyeLine,
  RiEyeOffLine,
} from 'react-icons/ri';
import ConfirmActionModal from '@/components/ui/ConfirmActionModal';
import ProfileFieldError from '@/features/profile/components/ProfileFieldError';
import PasswordUpdatedBanner from '@/features/profile/components/PasswordUpdatedBanner';
import {
  readSecuritySettings,
  writeSecuritySettings,
} from '@/features/profile/utils/profileSettingsStorage';
import {
  mergeSessionsWithCurrentDevice,
} from '@/features/profile/utils/currentDeviceSession';
import {
  getDefaultSessions,
  getPasswordStrength,
  strengthBarColor,
  strengthTextColor,
} from '@/features/profile/utils/profileSecurityUtils';
import { addNotification } from '@/store/slices/notificationsSlice';
import {
  NOTIFICATION_ROUTE_KEYS,
  notificationAction,
} from '@/constants/notificationRoutes';
import {
  hasStoredPassword,
  verifyCurrentPassword,
} from '@/features/profile/utils/profileValidation';
import { persistAccountPassword } from '@/features/auth/utils/userAccountsStorage';
import { requestPasswordResetEmail } from '@/features/auth/services/firebaseAuthService';
import { useToast } from '@/hooks/useToast';
import { useSelector } from 'react-redux';

const inputClass =
  'w-full rounded-[6px] border border-[#e8e8e6] bg-white px-[13px] py-[10px] text-[13.5px] text-[#1a1a18] outline-none transition-colors placeholder:text-[#9e9e9a] focus:border-[#1a1a18]';

const inputErrorClass =
  'w-full rounded-[6px] border border-[#fc8181] bg-white px-[13px] py-[10px] text-[13.5px] text-[#1a1a18] outline-none transition-colors placeholder:text-[#9e9e9a]';

const FieldLabel = ({ children }) => (
  <label className="text-[13px] font-medium text-[#1a1a18]">{children}</label>
);

const StrengthBadge = ({ label }) => (
  <span className="inline-flex items-center gap-1 rounded-[4px] border border-[#c6f0d8] bg-[#f7f7f6] px-2.5 py-1 text-[11.5px] font-medium text-[#2e7d52]">
    <span className="size-[6px] rounded-[3px] bg-[#2e7d52]" aria-hidden />
    {label}
  </span>
);

const PasswordField = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  showToggle,
  error,
  disabled,
  inputClassName = inputClass,
}) => {
  const [visible, setVisible] = useState(false);
  const fieldClass = error ? inputErrorClass : inputClassName;

  return (
    <div className={`flex flex-col gap-1.5 ${disabled ? 'opacity-[0.67]' : ''}`}>
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={id === 'current-password' ? 'current-password' : 'new-password'}
          className={`${fieldClass} ${showToggle ? 'pr-10' : ''} disabled:cursor-not-allowed disabled:bg-[#fafaf9]`}
          aria-invalid={error ? 'true' : undefined}
        />
        {showToggle && !disabled ? (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9e9e9a] hover:text-[#1a1a18]"
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
          </button>
        ) : null}
      </div>
      {error ? <ProfileFieldError message={error} /> : null}
    </div>
  );
};

const SessionIcon = ({ isUnknown }) => {
  const Icon = isUnknown ? RiErrorWarningLine : RiComputerLine;
  return (
    <div
      className={`flex size-9 shrink-0 items-center justify-center rounded-[10px] border p-px ${
        isUnknown
          ? 'border-[#fed7d7] bg-[#fff5f5] text-[#c53030]'
          : 'border-[#e8e8e6] bg-[#f7f7f6] text-[#6b6b68]'
      }`}
    >
      <Icon size={18} aria-hidden />
    </div>
  );
};

const SessionRow = ({ session, onRevoke }) => {
  const { isUnknown, isCurrent, device, location, lastActive } = session;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f0f0ee] py-3.5 first:border-t-0">
      <div className="flex min-w-0 items-center gap-3.5">
        <SessionIcon isUnknown={isUnknown} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={`text-[13.5px] font-medium ${
                isUnknown ? 'text-[#c53030]' : 'text-[#1a1a18]'
              }`}
            >
              {device}
            </p>
            {isCurrent ? (
              <span className="rounded-[4px] border border-[#c6f0d8] bg-[#f7f7f6] px-2 py-[3px] text-[10.5px] font-medium text-[#2e7d52]">
                Current
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-[12px] text-[#9e9e9a]">{location}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span
          className={`text-[12px] ${isUnknown ? 'text-[#c53030]' : 'text-[#9e9e9a]'}`}
        >
          {lastActive}
        </span>
        {!isCurrent ? (
          <button
            type="button"
            onClick={() => onRevoke(session.id)}
            className={
              isUnknown
                ? 'rounded-[6px] border border-[#fed7d7] bg-[#fff5f5] px-[15px] py-2 text-[12.5px] font-medium text-[#c53030] hover:bg-[#fee2e2] transition-colors'
                : 'px-2.5 py-1.5 text-[12.5px] font-medium text-[#c53030] hover:underline'
            }
          >
            Revoke
          </button>
        ) : null}
      </div>
    </div>
  );
};

const ProfileSecurityPanel = ({ email, profileEmail = '' }) => {
  const dispatch = useDispatch();
  const lookupEmails = useMemo(
    () => [profileEmail].filter((e) => e?.trim() && e.trim().toLowerCase() !== email?.trim().toLowerCase()),
    [email, profileEmail]
  );
  const { showToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [sessions, setSessions] = useState(getDefaultSessions);
  const [revokeAllOpen, setRevokeAllOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [currentPasswordError, setCurrentPasswordError] = useState(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const hydrateSessions = useCallback(() => {
    const saved = readSecuritySettings(email);
    setSessions(mergeSessionsWithCurrentDevice(saved?.sessions));
  }, [email]);

  useEffect(() => {
    hydrateSessions();
  }, [hydrateSessions]);

  const persistSessions = (next) => {
    const merged = mergeSessionsWithCurrentDevice(next);
    setSessions(merged);
    writeSecuritySettings(email, {
      sessions: merged,
      passwordLastChanged: readSecuritySettings(email)?.passwordLastChanged,
    });
  };

  const strength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);
  const passwordsMatch =
    newPassword.length > 0 && confirmPassword.length > 0 && newPassword === confirmPassword;
  const confirmMismatch =
    submitAttempted && confirmPassword.length > 0 && newPassword !== confirmPassword;

  const incorrectCurrent = Boolean(currentPasswordError);
  const lockNewFields = incorrectCurrent;

  const currentPasswordMismatch =
    currentPassword.trim().length > 0 &&
    hasStoredPassword(email, lookupEmails) &&
    !verifyCurrentPassword(email, currentPassword, lookupEmails);

  const canUpdatePassword =
    currentPassword.trim().length > 0 &&
    newPassword.length >= 12 &&
    passwordsMatch &&
    !incorrectCurrent;

  const handleCancelPassword = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setCurrentPasswordError(null);
    setSubmitAttempted(false);
  };

  const handleUpdatePassword = async () => {
    setSubmitAttempted(true);

    if (!verifyCurrentPassword(email, currentPassword, lookupEmails)) {
      setCurrentPasswordError(
        'Incorrect password. Try Again or Reset the Password'
      );
      return;
    }

    setCurrentPasswordError(null);

    if (newPassword.length < 12) {
      return;
    }

    if (!passwordsMatch) {
      return;
    }

    setIsUpdating(true);
    await new Promise((r) => setTimeout(r, 450));
    writeSecuritySettings(email, {
      sessions: mergeSessionsWithCurrentDevice(
        sessions.filter((s) => s.isCurrent)
      ),
      passwordLastChanged: Date.now(),
    });
    persistAccountPassword(email, newPassword, { altEmails: lookupEmails });
    handleCancelPassword();
    setIsUpdating(false);
    setShowSuccessBanner(true);
    showToast({ type: 'success', message: 'Password updated.', duration: 2200 });
  };

  const handleTryAgain = () => {
    setCurrentPasswordError(null);
    setSubmitAttempted(false);
    setCurrentPassword('');
  };

  const handleForgotPassword = async () => {
    const targetEmail = (profileEmail || email || '').trim();
    if (!targetEmail) {
      showToast({
        type: 'error',
        message: 'Add an email address to your profile before resetting your password.',
        duration: 4000,
      });
      return;
    }
    try {
      await requestPasswordResetEmail(targetEmail);
      showToast({
        type: 'success',
        message: `Password reset email sent to ${targetEmail}.`,
        duration: 4000,
      });
    } catch (err) {
      showToast({
        type: 'error',
        message: err?.message ?? 'Could not send password reset email.',
        duration: 4000,
      });
    }
  };

  const pushSessionRevokedNotification = (allOthers) => {
    dispatch(
      addNotification({
        type: 'session_revoked',
        category: 'alerts',
        iconType: 'warning',
        iconBg: '#fef3e2',
        title: allOthers ? 'Other sessions revoked' : 'Session revoked',
        titleColor: '#b45309',
        bodySegments: allOthers
          ? [
              { text: 'All other devices', bold: true },
              { text: ' were signed out of your Clearform account.', bold: false },
            ]
          : [
              { text: 'A device session', bold: true },
              { text: ' was signed out of your Clearform account.', bold: false },
            ],
        timestamp: 'Just now',
        action: notificationAction({
          label: 'Security settings',
          style: 'primary',
          routeKey: NOTIFICATION_ROUTE_KEYS.security,
        }),
      }),
    );
  };

  const handleRevokeSession = (sessionId) => {
    const next = sessions.filter((s) => s.id !== sessionId);
    persistSessions(next);
    setRevokeTarget(null);
    pushSessionRevokedNotification(false);
    showToast({ type: 'success', message: 'Session revoked.', duration: 2200 });
  };

  const handleRevokeAllOthers = () => {
    const next = sessions.filter((s) => s.isCurrent);
    persistSessions(next);
    setRevokeAllOpen(false);
    pushSessionRevokedNotification(true);
    showToast({ type: 'success', message: 'All other sessions revoked.', duration: 2200 });
  };

  const otherSessionCount = sessions.filter((s) => !s.isCurrent).length;
  const primaryActionLabel = incorrectCurrent ? 'Try Again' : 'Update password';
  const primaryDisabled = incorrectCurrent ? false : !canUpdatePassword || isUpdating;

  return (
    <>
      {showSuccessBanner ? (
        <PasswordUpdatedBanner onDismiss={() => setShowSuccessBanner(false)} />
      ) : null}

      {/* Password */}
      <section className="overflow-hidden rounded-[14px] border border-[#e8e8e6] bg-white">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#f0f0ee] px-7 pb-[19px] pt-[22px]">
          <div>
            <h2 className="text-[14px] font-semibold tracking-[-0.2px] text-[#1a1a18]">
              Password
            </h2>
            <p className="mt-0.5 text-[12.5px] text-[#9e9e9a]">
              Last changed 3 months ago · Choose a strong, unique password
            </p>
          </div>
          {!incorrectCurrent ? (
            <StrengthBadge label={newPassword ? strength.badgeLabel : 'Strong'} />
          ) : null}
        </div>

        <div className="flex flex-col gap-6 p-7">
          <div className="grid grid-cols-1 gap-x-7 gap-y-[18px] md:grid-cols-2">
            <div className="md:col-span-2">
              <PasswordField
                id="current-password"
                label="Current password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (currentPasswordError) setCurrentPasswordError(null);
                }}
                placeholder="••••••••••••"
                error={
                  currentPasswordError ||
                  (currentPasswordMismatch
                    ? 'Current password does not match your sign-in password'
                    : null)
                }
              />
              {incorrectCurrent ? (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="mt-2 text-left text-[12px] text-[#07038d] hover:underline"
                >
                  Forgot Password? Reset via email
                </button>
              ) : null}
            </div>

            <div className={lockNewFields ? 'opacity-[0.67]' : ''}>
              <PasswordField
                id="new-password"
                label="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 12 characters"
                showToggle
                disabled={lockNewFields}
                inputClassName={inputClass}
              />
              {newPassword && !lockNewFields ? (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-[3px] flex-1 rounded-[2px] transition-colors"
                        style={{ backgroundColor: strengthBarColor(strength.level, i) }}
                      />
                    ))}
                  </div>
                  {strength.label ? (
                    <p
                      className="mt-1.5 text-[11.5px] font-medium"
                      style={{ color: strengthTextColor(strength.level) }}
                    >
                      {strength.label}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className={lockNewFields ? 'opacity-[0.67]' : ''}>
              <PasswordField
                id="confirm-password"
                label="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                showToggle
                disabled={lockNewFields}
                inputClassName={confirmMismatch ? inputErrorClass : inputClass}
                error={confirmMismatch ? "Passwords don't match" : null}
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[#f0f0ee] pt-6">
            <button
              type="button"
              onClick={handleCancelPassword}
              className="rounded-[6px] px-[15px] py-2 text-[13px] font-medium text-[#6b6b68] hover:bg-[#f7f7f6] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={incorrectCurrent ? handleTryAgain : handleUpdatePassword}
              disabled={primaryDisabled}
              className={`inline-flex items-center gap-1.5 rounded-[6px] px-[18px] py-[9px] text-[13.5px] font-medium text-white transition-colors ${
                incorrectCurrent || canUpdatePassword
                  ? 'bg-[#1a1a18] hover:bg-[#2d2d2b]'
                  : 'bg-[#6b6b68] cursor-not-allowed'
              }`}
            >
              {!incorrectCurrent ? <RiCheckLine size={14} aria-hidden /> : null}
              {isUpdating ? 'Updating…' : primaryActionLabel}
            </button>
          </div>
        </div>
      </section>

      {/* Active sessions */}
      <section className="overflow-hidden rounded-[14px] border border-[#e8e8e6] bg-white">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#f0f0ee] px-7 pb-[19px] pt-[22px]">
          <div>
            <h2 className="text-[14px] font-semibold tracking-[-0.2px] text-[#1a1a18]">
              Active sessions
            </h2>
            <p className="mt-0.5 text-[12.5px] text-[#9e9e9a]">
              Devices currently signed in to your Clearform account
            </p>
          </div>
          {otherSessionCount > 0 ? (
            <button
              type="button"
              onClick={() => setRevokeAllOpen(true)}
              className="rounded-[6px] border border-[#fed7d7] bg-[#fff5f5] px-[15px] py-2 text-[13px] font-medium text-[#c53030] hover:bg-[#fee2e2] transition-colors"
            >
              Revoke all other sessions
            </button>
          ) : null}
        </div>

        <div className="px-7 py-2">
          {sessions.map((session) => (
            <SessionRow
              key={session.id}
              session={session}
              onRevoke={(id) => setRevokeTarget(id)}
            />
          ))}
          {sessions.length === 1 ? (
            <p className="py-4 text-center text-[12px] text-[#9e9e9a]">
              No other active sessions
            </p>
          ) : null}
        </div>
      </section>

      <ConfirmActionModal
        open={revokeAllOpen}
        onCancel={() => setRevokeAllOpen(false)}
        onConfirm={handleRevokeAllOthers}
        title="Revoke all other sessions?"
        warning="You will stay signed in on this device. All other devices will need to sign in again."
        confirmLabel="Revoke all"
        confirmClassName="bg-[#c53030] text-white hover:bg-[#9b2c2c]"
      />

      <ConfirmActionModal
        open={Boolean(revokeTarget)}
        onCancel={() => setRevokeTarget(null)}
        onConfirm={() => handleRevokeSession(revokeTarget)}
        title="Revoke session?"
        warning="This device will be signed out and will need to sign in again."
        confirmLabel="Revoke"
        confirmClassName="bg-[#c53030] text-white hover:bg-[#9b2c2c]"
      />
    </>
  );
};

export default ProfileSecurityPanel;
