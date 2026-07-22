import { RiAlertLine, RiUploadCloud2Line } from 'react-icons/ri';

/**
 * Profile photo upload failure (Figma 2439:4640).
 */
export default function PhotoUploadErrorZone({ title, detail }) {
  return (
    <div className="w-full overflow-hidden rounded-[12px] border-2 border-dashed border-[#c53031] bg-[#fff5f5] px-6 py-10 text-center">
      <RiUploadCloud2Line className="mx-auto text-[#c53030]" size={24} aria-hidden />
      <p className="mt-3 text-[16px] font-medium text-[#c53030]">{title}</p>
      <p className="mt-2 text-[12.5px] font-medium text-[#d66b6b]">{detail}</p>
    </div>
  );
}

export function PhotoAvatarError() {
  return (
    <div className="flex size-16 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-[rgba(255,116,117,0.87)] bg-[#fff5f5] p-0.5">
      <RiAlertLine className="text-[#c53030]" size={18} aria-hidden />
    </div>
  );
}
