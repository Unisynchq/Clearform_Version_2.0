import { RiAlertLine } from 'react-icons/ri';
import ProfileModal from '@/components/profile/ProfileModal';

const outlineBtnClass =
  'rounded-[8px] border border-[#d0d0d0] bg-white px-[19px] py-[10px] text-[13px] font-bold text-[#111] transition-colors hover:bg-[#fafaf8]';

const destructiveBtnClass =
  'rounded-[8px] border border-[#c0392b] bg-[#fff3f3] px-[18px] py-[10px] text-[13px] font-bold text-[#c0392b] transition-colors hover:bg-[#fee2e2]';

/**
 * Profile — confirm discarding unsaved profile edits (Figma 2439:4660).
 */
export default function DiscardChangesModal({ open, onKeepEditing, onDiscard }) {
  return (
    <ProfileModal
      open={open}
      onClose={onKeepEditing}
      widthClass="w-[min(100%,360px)]"
      className="overflow-hidden rounded-[12px] border border-[#ebebeb] p-0 shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
    >
      <div className="flex flex-col items-center px-8 py-12 text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-[16px] bg-[#fff3f3]">
          <RiAlertLine className="text-[#c0392b]" size={24} aria-hidden />
        </div>
        <h2 className="pb-1.5 text-[15px] font-bold text-[#c0392b]">Discard Changes?</h2>
        <p className="max-w-[280px] text-[13px] leading-[20.8px] text-[#999]">
          You&apos;ve made changes to your profile that haven&apos;t been saved. If you leave now,
          those changes will be lost.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <button type="button" onClick={onKeepEditing} className={outlineBtnClass}>
            Keep Editing
          </button>
          <button type="button" onClick={onDiscard} className={destructiveBtnClass}>
            Discard Changes
          </button>
        </div>
      </div>
    </ProfileModal>
  );
}
