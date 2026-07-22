import { RiAlertLine } from 'react-icons/ri';
import ProfileModal from '../profile/ProfileModal';

function ActionSpinner({ className = 'size-4' }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.35" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Figma-style confirmation modal (revoke sessions, pause/delete form, etc.)
 */
export default function ConfirmActionModal({
  open,
  onCancel,
  onConfirm,
  isLoading = false,
  title,
  warning,
  confirmLabel,
  loadingLabel,
  confirmIcon: ConfirmIcon,
  headerIcon: HeaderIcon = RiAlertLine,
  headerIconClass = 'bg-[#fdecea] text-[#c53030]',
  confirmClassName = 'bg-[#e05c4b] text-white hover:bg-[#d14f3f]',
  widthClass = 'w-[min(100%,420px)]',
}) {
  const busyLabel = loadingLabel ?? `${confirmLabel}…`;

  return (
    <ProfileModal
      open={open}
      onClose={isLoading ? () => {} : onCancel}
      widthClass={widthClass}
      className="overflow-hidden rounded-[16px] border border-[#e0ddd7] p-0 shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
    >
      <div className="flex items-center gap-3 px-6 py-6">
        <div
          className={`flex size-9 shrink-0 items-center justify-center rounded-[10px] ${headerIconClass}`}
        >
          <HeaderIcon size={16} aria-hidden />
        </div>
        <h2 className="text-[16px] font-semibold leading-[21.6px] text-[#1a1917]">{title}</h2>
      </div>

      <div className="h-px w-full bg-[#f0ede8]" aria-hidden />

      <div className="px-6 pb-5 pt-4">
        <div className="flex gap-2 rounded-[10px] border border-[#f5d18c] bg-[#fef6e4] px-[13px] py-[11px]">
          <RiAlertLine size={16} className="mt-0.5 shrink-0 text-[#7a4500]" aria-hidden />
          <p className="text-[12px] leading-[18.6px] text-[#7a4500]">{warning}</p>
        </div>
      </div>

      <div className="h-px w-full bg-[#f0ede8]" aria-hidden />

      <div className="flex gap-2 px-6 pb-5 pt-4">
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          aria-busy={isLoading}
          className={`flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[10px] px-4 text-[14px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${confirmClassName}`}
        >
          {isLoading ? (
            <ActionSpinner />
          ) : ConfirmIcon ? (
            <ConfirmIcon size={16} aria-hidden />
          ) : null}
          {isLoading ? busyLabel : confirmLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="h-9 w-[92px] shrink-0 rounded-[10px] border border-[#e0ddd7] bg-white px-[17px] text-[14px] font-medium text-[#888780] transition-colors hover:bg-[#fafaf8] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </ProfileModal>
  );
}
