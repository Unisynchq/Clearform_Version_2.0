/** Default empty-canvas background — matches `designBackground` initial state in FormBuilderPage */
export const BUILDER_EMPTY_CANVAS_BG = '#f0eee8';

const ghost = 'animate-pulse bg-gray-200';

/**
 * Pixel-perfect ghost of the form builder empty state (no screens yet).
 * Mirrors: top header, tab bar, full-width canvas, centered CTA ghosts, footer strip.
 */
export default function FormBuilderLayoutSkeleton() {
  return (
    <div
      className="flex flex-col h-screen overflow-hidden bg-white"
      aria-busy="true"
      aria-label="Loading form builder"
    >
      {/* Top header — h-[48px], logo + Back / Publish */}
      <header className="h-[48px] shrink-0 bg-white border-b border-[#e4e2dc] flex items-center px-6 z-10 gap-4">
        <div className={`h-[26px] w-[108px] rounded-[4px] ${ghost}`} aria-hidden />
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <div className={`h-[34px] w-[56px] rounded-[8px] ${ghost}`} aria-hidden />
          <div className={`h-[34px] w-[88px] rounded-[8px] ${ghost}`} aria-hidden />
        </div>
      </header>

      {/* Full-width body — no screens sidebar, no configure panel */}
      <div className="relative flex flex-1 min-w-0 overflow-hidden min-h-0">
        <div className="flex-1 flex flex-col overflow-hidden min-w-0 relative bg-white">
          {/* Tab bar — h-[40px]: Content, Design, Logic, Settings + form title chip */}
          <div className="bg-white border-b border-[rgba(226,232,240,0.8)] flex items-center justify-between gap-3 px-[7px] pr-4 h-[40px] shrink-0">
            <div className="flex items-center gap-[6px] h-full min-w-0">
              <div className={`h-[20px] w-[76px] rounded-[4px] ${ghost}`} aria-hidden />
              <div className={`h-[20px] w-[58px] rounded-[4px] ${ghost}`} aria-hidden />
              <div className={`h-[20px] w-[50px] rounded-[4px] ${ghost}`} aria-hidden />
              <div className={`h-[20px] w-[64px] rounded-[4px] ${ghost}`} aria-hidden />
            </div>
            <div className={`h-[25px] w-[min(140px,28vw)] max-w-[280px] rounded-[6px] shrink-0 ${ghost}`} aria-hidden />
          </div>

          {/* Empty canvas — same background as loaded empty state */}
          <div
            className="flex-1 flex items-center justify-center overflow-hidden min-h-0"
            style={{ backgroundColor: BUILDER_EMPTY_CANVAS_BG }}
          >
            <div className="flex flex-col items-center gap-4">
              <div className={`w-48 h-4 rounded-[4px] ${ghost}`} aria-hidden />
              <div className={`w-32 h-10 rounded-[6px] ${ghost}`} aria-hidden />
            </div>
          </div>

          {/* Footer — h-[51px], "No screens added yet" */}
          <div className="h-[51px] shrink-0 border-t border-[#e4e2dc] flex items-center justify-center px-6 bg-white">
            <div className={`h-3 w-[128px] rounded-[4px] ${ghost}`} aria-hidden />
          </div>
        </div>
      </div>
    </div>
  );
}
