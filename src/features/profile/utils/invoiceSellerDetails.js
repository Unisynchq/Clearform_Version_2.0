/**
 * Seller identity printed on invoices/receipts. Real legal details come from
 * env so no fabricated GSTIN/address ever ships — unset fields are omitted
 * from the rendered document.
 *
 * .env:
 *   VITE_INVOICE_SELLER_NAME="Clearform"
 *   VITE_INVOICE_SELLER_ADDRESS="Street, City – PIN, State, Country" (use \n or | for line breaks)
 *   VITE_INVOICE_SELLER_GSTIN="29XXXXXXXXXXXXX" (omit if not GST-registered)
 *   VITE_INVOICE_SUPPORT_EMAIL="billing@clearform.in"
 */
export function getInvoiceSellerDetails() {
  const env = import.meta.env ?? {};
  const address = env.VITE_INVOICE_SELLER_ADDRESS?.trim() ?? '';
  return {
    name: env.VITE_INVOICE_SELLER_NAME?.trim() || 'Clearform',
    addressLines: address
      ? address.split(/\s*(?:\\n|\|)\s*/).filter(Boolean)
      : [],
    gstin: env.VITE_INVOICE_SELLER_GSTIN?.trim() || null,
    supportEmail: env.VITE_INVOICE_SUPPORT_EMAIL?.trim() || 'billing@clearform.in',
  };
}
