import { RiAlertLine, RiCheckLine, RiErrorWarningLine } from 'react-icons/ri';
import appleLogo from '../../assets/profile/apple-logo.svg';
import googleLogo from '../../assets/profile/google-logo.svg';
import microsoftLogo from '../../assets/profile/microsoft-logo.svg';

const PROVIDER_LOGOS = {
  google: { src: googleLogo, label: 'Google account' },
  microsoft: { src: microsoftLogo, label: 'Microsoft account' },
  apple: { src: appleLogo, label: 'Apple account' },
};

export function SettingsCard({ children, className = '', borderClass = 'border-[#e8e8e6]', roundedClass = 'rounded-[12px]' }) {
  return (
    <div className={`overflow-hidden border bg-white ${roundedClass} ${borderClass} ${className}`}>
      {children}
    </div>
  );
}

export function ProfileBanner({ variant = 'warning', children }) {
  const styles =
    variant === 'success'
      ? 'border-[#c6f0d8] bg-[#f0fff4] text-[#2e7d52]'
      : variant === 'error'
        ? 'border-[#fed7d7] bg-[#fff5f5] text-[#c53030]'
        : 'border-[#fde68a] bg-[#fffbeb] text-[#d97706]';

  const Icon = variant === 'success' ? RiCheckLine : variant === 'error' ? RiErrorWarningLine : RiAlertLine;

  return (
    <div className={`flex items-start gap-2.5 rounded-[10px] border px-4 py-3 text-[13px] leading-[20px] ${styles}`}>
      <Icon size={16} className="mt-0.5 shrink-0" aria-hidden />
      <p>{children}</p>
    </div>
  );
}

export function FieldError({ children }) {
  if (!children) return null;
  return (
    <p className="flex items-center gap-1.5 pt-0.5 text-[12px] text-[#c53030]">
      <RiErrorWarningLine size={14} className="shrink-0" aria-hidden />
      {children}
    </p>
  );
}

export function FieldLabelRequired({ children, required = false, hint }) {
  return (
    <div className="flex items-end gap-1">
      <label className="text-[13px] font-medium text-[#1a1a18]">{children}</label>
      {required ? <span className="text-[13px] font-medium text-[#c53030]">*</span> : null}
      {hint ? <span className="text-[12px] font-normal text-[#9e9e9a]">{hint}</span> : null}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, titleClassName = 'text-[#1a1a18]' }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#f0f0ee] px-7 pb-[19px] pt-[22px]">
      <div className="min-w-0 flex flex-col gap-[3px]">
        <h2 className={`text-[14px] font-semibold tracking-[-0.2px] ${titleClassName}`}>{title}</h2>
        {subtitle ? (
          <p className="text-[12.5px] font-normal text-[#9e9e9a]">{subtitle}</p>
        ) : null}
      </div>
      {action ?? null}
    </div>
  );
}

