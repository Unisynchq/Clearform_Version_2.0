/** Set VITE_ENABLE_RAZORPAY_CHECKOUT=true when Razorpay keys + server webhooks are live. */
export const RAZORPAY_CHECKOUT_ENABLED =
  import.meta.env.VITE_ENABLE_RAZORPAY_CHECKOUT === 'true';
