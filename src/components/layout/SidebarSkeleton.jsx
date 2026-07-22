const shimmer =
  'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.65),transparent)]';

const S = ({ className = '', style }) => (
  <div className={`bg-[#e5e3dc] ${shimmer} ${className}`} style={style} />
);

const SidebarSkeleton = () => (
  <div className="flex flex-col h-full">
    {/* Logo row */}
    <div className="h-[52px] shrink-0 border-b border-[#e5e3dc] flex items-center gap-[8px] px-4">
      <S className="w-[20px] h-[20px] rounded-[4px] shrink-0" />
      <S className="w-[60px] h-[11px] rounded-[4px]" />
    </div>

    {/* Nav items */}
    <div className="flex-1 py-[13px] px-2 flex flex-col gap-[8px]">
      {/* Primary nav — 4 items */}
      {[100, 80, 90, 85].map((pct, i) => (
        <S key={i} className="h-[32px] rounded-[8px]" style={{ width: `${pct}%` }} />
      ))}

      <div className="h-px bg-[#e5e3dc] mx-1 my-[4px]" />

      {/* Secondary nav — 2 items */}
      <S className="h-[32px] rounded-[8px] w-full" />
      <S className="h-[32px] rounded-[8px] w-full" />

      {/* Section label */}
      <S className="w-[72px] h-[9px] rounded-[3px] mx-2 mt-[6px]" />

      {/* Analytics item */}
      <S className="h-[32px] rounded-[8px] w-full" />
    </div>

    {/* Footer */}
    <div className="border-t border-[#e5e3dc] px-2 py-[14px] flex flex-col gap-[8px]">
      <S className="h-[32px] rounded-[8px] w-full" />
      <S className="h-[32px] rounded-[8px] w-full" />
    </div>
  </div>
);

export default SidebarSkeleton;
