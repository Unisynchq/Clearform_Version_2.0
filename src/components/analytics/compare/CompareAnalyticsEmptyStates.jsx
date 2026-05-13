/**
 * Figma-driven empty states for Analytics compare (vectors + text; no bitmaps).
 * Ref: Clearform-Changes — Compare empty, Graph empty, Compare no forms.
 */

export function CompareBracketsGlyph({ className }) {
  return (
    <svg className={className} viewBox="0 0 22 22" fill="none" aria-hidden>
      <title>Compare</title>
      <path
        d="M6.5 4.5v13M4.5 6.2h2.2M4.5 15.8h2.2"
        stroke="currentColor"
        strokeWidth={1.85}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M11 4.5v13" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      <path
        d="M15.5 4.5v13M17.5 6.2h-2.2M17.5 15.8h-2.2"
        stroke="currentColor"
        strokeWidth={1.85}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ActivityPulseGlyph({ className }) {
  return (
    <svg className={className} viewBox="0 0 28 28" fill="none" aria-hidden>
      <title>No trend data</title>
      <path
        d="M4 17.5 L8.5 13l3.2 3.2 4.6-8.2L20.2 16l3.8-3.5"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Figma: Compare — empty state (node 1993:70393). */
export function SelectFormToCompareEmpty({ onAddForm, className = '' }) {
  return (
    <div
      className={`flex w-full flex-col items-center justify-center gap-3 rounded-[12px] bg-white px-6 py-10 text-center sm:py-14 ${className}`}
    >
      <div className="flex flex-col items-center pb-1">
        <div className="flex size-14 items-center justify-center rounded-[14px] border border-[#e4e1d9] bg-[#f2f0eb] text-[#38342e]">
          <CompareBracketsGlyph className="size-[22px]" />
        </div>
      </div>
      <p className="text-[14px] font-semibold leading-tight text-[#1a1814]">
        Select a form to compare
      </p>
      <p className="max-w-[280px] text-[12.5px] leading-[20px] text-[#a09c96]">
        Pick a previous version or different form above to see side-by-side metrics and trends.
      </p>
      <div className="pt-1">
        <button
          type="button"
          onClick={onAddForm}
          className="rounded-[6px] bg-[#1a1814] px-3 py-[6px] text-[12px] font-medium leading-none text-white transition-colors hover:bg-[#2f2c26] cursor-pointer"
        >
          + Add form to compare
        </button>
      </div>
    </div>
  );
}

/** Figma: Graph empty state (node 1993:70409). */
export function TrendMetricNoDataEmpty({
  metricLabel,
  suggestLabel,
  onTrySuggestedMetric,
  className = '',
}) {
  return (
    <div
      className={`flex w-full flex-col items-center justify-center gap-2.5 rounded-[8px] border border-dashed border-[#c8c4ba] bg-[#f2f0eb] px-4 pb-8 pt-[13px] text-center ${className}`}
    >
      <div className="text-[#848078]">
        <ActivityPulseGlyph className="size-7" />
      </div>
      <p className="text-[13px] font-semibold leading-tight text-[#1a1814]">
        {metricLabel} not tracked in this period
      </p>
      <p className="max-w-[320px] text-[12px] leading-snug text-[#a09c96]">
        Try switching to a different metric or adjusting the date range.
      </p>
      {onTrySuggestedMetric ? (
        <div className="pt-0.5">
          <button
            type="button"
            onClick={onTrySuggestedMetric}
            className="rounded-[6px] border border-[#e4e1d9] bg-transparent px-[11px] py-[5px] text-[11px] font-medium text-[#6b6760] transition-colors hover:bg-white/70 cursor-pointer"
          >
            Try {suggestLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** Figma: Compare — No forms / single workspace form (node 1993:70420). */
export function CompareNothingYetEmpty({ onCreateForm, className = '' }) {
  return (
    <section
      className={`relative flex min-h-[220px] w-full flex-col items-center justify-center overflow-hidden rounded-[12px] bg-white px-6 py-14 text-center ${className}`}
      aria-labelledby="compare-nothing-yet-heading"
    >
      <div className="mb-4 flex size-[52px] items-center justify-center rounded-[13px] border border-[#e4e1d9] bg-[#f2f0eb] text-[#38342e]">
        <CompareBracketsGlyph className="size-[22px]" />
      </div>
      <h2 id="compare-nothing-yet-heading" className="text-[14px] font-semibold text-[#1a1814]">
        Nothing to compare yet
      </h2>
      <p className="mt-2 max-w-[300px] text-[12.5px] leading-[21.25px] text-[#a09c96]">
        You only have one form right now. Create another form to start comparing performance across versions or
        surveys.
      </p>
      <div className="mt-4">
        <button
          type="button"
          onClick={onCreateForm}
          className="rounded-[6px] bg-[#1a1814] px-3 py-[6px] text-[12px] font-medium leading-none text-white transition-colors hover:bg-[#2f2c26] cursor-pointer"
        >
          + Create a new form
        </button>
      </div>
    </section>
  );
}

/** Compact empty compare slot in the picker row. */
export function CompareSlotEmptyCard({ slotLabel, onAddForm, isFocused = false }) {
  return (
    <div
      className={`flex min-h-[152px] min-w-[min(100%,180px)] flex-1 flex-col justify-between gap-3 rounded-[12px] border border-dashed bg-white p-4 outline-none focus-within:ring-2 focus-within:ring-[#4b43b0]/30 lg:min-w-[240px] lg:max-w-[min(420px,50%)] ${
        isFocused ? 'border-[#4b43b0] bg-[#eeedfe]' : 'border-[#dcdad4]'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-[12px] border border-[#e4e1d9] bg-[#f2f0eb] text-[#38342e]">
          <CompareBracketsGlyph className="size-[18px]" />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className={`text-[10px] font-semibold uppercase tracking-wide ${isFocused ? 'text-[#4b43b0]' : 'text-[#a8a6a0]'}`}>
            {slotLabel}
          </p>
          <p className="mt-1 text-[12.5px] font-semibold text-[#1a1814]">Select a form to compare</p>
          <p className="mt-1 text-[11px] leading-snug text-[#a09c96]">
            Pick another form to see side-by-side metrics.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onAddForm}
        className="w-full rounded-[6px] bg-[#1a1814] py-2 text-center text-[11px] font-medium text-white transition-colors hover:bg-[#2f2c26] cursor-pointer"
      >
        + Add form to compare
      </button>
    </div>
  );
}
