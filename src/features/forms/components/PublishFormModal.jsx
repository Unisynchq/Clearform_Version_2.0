import { useCallback, useEffect, useState } from 'react';
import { RiArrowRightLine } from 'react-icons/ri';
import ProfileModal from '@/components/profile/ProfileModal';

function ActionSpinner({ className = 'size-3.5' }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.35" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Form builder — confirm before publishing (Figma: Clearform-Changes 2686:4920).
 */
export default function PublishFormModal({ open, onCancel, onConfirm }) {
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (!open) setIsPublishing(false);
  }, [open]);

  const handleCancel = useCallback(() => {
    if (isPublishing) return;
    onCancel?.();
  }, [isPublishing, onCancel]);

  const handlePublish = useCallback(async () => {
    if (isPublishing) return;
    setIsPublishing(true);
    try {
      await onConfirm?.();
    } catch {
      setIsPublishing(false);
    }
  }, [isPublishing, onConfirm]);

  return (
    <ProfileModal
      open={open}
      onClose={isPublishing ? () => {} : handleCancel}
      widthClass="w-[min(100%,420px)]"
      className="rounded-[14px] border-0 p-0 shadow-[0px_4px_3px_rgba(0,0,0,0.04),0px_16px_20px_rgba(0,0,0,0.08)]"
    >
      <div
        className="flex flex-col gap-2 p-7"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <h2 className="text-[15px] font-semibold leading-[22.5px] text-[#141412]">
          Publish form?
        </h2>
        <div className="text-[13px] font-normal leading-[19.5px] text-[#5c5c56]">
          <p>Your form will be live and accessible to respondents.</p>
          <p>You can always unpublish or update it later.</p>
        </div>
        <div className="flex items-start justify-end gap-2 pt-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isPublishing}
            className="rounded-[5px] border border-[#e2e2de] px-[13px] py-[6px] text-[12px] font-medium leading-normal text-[#5c5c56] transition-colors hover:bg-[#fafaf8] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing}
            aria-busy={isPublishing}
            className="inline-flex items-center gap-1 rounded-[5px] bg-[#141412] px-3 py-[6px] text-[12px] font-medium leading-normal text-white transition-colors hover:bg-[#2c2c2c] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPublishing ? (
              <ActionSpinner />
            ) : (
              <RiArrowRightLine size={14} className="shrink-0" aria-hidden />
            )}
            {isPublishing ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>
    </ProfileModal>
  );
}
