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
    printWindow.print();
  };
  if (printWindow.document.readyState === 'complete') {
    setTimeout(triggerPrint, 250);
  } else {
    printWindow.onload = () => setTimeout(triggerPrint, 250);
  }
}

function renderTaxInvoiceDocument(invoice) {
  const lineRows = invoice.lineItems
    .map(
      (row) => `
    <tr>
      <td style="padding:11px 0;border-bottom:1.5px solid #e8e6e0;">
        <div style="font-size:13px;color:#111110;font-weight:500;">${row.description}</div>
        <div style="font-size:11.5px;color:#9e9b96;margin-top:2px;">${row.subtitle}</div>
      </td>
      <td style="padding:11px 8px;border-bottom:1.5px solid #e8e6e0;text-align:center;font-size:13px;color:#6b6860;">${row.qty}</td>
      <td style="padding:11px 8px;border-bottom:1.5px solid #e8e6e0;text-align:right;font-size:13px;color:#111110;">${formatMoney(row.unitPrice)}</td>
      <td style="padding:11px 0;border-bottom:1.5px solid #e8e6e0;text-align:right;font-size:13px;font-weight:500;color:#111110;">${formatMoney(row.amount)}</td>
    </tr>`
    )
    .join('');

  const promoRow =
    invoice.promoDiscount > 0
      ? `<div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;">
          <span style="color:#6b6860;">Discount (${invoice.promoCode})</span>
          <span style="color:#1a7f4f;font-weight:500;">−${formatMoney(invoice.promoDiscount)}</span>
        </div>`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${invoice.invoiceNumber} — Clearform Tax Invoice</title>
  <style>
    @page { margin: 16mm; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background:#f5f4f0; color:#111110; margin:0; padding:32px; }
    .card { background:#fff; border:1.5px solid #e8e6e0; border-radius:16px; overflow:hidden; max-width:820px; margin:0 auto; }
    @media print { body { background:#fff; padding:0; } }
  </style>
</head>
<body>
  <div style="max-width:820px;margin:0 auto 28px;display:flex;justify-content:space-between;align-items:center;">
    <strong style="font-size:18px;">Clearform</strong>
    <span style="background:#111110;color:#fff;font-size:12px;padding:6px 14px;border-radius:100px;letter-spacing:0.5px;">TAX INVOICE</span>
  </div>
  <div class="card">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;padding:40px 48px 36px;border-bottom:1.5px solid #e8e6e0;">
      <div>
        <h1 style="margin:0;font-size:28px;letter-spacing:-0.8px;">Invoice</h1>
        <p style="margin:6px 0 0;color:#9e9b96;font-size:13px;">${invoice.invoiceNumber}</p>
      </div>
      <div style="text-align:right;">
        <span style="display:inline-flex;align-items:center;gap:6px;background:#f0faf5;border:1px solid rgba(26,127,79,0.15);color:#1a7f4f;padding:6px 14px;border-radius:100px;font-size:12.5px;font-weight:600;">
          <span style="width:6px;height:6px;border-radius:3px;background:#1a7f4f;"></span> Paid
        </span>
        <div style="margin-top:16px;display:flex;gap:24px;justify-content:flex-end;">
          <div><div style="font-size:11px;color:#9e9b96;letter-spacing:0.6px;">ISSUE DATE</div><div style="font-size:13.5px;margin-top:3px;">${invoice.issueDate}</div></div>
          <div><div style="font-size:11px;color:#9e9b96;letter-spacing:0.6px;">PERIOD</div><div style="font-size:13.5px;margin-top:3px;">${(invoice.periodLabel ?? invoice.periodEndLabel ?? '—').replace(/, \d{4}$/, '')}</div></div>
        </div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;padding:32px 48px;background:#fafaf8;border-bottom:1.5px solid #e8e6e0;">
      <div>
        <div style="font-size:11px;color:#9e9b96;letter-spacing:0.8px;font-weight:600;">BILLED BY</div>
        <div style="font-weight:600;margin-top:10px;font-size:15px;">Clearform Technologies Pvt. Ltd.</div>
        <p style="font-size:13px;color:#6b6860;line-height:1.6;margin:8px 0;">12th Floor, Prestige Tech Park<br/>Outer Ring Road, Bangalore – 560103<br/>Karnataka, India</p>
        <code style="font-size:11px;background:#e8e6e0;padding:3px 8px;border-radius:4px;color:#6b6860;">GSTIN: 29AABCT1332L1ZR</code>
      </div>
      <div>
        <div style="font-size:11px;color:#9e9b96;letter-spacing:0.8px;font-weight:600;">BILLED TO</div>
        <div style="font-weight:600;margin-top:10px;font-size:15px;">${invoice.customer.company}</div>
        <p style="font-size:13px;color:#6b6860;line-height:1.6;margin:8px 0;">${invoice.customer.name}<br/>${invoice.customer.email}<br/>${invoice.customer.address}</p>
        <code style="font-size:11px;background:#e8e6e0;padding:3px 8px;border-radius:4px;color:#6b6860;">GSTIN: ${invoice.customer.gstin}</code>
      </div>
    </div>
    <div style="background:#111110;color:#fff;padding:14px 24px;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="font-weight:700;font-size:14px;">${invoice.taxPlanName}</div>
        <div style="font-size:11px;opacity:0.45;margin-top:2px;">${invoice.taxPlanSubtitle}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-weight:700;font-size:15px;">${invoice.monthlyPriceLabel}</div>
        <div style="font-size:12px;opacity:0.45;">per month</div>
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
        <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;"><span style="color:#6b6860;">Subtotal (excl. tax)</span><span>${invoice.subtotalExclLabel}</span></div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;"><span style="color:#6b6860;">CGST <span style="background:#f0f0ed;padding:2px 6px;border-radius:4px;font-size:10px;">9%</span></span><span>${invoice.cgstLabel}</span></div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;"><span style="color:#6b6860;">SGST <span style="background:#f0f0ed;padding:2px 6px;border-radius:4px;font-size:10px;">9%</span></span><span>${invoice.sgstLabel}</span></div>
        <div style="border-top:1.5px solid #e8e6e0;margin-top:8px;padding-top:12px;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:600;">Total</span>
          <span style="font-size:20px;font-weight:700;">${invoice.totalPaidDisplay}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;color:#1a7f4f;"><span>Amount paid on ${invoice.chargedOn}</span><span>−${invoice.totalPaidDisplay}</span></div>
        <div style="border-top:1.5px solid #e8e6e0;margin-top:8px;padding-top:12px;display:flex;justify-content:space-between;font-weight:600;"><span>Balance due</span><span>₹0.00</span></div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;padding:20px 48px 28px;border-top:1.5px solid #e8e6e0;background:#fafaf8;">
      <div>
        <div style="font-size:11px;color:#9e9b96;letter-spacing:0.6px;font-weight:600;">PAYMENT METHOD</div>
        <div style="margin-top:8px;font-size:13.5px;font-weight:500;">${invoice.paymentMethodLabel}</div>
        <div style="font-size:12px;color:#9e9b96;margin-top:2px;">${invoice.paymentExpiry}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:11px;color:#9e9b96;letter-spacing:0.6px;font-weight:600;">NEXT BILLING DATE</div>
        <div style="margin-top:8px;font-size:13.5px;font-weight:600;">${invoice.nextBillingDate}</div>
        <div style="font-size:12px;color:#9e9b96;margin-top:2px;">${invoice.nextBillingInclGst} incl. GST</div>
      </div>
    </div>
    <div style="padding:20px 48px 28px;border-top:1.5px solid #e8e6e0;font-size:12px;color:#9e9b96;line-height:1.6;">
      Thank you for being a Clearform ${invoice.planName} subscriber. This is a computer-generated invoice and does not require a signature.
      For questions, write to billing@clearform.io or visit your billing dashboard.
    </div>
  </div>
</body>
</html>`;
}

function formatMoney(amount) {
  if (amount === 0) return '₹0.00';
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
