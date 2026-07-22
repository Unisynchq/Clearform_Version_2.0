import { Navigate } from 'react-router-dom';

/** Fallback for unknown routes — redirects to dashboard when signed in context is handled by router guards. */
export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f4f3ef] px-6 text-center">
      <h1 className="text-[22px] font-semibold text-[#111110]">Page not found</h1>
      <p className="text-[14px] text-[#6e6d67]">This URL does not match any Clearform screen.</p>
      <Navigate to="/dashboard" replace />
    </div>
  );
}
