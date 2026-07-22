const shimmer =
  'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent)]';

/** Figma-style gradient bar with shimmer overlay */
export const SkBar = ({ className = '', style }) => (
  <div
    className={`shrink-0 rounded-[6px] bg-gradient-to-r from-[#ebebea] via-[#f5f5f3] to-[#ebebea] ${shimmer} ${className}`}
    style={style}
    aria-hidden
  />
);

export const SkCircle = ({ className = '' }) => (
  <div
    className={`shrink-0 rounded-full bg-[#ebebea] opacity-90 ${shimmer} ${className}`}
    aria-hidden
  />
);

export const SkBlock = ({ className = '' }) => (
  <div className={`bg-[#ebebea] ${shimmer} ${className}`} aria-hidden />
);

export const SkCard = ({ children, className = '' }) => (
  <section
    className={`overflow-hidden rounded-[14px] border border-[#e8e8e6] bg-white ${className}`}
    aria-busy="true"
    aria-label="Loading"
  >
    {children}
  </section>
);

export const SkCardHeader = () => (
  <div className="border-b border-[#f0f0ee] px-7 pb-[18px] pt-[22px]">
    <SkBar className="h-[14px] w-[140px]" />
    <SkBar className="mt-2 h-[10px] w-[230px]" />
  </div>
);

export const SkFieldColumn = ({ labelWidth = 'w-[80px]' }) => (
  <div className="flex flex-col gap-1.5">
    <SkBar className={`h-3 ${labelWidth}`} />
    <SkBar className="h-9 w-full" />
  </div>
);

export const SkFooterActions = () => (
  <div className="flex justify-end gap-2.5 border-t border-[#eeede9] px-7 pb-6 pt-5">
    <SkBar className="h-8 w-[110px]" />
    <SkBar className="h-8 w-[110px] bg-gradient-to-r from-[#d0d0ce] via-[#e0e0dd] to-[#d0d0ce]" />
  </div>
);
