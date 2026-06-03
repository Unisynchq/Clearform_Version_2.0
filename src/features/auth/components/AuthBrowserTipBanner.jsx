import { useEffect, useState } from 'react';
import { getMicrosoftSignInBrowserTip } from '@/features/auth/utils/authBrowserHints';

/**
 * Small banner on sign-in/sign-up when Brave or wallet extensions may break Microsoft OAuth.
 */
const AuthBrowserTipBanner = () => {
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getMicrosoftSignInBrowserTip().then((tip) => {
      if (!cancelled && tip?.show) setMessage(tip.message);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!message) return null;

  return (
    <div
      className="rounded-[10px] border border-amber-200/80 bg-amber-50 px-3 py-2 text-[12px] leading-[18px] text-amber-950"
      role="status"
    >
      {message}
    </div>
  );
};

export default AuthBrowserTipBanner;
