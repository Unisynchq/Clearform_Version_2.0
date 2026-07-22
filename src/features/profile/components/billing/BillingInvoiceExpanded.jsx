import { RiDownloadLine, RiStarFill } from 'react-icons/ri';
import { downloadTaxInvoicePdf } from '@/features/profile/utils/downloadTaxInvoice';

const BillingInvoiceExpanded = ({ invoice, onOpenTaxInvoice }) => (
  <div className="border-t border-[#f0f0ee] bg-white">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#f0f0ee] px-5 py-4">
      <div>
        <p className="text-[11.5px] tracking-[0.1px] text-[#9e9b96]">
          {invoice.invoiceNumber} · {invoice.issueDate}
        </p>
        <h3 className="mt-1 text-[15px] font-semibold text-[#111110]">{invoice.displayTitle}</h3>
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f0faf5] px-2.5 py-1 text-[11px] font-medium text-[#1a7f4f]">
        <span className="size-1.5 rounded-full bg-[#1a7f4f]" aria-hidden />
        Paid
      </span>
    </div>

    <div className="flex items-center justify-between gap-4 bg-[#111110] px-6 py-3.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-white/10">
          <RiStarFill size={16} className="text-white" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[14px] font-bold tracking-[-0.2px] text-white">{invoice.stripTitle}</p>
          <p className="truncate text-[11px] text-white/45">{invoice.stripSubtitle}</p>
        </div>
      </div>
      <p className="shrink-0 text-[15px] font-bold text-white">
        {invoice.monthlyPriceLabel}
        <span className="text-[12px] font-normal text-white/45"> / mo</span>
      </p>
    </div>

    <div className="divide-y divide-[#e8e6e0] px-6">
      <div className="flex items-center justify-between py-3 text-[13px]">
        <span className="text-[#6b6860]">Billing period</span>
        <span className="font-medium text-[#111110]">{invoice.periodEndLabel}</span>
      </div>
      <div className="flex items-center justify-between py-3 text-[13px]">
        <span className="text-[#6b6860]">Subtotal</span>
        <span className="font-medium text-[#111110]">{invoice.subtotalExclLabel}</span>
      </div>
      <div className="flex items-center justify-between py-3 text-[13px]">
        <span className="flex items-center gap-1.5 text-[#6b6860]">
          CGST
          <span className="rounded bg-[#f0f0ed] px-1.5 py-0.5 text-[10px] font-semibold text-[#9e9b96]">
            9%
          </span>
        </span>
        <span className="font-medium text-[#111110]">{invoice.cgstLabel}</span>
      </div>
      <div className="flex items-center justify-between py-3 text-[13px]">
        <span className="flex items-center gap-1.5 text-[#6b6860]">
          SGST
          <span className="rounded bg-[#f0f0ed] px-1.5 py-0.5 text-[10px] font-semibold text-[#9e9b96]">
            9%
          </span>
        </span>
        <span className="font-medium text-[#111110]">{invoice.sgstLabel}</span>
      </div>
    </div>

    <div className="flex items-center justify-between border-t border-[#e8e6e0] bg-[#fafaf8] px-6 py-4">
      <div>
        <p className="text-[13px] font-semibold text-[#111110]">Total paid</p>
        <p className="text-[11.5px] text-[#9e9b96]">Charged on {invoice.chargedOn}</p>
      </div>
      <p className="text-[22px] font-bold tracking-[-0.6px] text-[#111110]">
        {invoice.totalPaidDisplay}
      </p>
    </div>

    <div className="flex flex-wrap gap-2 border-t border-[#e8e6e0] bg-[#fafaf8] px-6 py-4">
      <button
        type="button"
        onClick={() => downloadTaxInvoicePdf(invoice)}
        className="inline-flex items-center gap-2 rounded-[8px] bg-[#111110] px-4 py-2.5 text-[13px] font-semibold tracking-[-0.1px] text-white transition-colors hover:bg-[#2d2d2b]"
      >
        <RiDownloadLine size={14} aria-hidden />
        Download invoice
      </button>
      <button
        type="button"
        onClick={onOpenTaxInvoice}
        className="rounded-[8px] border border-[#e8e6e0] px-4 py-2.5 text-[13px] font-medium text-[#111110] transition-colors hover:bg-white"
      >
        View tax invoice
      </button>
    </div>
  </div>
);

export default BillingInvoiceExpanded;
