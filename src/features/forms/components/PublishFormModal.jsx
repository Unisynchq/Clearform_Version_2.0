import { RiArrowRightLine } from 'react-icons/ri';
import ProfileModal from '@/components/profile/ProfileModal';

/**
 * Form builder — confirm before publishing (Figma: Clearform-Changes 2686:4920).
 */
export default function PublishFormModal({ open, onCancel, onConfirm }) {
  return (
    <ProfileModal
      open={open}
      onClose={onCancel}
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
            onClick={onCancel}
            className="rounded-[5px] border border-[#e2e2de] px-[13px] py-[6px] text-[12px] font-medium leading-normal text-[#5c5c56] transition-colors hover:bg-[#fafaf8]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center gap-1 rounded-[5px] bg-[#141412] px-3 py-[6px] text-[12px] font-medium leading-normal text-white transition-colors hover:bg-[#2c2c2c]"
          >
            Publish
            <RiArrowRightLine size={14} className="shrink-0" aria-hidden />
          </button>
        </div>
      </div>
    </ProfileModal>
  );
}
