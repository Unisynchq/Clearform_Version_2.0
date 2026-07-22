import { RiDownloadLine } from 'react-icons/ri';
import ProfileModal from '@/components/profile/ProfileModal';
import clearformLogo from '@/assets/clearform-high-resolution-logo-transparent (1).png';
import { downloadTaxInvoicePdf } from '@/features/profile/utils/downloadTaxInvoice';
import { getInvoiceSellerDetails } from '@/features/profile/utils/invoiceSellerDetails';

function makeAmountFormatter(currency) {
  if (currency && currency !== 'INR') {
    return (amount) => `$${Number(amount).toFixed(2)}`;
  }
  return (amount) =>
    amount === 0
      ? '₹0.00'
      : `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const TaxBadge = ({ isTax }) => (
  <span className="rounded-full bg-[#111110] px-3.5 py-1.5 text-[12px] font-medium tracking-[0.5px] text-white">
    {isTax ? 'TAX INVOICE' : 'INVOICE'}
  </span>
);

const PaidBadge = () => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(26,127,79,0.15)] bg-[#f0faf5] px-3.5 py-1.5 text-[12.5px] font-semibold text-[#1a7f4f]">
    <span className="size-1.5 rounded-sm bg-[#1a7f4f]" aria-hidden />
    Paid
  </span>
);

const LineItemRow = ({ row, formatAmount }) => (
  <tr className="border-b border-[#e8e6e0]">
    <td className="py-3 pr-4">
      <p className="text-[13px] font-medium text-[#111110]">{row.description}</p>
      <p className="mt-0.5 text-[11.5px] text-[#9e9b96]">{row.subtitle}</p>
    </td>
    <td className="py-3 px-2 text-center text-[13px] text-[#6b6860]">{row.qty}</td>
    <td className="py-3 px-2 text-right text-[13px] text-[#111110]">
      {formatAmount(row.unitPrice)}
    </td>
    <td className="py-3 pl-2 text-right text-[13px] font-medium text-[#111110]">
      {formatAmount(row.amount)}
    </td>
  </tr>
);

const TaxInvoiceModal = ({ open, onClose, invoice }) => {
  if (!invoice) return null;

  const seller = invoice.seller ?? getInvoiceSellerDetails();
  const gstApplies = invoice.gstApplies !== false;
  const formatAmount = makeAmountFormatter(invoice.currency);

  return (
    <ProfileModal
      open={open}
      onClose={onClose}
      widthClass="w-[min(100%,860px)]"
      className="overflow-hidden rounded-[14px] border border-[#e8e6e0] bg-[#f5f4f0] p-0 shadow-[0_4px_24px_rgba(0,0,0,0.08)]"
    >
      <div className="flex max-h-[min(92vh,900px)] flex-col gap-7 overflow-y-auto p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <img
            src={clearformLogo}
            alt="Clearform"
            className="h-7 w-auto max-w-[118px] object-contain"
          />
          <TaxBadge isTax={gstApplies} />
        </div>

        <div className="overflow-hidden rounded-[16px] border border-[#e8e6e0] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04),0_4px_24px_rgba(0,0,0,0.04)]">
          <div className="grid gap-8 border-b border-[#e8e6e0] px-6 py-8 sm:grid-cols-2 sm:px-12 sm:py-10">
            <div>
              <h2 className="text-[28px] font-bold tracking-[-0.8px] text-[#111110]">Invoice</h2>
              <p className="mt-1.5 text-[13px] tracking-[0.2px] text-[#9e9b96]">
                {invoice.invoiceNumber}
              </p>
            </div>
            <div className="flex flex-col items-start gap-4 sm:items-end">
              <PaidBadge />
              <div className="flex gap-6 text-right">
                <div>
                  <p className="text-[11px] font-medium tracking-[0.6px] text-[#9e9b96]">
                    ISSUE DATE
                  </p>
                  <p className="mt-1 text-[13.5px] font-medium text-[#111110]">
                    {invoice.issueDate}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium tracking-[0.6px] text-[#9e9b96]">
                    PERIOD
                  </p>
                  <p className="mt-1 text-[13.5px] font-medium text-[#111110]">
                    {(invoice.periodLabel ?? invoice.periodEndLabel ?? '—').replace(
                      /, \d{4}$/,
                      '',
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-8 border-b border-[#e8e6e0] bg-[#fafaf8] px-6 py-8 sm:grid-cols-2 sm:px-12">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.8px] text-[#9e9b96]">BILLED BY</p>
              <p className="mt-2.5 text-[15px] font-semibold tracking-[-0.2px] text-[#111110]">
                {seller.name}
              </p>
              {seller.addressLines.length ? (
                <p className="mt-2 text-[13px] leading-[20.8px] text-[#6b6860]">
                  {seller.addressLines.map((line) => (
                    <span key={line}>
                      {line}
                      <br />
                    </span>
                  ))}
                </p>
              ) : null}
              {seller.gstin ? (
                <code className="mt-2 inline-block rounded bg-[#e8e6e0] px-2 py-0.5 font-mono text-[11px] text-[#6b6860]">
                  GSTIN: {seller.gstin}
                </code>
              ) : null}
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-[0.8px] text-[#9e9b96]">BILLED TO</p>
              <p className="mt-2.5 text-[15px] font-semibold tracking-[-0.2px] text-[#111110]">
                {invoice.customer.company || invoice.customer.name}
              </p>
              <p className="mt-2 text-[13px] leading-[20.8px] text-[#6b6860]">
                {invoice.customer.name}
                <br />
                {invoice.customer.email}
                {invoice.customer.address ? (
                  <>
                    <br />
                    {invoice.customer.address}
                  </>
                ) : null}
              </p>
              {invoice.customer.gstin ? (
                <code className="mt-2 inline-block rounded bg-[#e8e6e0] px-2 py-0.5 font-mono text-[11px] text-[#6b6860]">
                  GSTIN: {invoice.customer.gstin}
                </code>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 bg-[#111110] px-6 py-3.5 sm:px-6">
            <div>
              <p className="text-[14px] font-bold tracking-[-0.2px] text-white">
                {invoice.taxPlanName}
              </p>
              <p className="text-[11px] text-white/45">{invoice.taxPlanSubtitle}</p>
            </div>
            <div className="text-right">
              <p className="text-[15px] font-bold tracking-[-0.4px] text-white">
                {invoice.monthlyPriceLabel}
              </p>
              <p className="text-[12px] text-white/45">{invoice.isOneTime ? 'one-time' : 'per month'}</p>
            </div>
          </div>

          <div className="overflow-x-auto px-6">
            <table className="w-full min-w-[520px] border-collapse text-left">
              <thead>
                <tr className="text-[11px] font-medium tracking-[0.6px] text-[#9e9b96] uppercase">
                  <th className="border-b border-[#e8e6e0] py-3 pr-4">Description</th>
                  <th className="border-b border-[#e8e6e0] px-2 py-3">Qty</th>
                  <th className="border-b border-[#e8e6e0] px-2 py-3 text-right">Unit price</th>
                  <th className="border-b border-[#e8e6e0] py-3 pl-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((row) => (
                  <LineItemRow key={row.description} row={row} formatAmount={formatAmount} />
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end px-6 pb-6 pt-2">
            <div className="w-full max-w-[300px] space-y-2 text-[13px]">
              {invoice.promoDiscount > 0 ? (
                <div className="flex justify-between text-[#1a7f4f]">
                  <span>Discount ({invoice.promoCode})</span>
                  <span>−{formatAmount(invoice.promoDiscount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-[#6b6860]">
                <span>Subtotal{gstApplies ? ' (excl. tax)' : ''}</span>
                <span className="text-[#111110]">{invoice.subtotalExclLabel}</span>
              </div>
              {gstApplies ? (
                <>
                  <div className="flex justify-between text-[#6b6860]">
                    <span className="flex items-center gap-1.5">
                      CGST
                      <span className="rounded bg-[#f0f0ed] px-1.5 py-0.5 text-[10px] font-semibold text-[#9e9b96]">
                        9%
                      </span>
                    </span>
                    <span className="text-[#111110]">{invoice.cgstLabel}</span>
                  </div>
                  <div className="flex justify-between text-[#6b6860]">
                    <span className="flex items-center gap-1.5">
                      SGST
                      <span className="rounded bg-[#f0f0ed] px-1.5 py-0.5 text-[10px] font-semibold text-[#9e9b96]">
                        9%
                      </span>
                    </span>
                    <span className="text-[#111110]">{invoice.sgstLabel}</span>
                  </div>
                </>
              ) : null}
              <div className="flex justify-between border-t border-[#e8e6e0] pt-3 font-semibold text-[#111110]">
                <span>Total</span>
                <span className="text-[20px] font-bold tracking-[-0.6px]">
                  {invoice.totalPaidDisplay}
                </span>
              </div>
              <div className="flex justify-between text-[#1a7f4f]">
                <span>Amount paid on {invoice.chargedOn}</span>
                <span>−{invoice.totalPaidDisplay}</span>
              </div>
              <div className="flex justify-between border-t border-[#e8e6e0] pt-3 font-semibold">
                <span>Balance due</span>
                <span>{formatAmount(0)}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-6 border-t border-[#e8e6e0] bg-[#fafaf8] px-6 py-5 sm:grid-cols-2 sm:px-12">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.6px] text-[#9e9b96]">
                PAYMENT METHOD
              </p>
              <p className="mt-2 text-[13.5px] font-medium text-[#111110]">
                {invoice.paymentMethodLabel}
              </p>
              <p className="text-[12px] text-[#9e9b96]">{invoice.paymentExpiry}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-[11px] font-semibold tracking-[0.6px] text-[#9e9b96]">
                {invoice.isOneTime ? 'PILOT EXPIRES' : 'NEXT BILLING DATE'}
              </p>
              <p className="mt-2 text-[13.5px] font-semibold text-[#111110]">
                {invoice.isOneTime
                  ? (invoice.pilotExpiresLabel ?? invoice.nextBillingDate)
                  : invoice.nextBillingDate}
              </p>
              <p className="text-[12px] text-[#9e9b96]">
                {invoice.isOneTime
                  ? 'One-time purchase — no auto-renewal'
                  : `${invoice.nextBillingInclGst} incl. GST`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#e8e6e0] bg-[#fafaf8] px-6 py-4 sm:px-12">
            <p className="max-w-lg text-[12px] leading-relaxed text-[#9e9b96]">
              Thank you for choosing {invoice.planName}. This is a
              computer-generated invoice and does not require a signature.
            </p>
            <button
              type="button"
              onClick={() => downloadTaxInvoicePdf(invoice)}
              className="inline-flex shrink-0 items-center gap-2 rounded-[8px] bg-[#111110] px-4 py-2.5 text-[13px] font-semibold tracking-[-0.1px] text-white transition-colors hover:bg-[#2d2d2b]"
            >
              <RiDownloadLine size={14} aria-hidden />
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </ProfileModal>
  );
};

export default TaxInvoiceModal;
