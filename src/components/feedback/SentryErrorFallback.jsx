/**
 * Shown when Sentry.ErrorBoundary catches a render error (production DSN only).
 */
export default function SentryErrorFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-950 px-6 text-center text-zinc-100">
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="max-w-md text-sm text-zinc-400">
        We&apos;ve been notified. Please refresh the page or try again in a few minutes.
      </p>
      <button
        type="button"
        className="rounded-md bg-white px-4 py-2 text-sm font-medium text-zinc-900"
        onClick={() => window.location.reload()}
      >
        Refresh
      </button>
    </div>
  );
}
