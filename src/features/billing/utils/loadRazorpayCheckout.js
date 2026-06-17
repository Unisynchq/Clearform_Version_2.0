const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';
let scriptPromise = null;

/**
 * Load Razorpay Checkout.js once per page session.
 */
export function loadRazorpayCheckoutScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Razorpay checkout requires a browser'));
  }
  if (window.Razorpay) {
    return Promise.resolve(window.Razorpay);
  }
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(
      `script[src="${RAZORPAY_SCRIPT_URL}"]`,
    );
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Razorpay));
      existing.addEventListener('error', () =>
        reject(new Error('Failed to load Razorpay checkout')),
      );
      return;
    }

    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout'));
    document.body.appendChild(script);
  });

  return scriptPromise;
}
