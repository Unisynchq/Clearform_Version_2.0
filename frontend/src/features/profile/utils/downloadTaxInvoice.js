import clearformLogo from '@/assets/clearform-high-resolution-logo-transparent (1).png';
import { getInvoiceSellerDetails } from '@/features/profile/utils/invoiceSellerDetails';

/**
 * Opens a print dialog (Save as PDF) for the tax invoice.
 * @param {import('@/features/profile/utils/profileBillingInvoice').buildTaxInvoice extends Function ? ReturnType<buildTaxInvoice> : object} invoice
 */
export function downloadTaxInvoicePdf(invoice) {
  if (!invoice) return;
  const html = renderTaxInvoiceDocument(invoice);
  const printWindow = window.open('', '_blank', 'noopener,noreferrer');
  if (!printWindow) return;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  const triggerPrint = () => {
    const logo = printWindow.document.getElementById('invoice-logo');
    if (logo && !logo.complete) {
      logo.onload = () => setTimeout(() => printWindow.print(), 100);
      logo.onerror = () => printWindow.print();
      return;
    }
    printWindow.print();
  };
  if (printWindow.document.readyState === 'complete') {
    setTimeout(triggerPrint, 250);
  } else {
    printWindow.onload = () => setTimeout(triggerPrint, 250);
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function moneyFormatter(currency) {
  if (currency === 'INR' || !currency) {
    return (amount) =>
      `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return (amount) => `$${Number(amount).toFixed(2)}`;
}

function renderTaxInvoiceDocument(invoice) {
  const seller = invoice.seller ?? getInvoiceSellerDetails();
  const formatMoney = moneyFormatter(invoice.currency);
  const logoUrl = new URL(clearformLogo, window.location.origin).href;

  const lineRows = invoice.lineItems
    .map(
      (row) => `
    <tr>
      <td style="padding:11px 0;border-bottom:1.5px solid #e8e6e0;">
        <div style="font-size:13px;color:#111110;font-weight:500;">${escapeHtml(row.description)}</div>
        <div style="font-size:11.5px;color:#9e9b96;margin-top:2px;">${escapeHtml(row.subtitle)}</div>
      </td>
      <td style="padding:11px 8px;border-bottom:1.5px solid #e8e6e0;text-align:center;font-size:13px;color:#6b6860;">${escapeHtml(row.qty)}</td>
      <td style="padding:11px 8px;border-bottom:1.5px solid #e8e6e0;text-align:right;font-size:13px;color:#111110;">${formatMoney(row.unitPrice)}</td>
      <td style="padding:11px 0;border-bottom:1.5px solid #e8e6e0;text-align:right;font-size:13px;font-weight:500;color:#111110;">${formatMoney(row.amount)}</td>
    </tr>`
    )
    .join('');

  const promoRow =
    invoice.promoDiscount > 0
      ? `<div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;">
          <span style="color:#6b6860;">Discount (${escapeHtml(invoice.promoCode)})</span>
          <span style="color:#1a7f4f;font-weight:500;">−${formatMoney(invoice.promoDiscount)}</span>
        </div>`
      : '';

  const gstRows = invoice.gstApplies
    ? `<div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;"><span style="color:#6b6860;">CGST <span style="background:#f0f0ed;padding:2px 6px;border-radius:4px;font-size:10px;">9%</span></span><span>${invoice.cgstLabel}</span></div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;"><span style="color:#6b6860;">SGST <span style="background:#f0f0ed;padding:2px 6px;border-radius:4px;font-size:10px;">9%</span></span><span>${invoice.sgstLabel}</span></div>`
    : '';

  const sellerAddress = seller.addressLines.length
    ? `<p style="font-size:13px;color:#6b6860;line-height:1.6;margin:8px 0;">${seller.addressLines.map(escapeHtml).join('<br/>')}</p>`
    : '';
  const sellerGstin = seller.gstin
    ? `<code style="font-size:11px;background:#e8e6e0;padding:3px 8px;border-radius:4px;color:#6b6860;">GSTIN: ${escapeHtml(seller.gstin)}</code>`
    : '';
  const customerGstin = invoice.customer.gstin
    ? `<code style="font-size:11px;background:#e8e6e0;padding:3px 8px;border-radius:4px;color:#6b6860;">GSTIN: ${escapeHtml(invoice.customer.gstin)}</code>`
    : '';

  const scheduleBlock = invoice.isOneTime
    ? `<div style="font-size:11px;color:#9e9b96;letter-spacing:0.6px;font-weight:600;">PILOT EXPIRES</div>
        <div style="margin-top:8px;font-size:13.5px;font-weight:600;">${escapeHtml(invoice.pilotExpiresLabel ?? invoice.nextBillingDate)}</div>
        <div style="font-size:12px;color:#9e9b96;margin-top:2px;">One-time purchase — no auto-renewal</div>`
    : `<div style="font-size:11px;color:#9e9b96;letter-spacing:0.6px;font-weight:600;">NEXT BILLING DATE</div>
        <div style="margin-top:8px;font-size:13.5px;font-weight:600;">${escapeHtml(invoice.nextBillingDate)}</div>
        <div style="font-size:12px;color:#9e9b96;margin-top:2px;">${escapeHtml(invoice.nextBillingInclGst)} incl. GST</div>`;

  const documentTitle = invoice.gstApplies ? 'TAX INVOICE' : 'INVOICE';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(invoice.invoiceNumber)} — ${escapeHtml(seller.name)} Invoice</title>
  <style>
    @page { margin: 16mm; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background:#f5f4f0; color:#111110; margin:0; padding:32px; }
    .card { background:#fff; border:1.5px solid #e8e6e0; border-radius:16px; overflow:hidden; max-width:820px; margin:0 auto; }
    @media print { body { background:#fff; padding:0; } }
  </style>
</head>
<body>
  <div style="max-width:820px;margin:0 auto 28px;display:flex;justify-content:space-between;align-items:center;">
    <img id="invoice-logo" src="${logoUrl}" alt="${escapeHtml(seller.name)}" style="height:28px;object-fit:contain;" />
    <span style="background:#111110;color:#fff;font-size:12px;padding:6px 14px;border-radius:100px;letter-spacing:0.5px;">${documentTitle}</span>
  </div>
  <div class="card">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;padding:40px 48px 36px;border-bottom:1.5px solid #e8e6e0;">
      <div>
        <h1 style="margin:0;font-size:28px;letter-spacing:-0.8px;">Invoice</h1>
        <p style="margin:6px 0 0;color:#9e9b96;font-size:13px;">${escapeHtml(invoice.invoiceNumber)}</p>
      </div>
      <div style="text-align:right;">
        <span style="display:inline-flex;align-items:center;gap:6px;background:#f0faf5;border:1px solid rgba(26,127,79,0.15);color:#1a7f4f;padding:6px 14px;border-radius:100px;font-size:12.5px;font-weight:600;">
          <span style="width:6px;height:6px;border-radius:3px;background:#1a7f4f;"></span> Paid
        </span>
        <div style="margin-top:16px;display:flex;gap:24px;justify-content:flex-end;">
          <div><div style="font-size:11px;color:#9e9b96;letter-spacing:0.6px;">ISSUE DATE</div><div style="font-size:13.5px;margin-top:3px;">${escapeHtml(invoice.issueDate)}</div></div>
          <div><div style="font-size:11px;color:#9e9b96;letter-spacing:0.6px;">PERIOD</div><div style="font-size:13.5px;margin-top:3px;">${escapeHtml((invoice.periodLabel ?? invoice.periodEndLabel ?? '—').replace(/, \d{4}$/, ''))}</div></div>
        </div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;padding:32px 48px;background:#fafaf8;border-bottom:1.5px solid #e8e6e0;">
      <div>
        <div style="font-size:11px;color:#9e9b96;letter-spacing:0.8px;font-weight:600;">BILLED BY</div>
        <div style="font-weight:600;margin-top:10px;font-size:15px;">${escapeHtml(seller.name)}</div>
        ${sellerAddress}
        ${sellerGstin}
      </div>
      <div>
        <div style="font-size:11px;color:#9e9b96;letter-spacing:0.8px;font-weight:600;">BILLED TO</div>
        <div style="font-weight:600;margin-top:10px;font-size:15px;">${escapeHtml(invoice.customer.company || invoice.customer.name)}</div>
        <p style="font-size:13px;color:#6b6860;line-height:1.6;margin:8px 0;">${escapeHtml(invoice.customer.name)}<br/>${escapeHtml(invoice.customer.email)}${invoice.customer.address ? `<br/>${escapeHtml(invoice.customer.address)}` : ''}</p>
        ${customerGstin}
      </div>
    </div>
    <div style="background:#111110;color:#fff;padding:14px 24px;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="font-weight:700;font-size:14px;">${escapeHtml(invoice.taxPlanName)}</div>
        <div style="font-size:11px;opacity:0.45;margin-top:2px;">${escapeHtml(invoice.taxPlanSubtitle)}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-weight:700;font-size:15px;">${escapeHtml(invoice.monthlyPriceLabel)}</div>
        <div style="font-size:12px;opacity:0.45;">${invoice.isOneTime ? 'one-time' : 'per month'}</div>
      </div>
    </div>
    <div style="padding:0 24px;">
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="font-size:11px;color:#9e9b96;text-transform:uppercase;letter-spacing:0.6px;">
            <th style="text-align:left;padding:12px 0;border-bottom:1.5px solid #e8e6e0;">Description</th>
            <th style="padding:12px 8px;border-bottom:1.5px solid #e8e6e0;">Qty</th>
            <th style="text-align:right;padding:12px 8px;border-bottom:1.5px solid #e8e6e0;">Unit price</th>
            <th style="text-align:right;padding:12px 0;border-bottom:1.5px solid #e8e6e0;">Amount</th>
          </tr>
        </thead>
        <tbody>${lineRows}</tbody>
      </table>
    </div>
    <div style="padding:16px 48px 32px;display:flex;justify-content:flex-end;">
      <div style="min-width:280px;">
        ${promoRow}
        <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;"><span style="color:#6b6860;">Subtotal${invoice.gstApplies ? ' (excl. tax)' : ''}</span><span>${invoice.subtotalExclLabel}</span></div>
        ${gstRows}
        <div style="border-top:1.5px solid #e8e6e0;margin-top:8px;padding-top:12px;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:600;">Total</span>
          <span style="font-size:20px;font-weight:700;">${escapeHtml(invoice.totalPaidDisplay)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;color:#1a7f4f;"><span>Amount paid on ${escapeHtml(invoice.chargedOn)}</span><span>−${escapeHtml(invoice.totalPaidDisplay)}</span></div>
        <div style="border-top:1.5px solid #e8e6e0;margin-top:8px;padding-top:12px;display:flex;justify-content:space-between;font-weight:600;"><span>Balance due</span><span>${formatMoney(0)}</span></div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;padding:20px 48px 28px;border-top:1.5px solid #e8e6e0;background:#fafaf8;">
      <div>
        <div style="font-size:11px;color:#9e9b96;letter-spacing:0.6px;font-weight:600;">PAYMENT METHOD</div>
        <div style="margin-top:8px;font-size:13.5px;font-weight:500;">${escapeHtml(invoice.paymentMethodLabel)}</div>
        <div style="font-size:12px;color:#9e9b96;margin-top:2px;">${escapeHtml(invoice.paymentExpiry)}</div>
      </div>
      <div style="text-align:right;">
        ${scheduleBlock}
      </div>
    </div>
    <div style="padding:20px 48px 28px;border-top:1.5px solid #e8e6e0;font-size:12px;color:#9e9b96;line-height:1.6;">
      Thank you for choosing ${escapeHtml(seller.name)}. This is a computer-generated invoice and does not require a signature.
      For questions, write to ${escapeHtml(seller.supportEmail)} or visit your billing dashboard.
    </div>
  </div>
</body>
</html>`;
}
