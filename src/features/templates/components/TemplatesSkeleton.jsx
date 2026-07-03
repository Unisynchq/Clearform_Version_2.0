const shimmer =
  'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.65),transparent)]';

const S = ({ className = '', style }) => (
  <div className={`bg-[#e5e3dc] ${shimmer} ${className}`} style={style} />
);

/* ── Single skeleton card cell inside the 2-col grid ── */
const CardCell = ({ titleRight, midRight, shortRight, tagWidth, borderRight, borderBottom }) => (
  <div
    className={`bg-white p-[12px] flex gap-[8px] items-start
      ${borderRight  ? 'border-r border-[#e5e3dc]' : ''}
      ${borderBottom ? 'border-b border-[#e5e3dc]' : ''}`}
  >
    {/* Icon square */}
    <S className="w-[24px] h-[24px] rounded-[4px] shrink-0" />

    {/* Text lines */}
    <div className="flex-1 min-w-0 relative" style={{ height: 72 }}>
      {/* Title */}
      <S className="absolute h-[10px] rounded-[3px] top-0 left-0" style={{ right: titleRight }} />
      {/* Body line 1 – full width */}
      <S className="absolute h-[8px] rounded-[3px] top-[15px] left-0 right-0" />
      {/* Body line 2 – medium */}
      <S className="absolute h-[8px] rounded-[3px] top-[26px] left-0" style={{ right: midRight }} />
      {/* Body line 3 – shorter */}
      <S className="absolute h-[8px] rounded-[3px] top-[42px] left-0" style={{ right: shortRight }} />
      {/* Category tag */}
      <S className="absolute h-[14px] rounded-[3px] top-[58px] left-0" style={{ width: tagWidth }} />
    </div>
  </div>
);

/* ── Full templates-page content skeleton ── */
const TemplatesSkeleton = () => (
  <div className="flex min-h-full flex-1 w-full flex-col bg-white">

    {/* Page title */}
    <div className="border-b border-[#e5e3dc] px-[32px] py-[20px] flex flex-col gap-[8px] shrink-0">
      <S className="w-[180px] h-[18px] rounded-[4px]" />
      <S className="w-[340px] h-[11px] rounded-[4px]" />
    </div>

    {/* Content */}
    <div className="px-[32px] py-[24px] flex flex-col gap-[12px]">

      {/* Search bar */}
      <S className="w-full h-[47px] rounded-[7px]" />

      {/* Filter chips */}
      <div className="flex items-center gap-[4px]">
        {[40, 120, 72, 88, 65, 48].map((w, i) => (
          <S key={i} className="h-[29px] rounded-[999px] shrink-0" style={{ width: w }} />
        ))}
      </div>

      {/* "Can't find" banner */}
      <S className="w-full h-[99px] rounded-[12px]" />

      {/* Card grid — 2 rows × 2 cols, matching Figma cells */}
      <div className="border border-[#e5e3dc] rounded-[8px] overflow-hidden">
        <div className="grid grid-cols-2">
          <CardCell titleRight="90px"  midRight="135px" shortRight="200px" tagWidth={60}  borderRight borderBottom />
          <CardCell titleRight="158px" midRight="90px"  shortRight="160px" tagWidth={70}  borderBottom />
          <CardCell titleRight="113px" midRight="180px" shortRight="113px" tagWidth={45}  borderRight />
          <CardCell titleRight="68px"  midRight="226px" shortRight="158px" tagWidth={55} />
        </div>
      </div>

    </div>
  </div>
);

export default TemplatesSkeleton;
