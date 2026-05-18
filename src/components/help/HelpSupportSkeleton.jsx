const shimmer =
  'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.72),transparent)]';

function SkBar({ className = '', style }) {
  return (
    <div
      className={`rounded-[6px] bg-[#ebebea] ${shimmer} ${className}`}
      style={style}
      aria-hidden
    />
  );
}

export default function HelpSupportSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-[920px] px-8 pb-12 pt-8"
      aria-busy="true"
      aria-label="Loading help and support"
    >
      <header className="mb-7">
        <SkBar className="h-7 w-[200px]" />
        <SkBar className="mt-3 h-4 w-[min(100%,340px)]" />
      </header>

      <SkBar className="mb-3 h-3 w-[160px]" />

      <div className="overflow-hidden rounded-[10px] border border-[#e4e3df] bg-white">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className={`flex items-center justify-between gap-4 px-[18px] py-3.5 ${
              index < 5 ? 'border-b border-[#f0efeb]' : ''
            }`}
          >
            <SkBar className="h-3.5" style={{ width: `${58 + (index % 3) * 12}%`, maxWidth: '420px' }} />
            <SkBar className="h-3.5 w-3.5 shrink-0 rounded-[2px]" />
          </div>
        ))}
      </div>

      <SkBar className="mb-3 mt-7 h-3 w-[88px]" />

      <div className="flex flex-col gap-3">
        {[0, 1].map((card) => (
          <div key={card} className="rounded-[10px] border border-[#e4e3df] bg-white p-[19px]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-1 flex-col gap-2">
                <SkBar className="h-3.5 w-[100px]" />
                <SkBar className="h-3 w-full max-w-[280px]" />
                <SkBar className="h-3 w-[90%] max-w-[240px]" />
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                <SkBar className="h-[30px] w-[140px] rounded-[6px]" />
                {card === 1 ? <SkBar className="h-[30px] w-[180px] rounded-[6px]" /> : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