export function StatusBadge({ label, variant = 'success' }) {
  const styles =
    variant === 'success'
      ? 'border-[#c6f0d8] bg-[#f7f7f6] text-[#2e7d52]'
      : variant === 'muted'
        ? 'border-[#e8e8e6] bg-[#f7f7f6] text-[#9e9e9a]'
        : 'border-[#c6f0d8] bg-[#f0fff4] text-[#2e7d52]';

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-[4px] border px-2.5 py-1 text-[11.5px] font-medium ${styles}`}
    >
      {variant !== 'muted' ? (
        <span className="size-[6px] shrink-0 rounded-[3px] bg-[#2e7d52]" aria-hidden />
      ) : null}
      {label}
    </span>
  );
}

export function FieldLabel({ children, hint }) {
  return (
    <div className="flex items-end gap-1">
      <label className="text-[13px] font-medium text-[#1a1a18]">{children}</label>
      {hint ? <span className="text-[12px] font-normal text-[#9e9e9a]">{hint}</span> : null}
    </div>
  );
}

export function FieldHint({ children }) {
  return <p className="pt-0.5 text-[12px] text-[#9e9e9a]">{children}</p>;
}

const inputClass =
  'w-full rounded-[6px] border border-[#e8e8e6] bg-white px-[13px] py-[10px] text-[13.5px] text-[#1a1a18] outline-none placeholder:text-[#9e9e9a] focus:border-[#4b43b0] focus:ring-2 focus:ring-[#4b43b0]/15';

export function TextInput({ error, className = '', ...props }) {
  return (
    <input
      className={`${inputClass} ${error ? 'border-[#fc8181] focus:border-[#c53030] focus:ring-[#c53030]/15' : ''} ${className}`}
      {...props}
    />
  );
}

export function SelectField({ value, children, onChange, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <select value={value} onChange={onChange} className={`${inputClass} appearance-none pr-9`}>
        {children}
      </select>
      <span
        className="pointer-events-none absolute right-3 top-1/2 size-0 border-x-4 border-t-[5px] border-x-transparent border-t-[#9e9e9a] -translate-y-1/2"
        aria-hidden
      />
    </div>
  );
}

export function OutlineButton({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`rounded-[6px] border border-[#e8e8e6] bg-white px-[15px] py-[7px] text-[13px] font-medium text-[#1a1a18] transition-colors hover:bg-[#fafaf8] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`rounded-[6px] px-[15px] py-2 text-[13px] font-medium text-[#6b6b68] transition-colors hover:text-[#1a1a18] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function PrimaryButton({ children, className = '', icon: Icon, disabled, ...props }) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`inline-flex items-center gap-[7px] rounded-[6px] px-[18px] py-[9px] text-[13.5px] font-medium text-white transition-colors ${
        disabled ? 'cursor-not-allowed bg-[#6b6b68]' : 'bg-[#1a1a18] hover:bg-[#2c2c2e]'
      } ${className}`}
      {...props}
    >
      {Icon ? <Icon size={14} aria-hidden /> : null}
      {children}
    </button>
  );
}

export function DangerButton({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`rounded-[6px] border border-[#fecdcd] bg-[#fff5f5] px-[17px] py-[10px] text-[13px] font-medium text-[#c53030] transition-colors hover:bg-[#fee2e2] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function DangerOutlineButton({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`rounded-[6px] border border-[#fed7d7] bg-[#fff5f5] px-[15px] py-2 text-[13px] font-medium text-[#c53030] transition-colors hover:bg-[#fee2e2] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function TextLinkButton({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`rounded-[6px] px-[11px] py-1.5 text-[12.5px] font-medium text-[#c53030] transition-colors hover:bg-[#fff5f5] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function DangerRow({ title, description, action }) {
  return (
    <div className="flex flex-col gap-4 border-t border-[#fee2e2] px-7 py-[18px] first:border-t-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex flex-col gap-0.5">
        <p className="text-[13.5px] font-medium text-[#1a1a18]">{title}</p>
        <p className="text-[12.5px] text-[#6b6b68]">{description}</p>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

export function SessionRow({ icon: Icon, iconWrapClass, title, meta, badge, right, action, titleClass = 'text-[#1a1a18]' }) {
  return (
    <div className="flex flex-col gap-3 border-t border-[#f0f0ee] px-7 py-3.5 first:border-t-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3.5">
        <div className={`flex size-9 shrink-0 items-center justify-center rounded-[10px] border p-px ${iconWrapClass}`}>
          <Icon size={18} className="shrink-0 text-[#6b6b68]" aria-hidden />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className={`text-[13.5px] font-medium ${titleClass}`}>{title}</p>
            {badge}
          </div>
          <p className="text-[12px] text-[#9e9e9a]">{meta}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 sm:justify-end">
        {right}
        {action}
      </div>
    </div>
  );
}

export function IntegrationRow({ icon: Icon, iconWrapClass, title, description, actions }) {
  return (
    <div className="flex flex-col gap-4 border-b border-[#f0f0ee] px-7 py-[18px] last:border-b-0 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <div className={`flex size-[42px] shrink-0 items-center justify-center rounded-[10px] border p-px ${iconWrapClass}`}>
          <Icon size={18} className="shrink-0" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-[14px] font-medium text-[#1a1a18]">{title}</p>
          <p className="text-[12.5px] text-[#6b6b68]">{description}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2.5 lg:justify-end">{actions}</div>
    </div>
  );
}

export function SaveBar({ onDiscard, onSave, saveDisabled, saveLabel = 'Save changes' }) {
  return (
    <div className="flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
      <GhostButton type="button" onClick={onDiscard}>
        Discard changes
      </GhostButton>
      <PrimaryButton type="button" icon={RiCheckLine} disabled={saveDisabled} onClick={onSave}>
        {saveLabel}
      </PrimaryButton>
    </div>
  );
}

/** Figma 2439:3596–3599 badge + provider logos 2448:1063 / 1069 / 1075 */
export function AuthProviderAvatarBadge({ provider = 'google', className = '' }) {
  const logo = PROVIDER_LOGOS[provider] ?? PROVIDER_LOGOS.google;

  return (
    <span
      className={`absolute bottom-0 right-0 flex size-[22px] items-center justify-center rounded-full border-2 border-[#e8e8e6] bg-white ${className}`}
      role="img"
      aria-label={logo.label}
    >
      <img src={logo.src} alt="" className="size-[13px] shrink-0 object-contain" aria-hidden />
    </span>
  );
}

export function GoogleAvatarBadge(props) {
  return <AuthProviderAvatarBadge provider="google" {...props} />;
}
