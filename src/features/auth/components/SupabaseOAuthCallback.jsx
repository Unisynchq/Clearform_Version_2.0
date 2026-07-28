import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/config/supabase';

const SupabaseOAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);
  const closedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const next = searchParams.get('next');
    const returnPath = typeof next === 'string' && next.startsWith('/') ? next : '/signin';

    const finish = async () => {
      try {
        if (!supabase) {
          throw new Error('Supabase is not configured.');
        }

        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (cancelled) return;

        if (data?.session?.user?.email) {
          if (window.opener && !closedRef.current) {
            closedRef.current = true;
            window.opener.postMessage(
              { type: 'clearform:supabase-oauth-complete' },
              window.location.origin,
            );
            setTimeout(() => window.close(), 100);
            return;
          }

          navigate(returnPath, { replace: true });
          return;
        }

        setTimeout(() => {
          if (!cancelled) void finish();
        }, 120);
      } catch (err) {
        if (!cancelled) {
          setError(err?.message ?? 'Could not finish sign-in.');
        }
      }
    };

    void finish();
    return () => {
      cancelled = true;
    };
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="max-w-sm rounded-[14px] border border-[#e8e8e6] bg-white px-5 py-4 shadow-sm">
        <p className="text-[14px] font-medium text-[#1a1a18]">Signing you in...</p>
        <p className="mt-1 text-[12.5px] text-[#6b6b68]">This window will close automatically.</p>
        {error ? <p className="mt-2 text-[13px] text-[#c53030]">{error}</p> : null}
      </div>
    </div>
  );
};

export default SupabaseOAuthCallback;
