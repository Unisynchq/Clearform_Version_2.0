import { useNavigate } from 'react-router-dom';

const shellClass = 'flex h-full min-h-[280px] flex-col items-center justify-center gap-3 bg-[#f4f3ef] p-8 text-center';

export const DashboardErrorFallback = ({ onRetry }) => {
  const navigate = useNavigate();
  return (
    <div className={shellClass}>
      <p className="text-[16px] font-semibold text-[#111110]">This page hit an error</p>
      <p className="max-w-md text-[14px] text-[#6e6d67]">
        Your forms and settings are safe. You can retry or return to All forms.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
        <button
          type="button"
          onClick={onRetry}
          className="rounded-[8px] bg-[#1a1a18] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#2d2d2b]"
        >
          Try again
        </button>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="rounded-[8px] border border-[#e5e3dc] bg-white px-4 py-2 text-[13px] font-medium text-[#1a1a18] hover:bg-[#f4f3ef]"
        >
          All forms
        </button>
      </div>
    </div>
  );
};

export const BuilderErrorFallback = ({ onRetry }) => {
  const navigate = useNavigate();
  return (
    <div className={shellClass}>
      <p className="text-[16px] font-semibold text-[#111110]">Form builder unavailable</p>
      <p className="max-w-md text-[14px] text-[#6e6d67]">
        The editor could not load. Open the form again from your dashboard.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
        <button
          type="button"
          onClick={onRetry}
          className="rounded-[8px] bg-[#1a1a18] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#2d2d2b]"
        >
          Try again
        </button>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="rounded-[8px] border border-[#e5e3dc] bg-white px-4 py-2 text-[13px] font-medium text-[#1a1a18] hover:bg-[#f4f3ef]"
        >
          Back to dashboard
        </button>
      </div>
    </div>
  );
};

export const PublicFormErrorFallback = ({ onRetry }) => (
  <div className={`min-h-screen ${shellClass}`}>
    <p className="text-[16px] font-semibold text-[#18181b]">Unable to load this form</p>
    <p className="max-w-md text-[14px] text-[#71717a]">Please refresh or try again later.</p>
    <button
      type="button"
      onClick={onRetry}
      className="rounded-[8px] bg-[#1a1a18] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#2d2d2b]"
    >
      Try again
    </button>
  </div>
);
