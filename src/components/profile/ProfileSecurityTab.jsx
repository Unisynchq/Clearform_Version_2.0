import { useEffect, useState } from 'react';
import { RiCheckLine, RiComputerLine, RiErrorWarningLine, RiMacbookLine } from 'react-icons/ri';
import {
  CardHeader,
  DangerOutlineButton,
  FieldError,
  GhostButton,
  PrimaryButton,
  ProfileBanner,
  SessionRow,
  SettingsCard,
  StatusBadge,
  TextInput,
  TextLinkButton,
} from './ProfileSettingsUi';
import { passwordStrengthSegments, validatePasswordForm } from './profileFormUtils';

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
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const dirty = currentPassword.length > 0 || newPassword.length > 0 || confirmPassword.length > 0;

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  const handleUpdate = () => {
    const nextErrors = validatePasswordForm(
      { current: currentPassword, next: newPassword, confirm: confirmPassword },
      { wrongPassword: currentPassword === 'wrong' },
    );
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
    window.setTimeout(() => setSuccess(false), 5000);
  };

  const handleCancel = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
  };

  return (
    <div className="flex flex-col gap-6">
      {success ? (
        <ProfileBanner variant="success">Password updated successfully</ProfileBanner>
      ) : null}

      <div className="flex flex-col gap-8">
      <SettingsCard className="pt-3">
        <CardHeader
          title="Password"
          subtitle="Last changed 3 months ago · Choose a strong, unique password"
          action={newPassword ? <StatusBadge label={passwordStrengthSegments(newPassword).filter(Boolean).length >= 4 ? 'Strong' : 'Weak'} /> : null}
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
          action={<DangerOutlineButton>Revoke all other sessions</DangerOutlineButton>}
        />
        <div className="py-2">
          <SessionRow
            icon={RiMacbookLine}
            iconWrapClass="border-[#e8e8e6] bg-[#f7f7f6]"
            title="MacBook Pro · Chrome 124"
            meta="Mumbai, India · 103.45.21.87"
            badge={
              <span className="inline-flex items-center rounded-[4px] border border-[#c6f0d8] bg-[#f7f7f6] px-2 py-[3px] text-[10.5px] font-medium text-[#2e7d52]">
                Current
              </span>
            }
            right={<span className="text-[12px] text-[#9e9e9a]">Active now</span>}
          />
          <SessionRow
            icon={RiComputerLine}
            iconWrapClass="border-[#e8e8e6] bg-[#f7f7f6]"
            title="Windows PC · Firefox 125"
            meta="Pune, India · 182.70.44.12"
            right={<span className="text-[12px] text-[#9e9e9a]">Yesterday, 4:30 PM</span>}
            action={<TextLinkButton>Revoke</TextLinkButton>}
          />
          <SessionRow
            icon={RiErrorWarningLine}
            iconWrapClass="border-[#fed7d7] bg-[#fff5f5] text-[#c53030]"
            title="Unknown device · Unknown browser"
            meta="Singapore · 128.199.44.77 · Unrecognised location"
            titleClass="text-[#c53030]"
            right={<span className="text-[12px] text-[#c53030]">3 days ago</span>}
            action={<DangerOutlineButton className="px-[15px] py-2">Revoke</DangerOutlineButton>}
          />
        </div>
      </SettingsCard>
      </div>
    </div>
  );
}
