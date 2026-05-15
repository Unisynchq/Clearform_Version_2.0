import { RiErrorWarningLine } from 'react-icons/ri';
import ProfileModal from './ProfileModal';
import { OutlineButton } from './ProfileSettingsUi';

export default function DiscardChangesModal({ open, onDiscard, onKeepEditing }) {
  return (
    <ProfileModal open={open} onClose={onKeepEditing} className="p-8" widthClass="w-[min(100%,440px)]">
      <div className="flex flex-col items-center text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-[#f7f7f6]">
          <RiErrorWarningLine size={24} className="text-[#6b6b68]" aria-hidden />
        </div>
        <h2 className="mt-4 text-[16px] font-semibold text-[#1a1a18]">Discard Changes?</h2>
        <p className="mt-2 max-w-[280px] text-[13px] leading-[21px] text-[#6b6b68]">
          You&apos;ve made changes to your profile that haven&apos;t been saved. If you leave now, those
          changes will be lost.
        </p>
        <div className="mt-6 flex w-full gap-2.5">
          <OutlineButton type="button" className="flex-1 py-2" onClick={onKeepEditing}>
            Keep Editing
          </OutlineButton>
          <button
            type="button"
            onClick={onDiscard}
            className="flex-1 rounded-[6px] border border-[#e8e8e6] bg-white px-4 py-2 text-[13px] font-medium text-[#1a1a18] transition-colors hover:bg-[#fafaf8]"
          >
            Discard Changes
          </button>
        </div>
      </div>
    </ProfileModal>
  );
}
