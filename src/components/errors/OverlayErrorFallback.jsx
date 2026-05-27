const OverlayErrorFallback = ({ onRetry }) => (
  <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/25 p-6">
    <div className="max-w-sm rounded-[12px] border border-[#e5e3dc] bg-white p-6 text-center shadow-lg">
      <p className="text-[15px] font-semibold text-[#1a1a18]">Something went wrong</p>
      <p className="mt-2 text-[13px] text-[#6b6b68]">
        A dialog failed to load. Your dashboard is still available.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-[8px] bg-[#1a1a18] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#2d2d2b]"
      >
        Try again
      </button>
    </div>
  </div>
);

export default OverlayErrorFallback;
