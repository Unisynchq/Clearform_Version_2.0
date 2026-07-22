export type ResponseCreatedTemplateVars = {
  toName: string;
  formTitle: string;
  formId: string;
  responseId: string;
  analyticsUrl: string;
  topAnswersHtml: string;
};

export type TierUpgradeTemplateVars = {
  toName: string;
  planName: string;
  tierLabel: string;
  responsesLimit: number;
  durationDays: number;
  expiresAtLabel: string;
  billingUrl: string;
  dashboardUrl: string;
  paymentId: string;
};

export type WelcomeSignInTemplateVars = {
  toName: string;
  dashboardUrl: string;
  billingUrl: string;
  supportEmail: string;
};

const BRAND = {
  purple: '#7c3aed',
  purpleDark: '#5b21b6',
  indigo: '#6366f1',
  violet: '#8b5cf6',
  text: '#111827',
  muted: '#6b7280',
  border: '#e5e7eb',
  bg: '#f9fafb',
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function emailShell(opts: {
  preheader: string;
  heroTitle: string;
  heroSubtitle?: string;
  bodyHtml: string;
  ctaLabel: string;
  ctaUrl: string;
  footerNote: string;
}): string {
  const subtitle = opts.heroSubtitle
    ? `<p style="margin:12px 0 0;font-size:16px;line-height:1.5;color:${BRAND.muted};">${opts.heroSubtitle}</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(opts.heroTitle)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:${BRAND.text};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(opts.preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BRAND.bg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid ${BRAND.border};border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(17,24,39,0.06);">
          <tr>
            <td style="padding:28px 32px 20px;background:linear-gradient(135deg,${BRAND.indigo},${BRAND.violet});color:#ffffff;">
              <div style="font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;opacity:0.9;">Clearform</div>
              <h1 style="margin:10px 0 0;font-size:28px;line-height:1.2;font-weight:700;">${escapeHtml(opts.heroTitle)}</h1>
              ${subtitle}
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px;font-size:16px;line-height:1.6;">
              ${opts.bodyHtml}
              <p style="margin:28px 0 0;">
                <a href="${opts.ctaUrl}" style="display:inline-block;background:${BRAND.purple};color:#ffffff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:10px;">${escapeHtml(opts.ctaLabel)}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;color:${BRAND.muted};font-size:13px;line-height:1.5;">
              ${opts.footerNote}
            </td>
          </tr>
        </table>
        <p style="max-width:600px;margin:16px auto 0;font-size:12px;line-height:1.5;color:#9ca3af;text-align:center;">
          Clearform · Intelligent forms for modern teams
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderResponseCreatedEmail(
  vars: ResponseCreatedTemplateVars,
): string {
  return `<!DOCTYPE html>
<html>
<body style="font-family: system-ui, -apple-system, sans-serif; color: #1a1a1c; line-height: 1.5; max-width: 560px;">
  <p>Hi ${escapeHtml(vars.toName)},</p>
  <p>You have a new response on <strong>${escapeHtml(vars.formTitle)}</strong>.</p>
  ${vars.topAnswersHtml}
  <p style="margin-top: 20px;">
    <a href="${vars.analyticsUrl}" style="color: #7c3aed; font-weight: 600;">View response in Clearform →</a>
  </p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
  <p style="color:#9ca3af;font-size:12px">Clearform · Response ${escapeHtml(vars.responseId)}</p>
</body>
</html>`;
}

export function renderTierUpgradeEmail(vars: TierUpgradeTemplateVars): string {
  const bodyHtml = `
    <p style="margin:0 0 16px;">Hi ${escapeHtml(vars.toName)},</p>
    <p style="margin:0 0 16px;">
      Your payment is verified and your account is now on
      <strong>${escapeHtml(vars.planName)}</strong> (${escapeHtml(vars.tierLabel)}).
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:20px 0;border:1px solid ${BRAND.border};border-radius:12px;overflow:hidden;">
      <tr>
        <td style="padding:14px 16px;background:#faf5ff;font-size:14px;font-weight:700;color:${BRAND.purpleDark};">What you unlocked</td>
      </tr>
      <tr>
        <td style="padding:16px;font-size:15px;line-height:1.7;">
          <div><strong>${vars.responsesLimit}</strong> responses included</div>
          <div><strong>${vars.durationDays}</strong> days of Pilot access</div>
          <div>Active until <strong>${escapeHtml(vars.expiresAtLabel)}</strong></div>
          <div style="margin-top:8px;color:${BRAND.muted};font-size:13px;">Receipt: ${escapeHtml(vars.paymentId)}</div>
        </td>
      </tr>
    </table>
    <p style="margin:0;">Jump back into Clearform to publish forms, track analytics, and use AI insights on your responses.</p>
  `;

  return emailShell({
    preheader: `You're now on ${vars.planName}. Pilot access is active.`,
    heroTitle: 'Upgrade confirmed',
    heroSubtitle: `${vars.planName} is live on your account`,
    bodyHtml,
    ctaLabel: 'Open billing & receipt',
    ctaUrl: vars.billingUrl,
    footerNote: `Need help? Reply to this email or visit your <a href="${vars.dashboardUrl}" style="color:${BRAND.purple};">dashboard</a>.`,
  });
}

export function renderWelcomeSignInEmail(
  vars: WelcomeSignInTemplateVars,
): string {
  const bodyHtml = `
    <p style="margin:0 0 16px;">Hi ${escapeHtml(vars.toName)},</p>
    <p style="margin:0 0 16px;">
      Welcome to Clearform. Your account is ready — build conversational forms, collect responses, and turn feedback into action.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:20px 0;border:1px solid ${BRAND.border};border-radius:12px;overflow:hidden;">
      <tr>
        <td style="padding:16px;font-size:15px;line-height:1.7;">
          <div>✓ Create your first form in minutes</div>
          <div>✓ Share a branded respondent link</div>
          <div>✓ Review analytics and AI insights</div>
        </td>
      </tr>
    </table>
    <p style="margin:0;">Ready to unlock more responses? Upgrade anytime from Profile → Billing.</p>
  `;

  return emailShell({
    preheader: 'Your Clearform account is ready.',
    heroTitle: 'Welcome aboard',
    heroSubtitle: 'Great to have you with us',
    bodyHtml,
    ctaLabel: 'Go to dashboard',
    ctaUrl: vars.dashboardUrl,
    footerNote: `Questions? Email <a href="mailto:${escapeHtml(vars.supportEmail)}" style="color:${BRAND.purple};">${escapeHtml(vars.supportEmail)}</a> or explore <a href="${vars.billingUrl}" style="color:${BRAND.purple};">billing</a>.`,
  });
}

export function formatTopAnswersHtml(
  pairs: { label: string; value: string }[],
): string {
  if (pairs.length === 0) return '';
  const items = pairs
    .slice(0, 5)
    .map(
      (p) =>
        `<li><strong>${escapeHtml(p.label)}:</strong> ${escapeHtml(p.value)}</li>`,
    )
    .join('');
  return `<ul style="padding-left: 18px; margin: 16px 0;">${items}</ul>`;
}
