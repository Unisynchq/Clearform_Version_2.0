/**
 * Lightweight browser/extension hints for OAuth sign-in (Microsoft redirect on Brave).
 */

export function detectWalletExtension() {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.ethereum ||
      window.solana ||
      window.phantom?.solana ||
      window.coinbaseWalletExtension,
  );
}

export function detectBraveFromUserAgent() {
  if (typeof navigator === 'undefined') return false;
  return /Brave/i.test(navigator.userAgent);
}

/** Resolves true when Brave Shields may block Microsoft OAuth / FIDO. */
export async function detectBraveBrowser() {
  if (typeof navigator === 'undefined') return false;
  if (navigator.brave?.isBrave) {
    try {
      return await navigator.brave.isBrave();
    } catch {
      return detectBraveFromUserAgent();
    }
  }
  return detectBraveFromUserAgent();
}

/**
 * @returns {Promise<{ show: boolean, message: string } | null>}
 */
export async function getMicrosoftSignInBrowserTip() {
  const isBrave = await detectBraveBrowser();
  const hasWallet = detectWalletExtension();

  if (!isBrave && !hasWallet) return null;

  const parts = [];
  if (isBrave) {
    parts.push(
      'Brave may block Microsoft sign-in. Allow Shields down for login.microsoftonline.com and login.live.com, or try Chrome incognito.',
    );
  }
  if (hasWallet) {
    parts.push(
      'Disable crypto wallet extensions on this page if sign-in stalls on “Confirm sign in?”.',
    );
  }

  return { show: true, message: parts.join(' ') };
}
