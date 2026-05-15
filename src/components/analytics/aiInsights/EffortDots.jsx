export default function EffortDots({ filled, total = 5 }) {
  return (
    <div className="flex items-center gap-[3px]">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className="size-[6px] shrink-0 rounded-[3px]"
          style={{ backgroundColor: i < filled ? '#1a1a18' : '#e8e8e3' }}
          aria-hidden
        />
      ))}
    </div>
  );
}
