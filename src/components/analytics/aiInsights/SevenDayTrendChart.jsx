import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { dailySubmissionsCount } from '../analyticsDailySeries';
/** Figma 2241:19568 */
const CHART_H = 46.279;

function defaultHoverIndex(days) {
  if (!days.length) return 6;
  let best = 0;
  for (let i = 1; i < days.length; i += 1) {
    if (days[i].responses >= days[best].responses) best = i;
  }
  return best;
}

function buildDaysFromApi(sevenDayTrend) {
  if (!Array.isArray(sevenDayTrend) || sevenDayTrend.length === 0) return null;
  const maxCount = Math.max(1, ...sevenDayTrend.map((d) => dailySubmissionsCount(d)));
  return sevenDayTrend.map((d, index) => {
    const responses = dailySubmissionsCount(d);
    const height = Math.round((responses / maxCount) * 100) || 4;
    const isAccent = index >= 4;
    return {
      label: d.label ?? '',
      responses,
      height,
      color: isAccent ? '#1a6133' : index === 1 || index === 2 ? '#c5d9cc' : '#efecea',
      opacity: isAccent ? 0.6 : 1,
      isAccent,
    };
  });
}

function buildEmptyDaysFromApi() {
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return labels.map((label, index) => ({
    label,
    responses: 0,
    height: 12,
    color: index >= 4 ? '#1a6133' : index === 1 || index === 2 ? '#c5d9cc' : '#efecea',
    opacity: index >= 4 ? 0.6 : 1,
    isAccent: index >= 4,
  }));
}

export default function SevenDayTrendChart({ sevenDayTrend }) {
  const days = useMemo(() => {
    const fromApi = buildDaysFromApi(sevenDayTrend);
    if (fromApi) return fromApi;
    return buildEmptyDaysFromApi();
  }, [sevenDayTrend]);
  const [hovered, setHovered] = useState(() => defaultHoverIndex(days));

  useEffect(() => {
    setHovered(defaultHoverIndex(days));
  }, [days]);

  return (
    <div className="flex flex-col gap-[10.261px]">
      <p className="text-[13.502px] font-medium leading-[20.253px] tracking-[0.27px] text-[#99968e]">
        7-Day Trend
      </p>

      <div
        className="relative flex h-[46.279px] w-full items-end justify-center gap-[5.143px]"
        onMouseLeave={() => setHovered(defaultHoverIndex(days))}
      >
        {days.map((bar, i) => {
          const isHovered = hovered === i;
          const barPx = Math.max(4, (bar.height / 100) * CHART_H);

          return (
            <motion.div
              key={bar.label}
              className="relative flex h-full min-w-0 flex-1 flex-col items-center justify-end"
              onMouseEnter={() => setHovered(i)}
            >
              <AnimatePresence>
                {isHovered ? (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.16, ease: 'easeOut' }}
                    className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-[6px] bg-[#111] px-2 py-[5px] text-[10px] font-bold leading-normal text-white shadow-[0_4px_5px_rgba(0,0,0,0.2)]"
                  >
                    {bar.label} — {bar.responses} response{bar.responses === 1 ? '' : 's'}
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <div
                className="w-full min-w-0 rounded-t-[3.858px] transition-[box-shadow,opacity] duration-150"
                style={{
                  height: barPx,
                  backgroundColor: bar.color,
                  opacity: isHovered && bar.isAccent ? 0.85 : bar.opacity,
                  boxShadow:
                    isHovered && bar.isAccent
                      ? '0 0 0 2px rgba(26,97,51,0.28)'
                      : undefined,
                }}
                role="presentation"
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
