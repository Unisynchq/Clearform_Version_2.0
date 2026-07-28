import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/config/supabase';

const SupabaseOAuthPopup = () => {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const startOAuth = async () => {
      try {
        const provider = searchParams.get('provider') || 'google';
        const next = searchParams.get('next') || '/signin';
        const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

        if (!supabase) {
          throw new Error('Supabase is not configured.');
        }

        const { error: signInError } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo,
          },
        });

        if (signInError) throw signInError;

        if (cancelled) return;
      } catch (err) {
        if (!cancelled) {
          setError(err?.message ?? 'Could not start sign-in.');
        }
      }
    };

    startOAuth();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="max-w-sm rounded-[14px] border border-[#e8e8e6] bg-white px-5 py-4 shadow-sm">
        <p className="text-[14px] font-medium text-[#1a1a18]">Opening provider...</p>
        {error ? <p className="mt-2 text-[13px] text-[#c53030]">{error}</p> : null}
      </div>
    </div>
  );
};

export default SupabaseOAuthPopup;
