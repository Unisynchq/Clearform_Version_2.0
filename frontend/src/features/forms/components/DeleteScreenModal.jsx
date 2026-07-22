import ProfileModal from '@/components/profile/ProfileModal';

/**
 * Form builder — confirm before deleting a screen (Figma: Clearform-Changes 1992:43986).
 */
export default function DeleteScreenModal({ open, screenLabel, onCancel, onConfirm }) {
  const quotedName = screenLabel?.trim() || 'this screen';

  return (
    <ProfileModal
      open={open}
      onClose={onCancel}
      widthClass="w-[min(100%,420px)]"
      className="rounded-[14px] border-0 p-0 shadow-[0px_4px_3px_rgba(0,0,0,0.04),0px_16px_20px_rgba(0,0,0,0.08)]"
    >
      <div className="flex flex-col gap-2 p-7" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <h2 className="text-[15px] font-semibold leading-[22.5px] text-[#141412]">
          Delete this screen?
        </h2>
        <p className="text-[13px] font-normal leading-[19.5px] text-[#5c5c56]">
          This will permanently remove &ldquo;{quotedName}&rdquo; and any logic rules that reference
          it. This action cannot be undone.
        </p>
        <div className="flex items-start justify-end gap-2 pt-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-[5px] border border-[#e2e2de] px-[13px] py-[6px] text-[12px] font-medium leading-normal text-[#5c5c56] transition-colors hover:bg-[#fafaf8]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-[5px] bg-[#e8271c] px-3 py-[6px] text-[12px] font-medium leading-normal text-white transition-colors hover:bg-[#d42218]"
          >
            Delete
          </button>
        </div>
      </div>
    </ProfileModal>
  );
}
