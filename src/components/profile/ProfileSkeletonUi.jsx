/** Figma profile loading bars — #ebebea base + shimmer (nodes 2477:1967–3411) */

export const PROFILE_SHIMMER =
  'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.72),transparent)]';

export function SkBar({ className = '', style, shimmer = true }) {
  return (
    <div
      className={`rounded-[6px] ${shimmer ? `bg-[#ebebea] ${PROFILE_SHIMMER}` : 'bg-[#ebebea]'} ${className}`}
      style={style}
      aria-hidden
    />
  );
}

export function SkBlock({ className = '', rounded = 'rounded-[6px]', style, shimmer = true }) {
  return <SkBar className={`${rounded} ${className}`} style={style} shimmer={shimmer} />;
}

export function SkCircle({ size = 52, className = '' }) {
  return (
    <div
      className={`shrink-0 rounded-full bg-[#ebebea] opacity-[0.93] ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}

/** Toggle pill — on = dark gradient shimmer, off = flat #ebebea */
export function SkToggle({ on = false }) {
  return (
    <SkBar
      shimmer={on}
      className={`h-5 w-9 shrink-0 rounded-[20px] ${on ? '!bg-[#2a2a28]' : ''}`}
    />
  );
}

export function SkIconBox({ size = 32 }) {
  return (
    <div
      className="shrink-0 rounded-[6px] bg-[#ebebea] opacity-[0.88]"
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}
