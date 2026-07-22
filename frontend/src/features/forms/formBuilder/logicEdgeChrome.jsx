import { RiCloseLine } from 'react-icons/ri';

/** × on the connection line — removes the wire only */
export const LogicEdgeLineDisconnectButton = ({
  x,
  y,
  onDisconnect,
  onPointerEnter,
  onPointerLeave,
}) => (
  <div
    data-logic-edge-disconnect
    className="absolute z-[11] flex items-center justify-center pointer-events-auto"
    style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
    onPointerDown={(e) => e.stopPropagation()}
  >
    <button
      type="button"
      aria-label="Disconnect connection"
      title="Disconnect connection"
      className="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-[#e6e4e0] bg-white p-0 text-[#5c5c58] hover:bg-[#fafaf9] hover:text-[#1a1a1a] cursor-pointer touch-none outline-none appearance-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]/35 focus-visible:ring-offset-1 [&::-moz-focus-inner]:border-0"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onClick={(e) => {
        e.stopPropagation();
        onDisconnect();
      }}
    >
      <RiCloseLine size={11} aria-hidden className="shrink-0 pointer-events-none" />
    </button>
  </div>
);

/** Edge pill: kind label + optional × to clear if-logic (wire stays) */
export const LogicEdgeControlPill = ({
  pillX,
  pillY,
  meta,
  showClearLogic,
  onClearLogic,
  onPillClick,
}) => (
  <div
    role="group"
    aria-label={`Connection ${meta.label}`}
    data-logic-edge-pill
    className="absolute z-[12] pointer-events-none"
    style={{
      left: pillX,
      top: pillY,
      transform: 'translate(-50%, -50%)',
      fontFamily: "'DM Sans', sans-serif",
    }}
  >
    <div
      className={`inline-flex flex-nowrap items-center gap-1.5 rounded-[10px] border border-solid border-[#cacaca] bg-[#e8ddfa] pl-2 pr-1.5 py-1 ${
        onPillClick ? 'pointer-events-auto cursor-pointer hover:bg-[#dfd0f8] transition-colors' : ''
      }`}
      onPointerDown={onPillClick ? (e) => e.stopPropagation() : undefined}
      onClick={
        onPillClick
          ? (e) => {
              e.stopPropagation();
              onPillClick();
            }
          : undefined
      }
      onKeyDown={
        onPillClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onPillClick();
              }
            }
          : undefined
      }
      role={onPillClick ? 'button' : undefined}
      tabIndex={onPillClick ? 0 : undefined}
    >
      <span className="inline-flex flex-nowrap items-center gap-1 shrink-0">
        <meta.Icon size={13} className="shrink-0 text-[#636363]" aria-hidden />
        <span className="text-[11px] font-medium leading-normal text-[#636363] whitespace-nowrap select-none">
          {meta.label}
        </span>
      </span>
      {showClearLogic ? (
        <button
          type="button"
          aria-label="Remove logic"
          title="Remove logic"
          className="flex size-[20px] shrink-0 items-center justify-center rounded-full border border-[#636363]/35 bg-transparent p-0 text-[#636363] hover:bg-white/45 cursor-pointer touch-none pointer-events-auto outline-none appearance-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]/35 focus-visible:ring-offset-1 [&::-moz-focus-inner]:border-0"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onClearLogic();
          }}
        >
          <RiCloseLine size={11} aria-hidden className="shrink-0 pointer-events-none" />
        </button>
      ) : null}
    </div>
  </div>
);
