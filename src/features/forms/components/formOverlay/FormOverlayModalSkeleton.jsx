const shimmer =
  'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.65),transparent)]';

export const FormOverlayShimmer = ({ className = '' }) => (
  <div className={`bg-[#e5e3dc] ${shimmer} ${className}`} />
);

/** Form overview skeleton (shown while form data loads). */
export default function FormOverlayModalSkeleton() {
  const S = FormOverlayShimmer;
  return (
    <div className="bg-white border border-[#e5e3dc] rounded-[16px] w-[574px] overflow-hidden">
      <div className="bg-[#f4f3ef] border-b border-[#e5e3dc] px-[20px] pt-[20px] pb-[17px]">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-[16px]">
            <S className="w-[35px] h-[37px] rounded-[4px] shrink-0" />
            <div className="flex flex-col gap-[4px]">
              <S className="w-[196px] h-[19px] rounded-[4px]" />
              <div className="flex items-center gap-[8px] mt-[4px]">
                <S className="w-[53px] h-[9px] rounded-[4px]" />
                <span className="text-[#ddd] text-[12px]">·</span>
                <S className="w-[51px] h-[9px] rounded-[4px]" />
                <span className="text-[#ddd] text-[12px]">·</span>
                <S className="w-[74px] h-[9px] rounded-[4px]" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-[8px] shrink-0">
            <S className="w-[80px] h-[36px] rounded-[4px]" />
            <S className="w-[100px] h-[36px] rounded-[4px]" />
          </div>
        </div>
      </div>

      <div className="border-b border-[#e5e3dc] px-[24px] py-[12px] flex items-center justify-center gap-[20px]">
        <S className="w-[74px] h-[9px] rounded-[4px]" />
        <S className="w-[74px] h-[9px] rounded-[4px]" />
      </div>

      <div className="px-[24px] py-[20px] flex flex-col gap-[16px]">
        <div className="grid grid-cols-3 gap-[12px]">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="bg-[#f4f3ef] border border-[#e5e3dc] rounded-[12px] px-[17px] py-[13px] flex flex-col gap-[8px]"
            >
              <S className="w-[74px] h-[9px] rounded-[4px]" />
              <S className="w-[54px] h-[26px] rounded-[4px]" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-[12px]">
          <div className="bg-[#f4f3ef] border border-[#e5e3dc] rounded-[12px] p-[17px] flex flex-col gap-[12px]">
            <S className="w-[135px] h-[11px] rounded-[4px]" />
            <div className="flex items-center gap-[12px]">
              <S className="w-[52px] h-[52px] rounded-full shrink-0" />
              <div className="flex flex-col gap-[6px] flex-1 min-w-0">
                <S className="w-full h-[5px] rounded-[4px]" />
                <S className="w-[97px] h-[9px] rounded-[4px]" />
              </div>
            </div>
          </div>
          <div className="bg-[#f4f3ef] border border-[#e5e3dc] rounded-[12px] p-[17px] flex flex-col gap-[12px]">
            <S className="w-[135px] h-[11px] rounded-[4px]" />
            <div className="flex items-center gap-[12px]">
              <S className="w-[52px] h-[52px] rounded-[12px] shrink-0" />
              <S className="flex-1 h-[36px] rounded-[4px] min-w-0" />
            </div>
          </div>
        </div>

        <S className="w-full h-[64px] rounded-[12px]" />
      </div>
    </div>
  );
}
