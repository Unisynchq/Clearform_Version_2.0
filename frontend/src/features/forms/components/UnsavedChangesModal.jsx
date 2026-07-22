import ProfileModal from '@/components/profile/ProfileModal';

const secondaryBtnClass =
  'rounded-[5px] border border-solid border-[#e2e2de] px-[13px] py-[6px] text-[12px] font-medium leading-normal text-[#5c5c56] transition-colors hover:bg-[#fafaf8]';

/**
 * Form builder — confirm before discarding edits (Figma: Clearform-Changes 1992:44001).
 */
export default function UnsavedChangesModal({
  open,
  onCancel,
  onDiscard,
  onSave,
  scope = 'screen',
}) {
  const screenTarget = scope === 'builder' ? 'this form' : 'this screen';

  return (
    <ProfileModal
      open={open}
      onClose={onCancel}
      widthClass="w-[min(100%,420px)]"
      className="rounded-[14px] border-0 p-0 shadow-[0px_4px_3px_rgba(0,0,0,0.04),0px_16px_20px_rgba(0,0,0,0.08)]"
    >
      <div
        className="flex flex-col gap-[8px] p-[28px]"
        style={{ fontFamily: "'DM Sans', sans-serif", fontVariationSettings: "'opsz' 14" }}
      >
        <h2 className="text-[15px] font-semibold leading-[22.5px] text-[#141412]">
          You have unsaved changes
        </h2>
        <div className="text-[13px] font-normal text-[#5c5c56]">
          <p className="mb-0 leading-[19.5px]">
            Leaving now will discard your changes to {screenTarget}.
          </p>
          <p className="leading-[19.5px]">Do you want to save before continuing?</p>
        </div>
        <div className="flex w-full items-start justify-end gap-[8px] pt-[12px]">
          <button type="button" onClick={onDiscard} className={secondaryBtnClass}>
            Discard
          </button>
          <button type="button" onClick={onCancel} className={secondaryBtnClass}>
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            className="rounded-[5px] bg-[#141412] px-[12px] py-[6px] text-[12px] font-medium leading-normal text-white transition-colors hover:bg-[#2a2a28]"
          >
            Save &amp; continue
          </button>
        </div>
      </div>
    </ProfileModal>
  );
}
