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
          // Use localStorage to communicate with the parent window (immune to COOP)
          localStorage.setItem('clearform:oauth_success', JSON.stringify(data.session));

          if (!closedRef.current) {
            closedRef.current = true;
            try {
              window.close();
            } catch (e) {
              // Ignore close error
            }
          }

          // Don't redirect the popup. If it fails to close, show a message.
          setTimeout(() => {
            if (!closedRef.current || !window.closed) {
              const body = document.querySelector('body');
              if (body) {
                body.innerHTML = `
                  <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; background: #fafafa;">
                    <h2 style="color: #0f0f0e;">Sign in successful!</h2>
                    <p style="color: #6b6860;">You can close this window now.</p>
                  </div>
                `;
              }
            }
          }, 500);
          
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

  return null;
};

export default SupabaseOAuthCallback;
