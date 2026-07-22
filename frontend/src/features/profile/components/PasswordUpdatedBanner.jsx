import { RiCheckboxCircleLine } from 'react-icons/ri';

/**
 * Security tab — password change success (Figma 2439:3846).
 */
export default function PasswordUpdatedBanner({ onDismiss }) {
  return (
    <div
      className="flex gap-3 rounded-[8px] border border-[#1a4731] bg-[#d6f0e0] px-4 py-4"
      role="status"
    >
      <RiCheckboxCircleLine
        className="mt-0.5 size-5 shrink-0 text-[#1a4731]"
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-[#1a4731]">Password updated successfully</p>
        <p className="mt-1 text-[13px] leading-[19.5px] text-[#1a4731]">
          Your password has been updated. Other sessions have been signed out for security.
        </p>
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-[12px] font-medium text-[#1a4731] hover:underline"
        >
          Dismiss
        </button>
      ) : null}
    </div>
  );
}
