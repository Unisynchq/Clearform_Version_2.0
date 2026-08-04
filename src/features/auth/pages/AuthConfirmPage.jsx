import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/config/supabase';

/**
 * Supabase email-template landing for token_hash links:
 *   /auth/confirm?token_hash=...&type=recovery&next=/reset-password
 * Prefer this over PKCE ?code= for recovery (works across browsers).
 */
const AuthConfirmPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!supabase) {
        setError('Authentication is not configured.');
        return;
      }

      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type') || 'recovery';
      const nextRaw = searchParams.get('next') || '/reset-password';
      const next =
        typeof nextRaw === 'string' && nextRaw.startsWith('/') && !nextRaw.startsWith('//')
          ? nextRaw
          : '/reset-password';

      if (!tokenHash) {
        setError('Missing verification token. Request a new password reset email.');
        return;
      }

      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      });

      if (cancelled) return;

      if (verifyError) {
        setError(
          verifyError.message ||
            'This link is invalid or has expired. Request a new password reset email.',
        );
        return;
      }

      navigate(next, { replace: true });
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, searchParams]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-white px-6 text-center">
        <h1 className="text-lg font-semibold text-[#0f0f0e]">Could not verify link</h1>
        <p className="max-w-md text-sm text-[#6b6860]">{error}</p>
        <button
          type="button"
          className="mt-2 rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
          onClick={() => navigate('/signin', { replace: true })}
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white text-sm text-[#6b6860]">
      Verifying…
    </div>
  );
};

export default AuthConfirmPage;
