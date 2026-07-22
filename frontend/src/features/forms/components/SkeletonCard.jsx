const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent)]';

const SkeletonCard = () => (
  <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[14px] overflow-hidden flex flex-col">
    {/* Thumbnail placeholder */}
    <div className={`h-[100px] bg-[#ece9e3] ${shimmer}`} />
    {/* Body placeholder */}
    <div className="px-[14px] py-3 flex flex-col gap-3">
      <div className={`h-[13px] bg-[#ece9e3] rounded-full w-3/4 ${shimmer}`} />
      <div className="flex items-center justify-between">
        <div className={`h-[11px] bg-[#ece9e3] rounded-full w-1/3 ${shimmer}`} />
        <div className={`h-[11px] bg-[#ece9e3] rounded-full w-1/5 ${shimmer}`} />
      </div>
    </div>
  </div>
);

export const SkeletonGrid = ({ count = 6 }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pt-4">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export const SkeletonList = ({ count = 6 }) => (
  <div className="bg-white border border-[#e5e3dc] rounded-[12px] overflow-hidden mt-4">
    {/* Header */}
    <div className="bg-[#f4f3ef] border-b border-[#e5e3dc] px-4 py-2 grid grid-cols-[2fr_1fr_1fr_1fr_40px] gap-4">
      {['FORM NAME', 'STATUS', 'RESPONSES', 'LAST UPDATED', ''].map((col) => (
        <span key={col} className="text-[10px] font-semibold text-[#a8a6a0] tracking-[0.6px] uppercase">
          {col}
        </span>
      ))}
    </div>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="grid grid-cols-[2fr_1fr_1fr_1fr_40px] gap-4 px-4 py-[14px] border-b border-[#e5e3dc] last:border-b-0 items-center"
      >
        <div className="flex items-center gap-3">
          <div className={`w-7 h-7 rounded-[7px] bg-[#ece9e3] shrink-0 ${shimmer}`} />
          <div className={`h-[13px] bg-[#ece9e3] rounded-full w-40 ${shimmer}`} />
        </div>
        <div className={`h-[22px] bg-[#ece9e3] rounded-full w-12 ${shimmer}`} />
        <div className={`h-[13px] bg-[#ece9e3] rounded-full w-24 ${shimmer}`} />
        <div className={`h-[13px] bg-[#ece9e3] rounded-full w-12 ${shimmer}`} />
        <div />
      </div>
    ))}
  </div>
);

export default SkeletonCard;
