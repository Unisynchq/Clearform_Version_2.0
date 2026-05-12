const shimmer =
  'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.65),transparent)]';

function SkeletonBar({ className = '', style }) {
  return (
    <div className={`rounded-[4px] bg-[#ece9e4] ${shimmer} ${className}`} style={style} />
  );
}

export function AnalyticsPerformanceSkeleton() {
  return (
    <div className="flex flex-col gap-5 max-w-[1400px] mx-auto animate-pulse">
      <section className="bg-white rounded-[10px] px-4 py-4 grid grid-cols-1 md:grid-cols-3 gap-6 border border-[#e8e6e1]/80">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`flex flex-col gap-2 ${i > 0 ? 'md:border-l md:border-[#e8e6e1] md:pl-6' : ''}`}>
            <SkeletonBar className="h-2.5 w-[90px]" />
            <SkeletonBar className="h-9 w-[72px]" />
            <SkeletonBar className="h-2.5 w-[110px]" />
          </div>
        ))}
      </section>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white rounded-[10px] border border-[#e8e6e1] p-4 min-h-[380px] flex flex-col gap-3">
          <SkeletonBar className="h-3 w-[100px]" />
          <div className="flex flex-col gap-1 flex-1 justify-center items-center py-6">
            {[466, 392, 304, 216, 147].map((w, idx) => (
              <SkeletonBar key={idx} className="h-11 max-w-full" style={{ width: `${w}px` }} />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <SkeletonBar className="h-14 w-full" />
            <SkeletonBar className="h-14 w-full" />
            <SkeletonBar className="h-14 w-full" />
          </div>
        </div>
        <div className="bg-white rounded-[10px] border border-[#e8e6e1] p-4 min-h-[380px] relative overflow-hidden">
          <div className="flex gap-2 mb-4">
            <SkeletonBar className="h-6 w-24 rounded-full" />
            <SkeletonBar className="h-6 w-24 rounded-full" />
            <SkeletonBar className="h-6 w-24 rounded-full" />
          </div>
          <SkeletonBar className="h-8 w-[70px] mb-2" />
          <SkeletonBar className="h-2.5 w-[140px] mb-3" />
          <SkeletonBar className="h-6 w-[160px] rounded-full mb-4" />
          <SkeletonBar className="h-9 w-full mb-6 rounded-[6px]" />
          <div className="absolute bottom-6 left-4 right-8 flex items-end justify-between gap-1 h-[156px]">
            {Array.from({ length: 14 }).map((_, i) => (
              <SkeletonBar key={i} className="flex-1 rounded-t-[3px]" style={{ height: `${24 + (i * 7) % 56}px` }} />
            ))}
          </div>
        </div>
      </div>
      <div className="rounded-[10px] border border-[#e8e6e1] bg-white p-4 flex flex-col gap-4">
        <SkeletonBar className="h-3 w-[160px]" />
        <div className="flex gap-2">
          {[40, 60, 52, 58].map((w) => (
            <SkeletonBar key={w} className="h-6 rounded-full" style={{ width: `${w}px` }} />
          ))}
        </div>
        <SkeletonBar className="h-[251px] w-full rounded-[6px]" />
      </div>
    </div>
  );
}

export function AnalyticsPerformanceEmpty({ onPreview, onShare }) {
  return (
    <div className="flex flex-col gap-5 max-w-[1400px] mx-auto">
      <section className="bg-white rounded-[10px] px-4 py-4 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0 border border-[#eceae4]/60">
        {[
          { label: 'Total responses', sub: 'target' },
          { label: 'Completion rate', sub: 'Industry avg.' },
          { label: 'Avg. time', sub: '—' },
        ].map((col, i) => (
          <div
            key={col.label}
            className={`flex flex-col gap-[5px] ${i > 0 ? 'md:border-l-2 md:border-[#e9e7e0] md:pl-6' : ''}`}
          >
            <p className="text-[12px] font-medium text-[#646464] tracking-[0.22px]">{col.label}</p>
            <p className="text-[34px] font-medium text-[#a8a6a0] tracking-[-1.36px] leading-[34px]">—</p>
            <p className="text-[11.5px] text-[#646464]">{col.sub}</p>
          </div>
        ))}
      </section>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-stretch">
        <div className="bg-white rounded-[10px] border border-[#eceae4] px-8 py-12 flex flex-col items-center justify-center text-center gap-4 min-h-[320px]">
          <div className="w-14 h-14 rounded-[12px] bg-[#f7f6f2] border border-[#e5e3dc] flex items-center justify-center text-[#a8a6a0] text-xl font-light">
            ⧗
          </div>
          <div className="flex flex-col gap-1 max-w-[280px]">
            <p className="text-[15px] font-semibold text-[#1a1a1c]">No funnel data yet</p>
            <p className="text-[13px] text-[#6b6966] leading-relaxed">
              Once your survey receives responses, the funnel will populate here.
            </p>
          </div>
          <button
            type="button"
            onClick={onPreview}
            className="mt-1 px-4 py-2 rounded-[8px] border border-[#96948d] text-[13px] font-medium text-[#393939] hover:bg-[#f4f3ef] cursor-pointer"
          >
            Preview survey
          </button>
        </div>
        <div className="bg-white rounded-[20px] border border-[#ebebeb] overflow-hidden flex flex-col items-center justify-center text-center gap-4 px-8 py-12 min-h-[320px]">
          <div className="w-14 h-14 rounded-[12px] bg-[#f7f6f2] border border-[#e5e3dc] flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-[#a8a6a0]">
              <path d="M4 18V6M8 18V10M12 18v-4M16 18V8M20 18v-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex flex-col gap-1 max-w-[280px]">
            <p className="text-[15px] font-semibold text-[#1a1a1c]">No chart data yet</p>
            <p className="text-[13px] text-[#6b6966] leading-relaxed">
              Once responses arrive, your daily trends will appear here.
            </p>
          </div>
        </div>
      </div>
      <section className="bg-[#fafaf8] border border-[#e8e8e5] rounded-[10px] p-8 flex flex-col items-center justify-center text-center gap-4 min-h-[220px] shadow-[0_2px_2px_rgba(0,0,0,0.06)]">
        <p className="text-[10px] font-semibold text-[#888780] tracking-[0.7px] uppercase">
          Question drop-off river
        </p>
        <div className="border border-dashed border-[#d8d6d0] rounded-[10px] bg-[#f7f6f2]/80 w-full max-w-[520px] py-10 px-6 flex flex-col items-center gap-3">
          <span className="text-2xl text-[#c9c7bf]" aria-hidden>
            〜
          </span>
          <p className="text-[15px] font-semibold text-[#1a1a1c]">Drop-off river unavailable</p>
          <p className="text-[13px] text-[#6b6966] max-w-[360px] leading-relaxed">
            You need at least 10 responses to generate the question drop-off visualization.
          </p>
          <button
            type="button"
            onClick={onShare}
            className="mt-2 px-4 py-2.5 rounded-[8px] bg-[#17160e] text-[13px] font-medium text-white hover:bg-[#2c2c2e] cursor-pointer"
          >
            Share survey
          </button>
        </div>
      </section>
    </div>
  );
}
