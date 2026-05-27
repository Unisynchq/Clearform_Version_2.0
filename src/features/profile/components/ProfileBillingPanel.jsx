import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  RiArrowDownSLine,
  RiArrowRightLine,
  RiArrowUpSLine,
  RiLayoutGridLine,
} from 'react-icons/ri';
import clearformLogo from '@/assets/clearform-high-resolution-logo-transparent.png';
import BillingChoosePlanModal from '@/features/profile/components/BillingChoosePlanModal';
import BillingInvoiceExpanded from '@/features/profile/components/billing/BillingInvoiceExpanded';
import TaxInvoiceModal from '@/features/profile/components/billing/TaxInvoiceModal';
import { getUsageHint, getUsageStatus } from '@/features/profile/utils/profileBillingDefaults';
import { getWorkspaceUsageMetrics } from '@/features/profile/utils/workspaceUsageMetrics';
import { buildTaxInvoice } from '@/features/profile/utils/profileBillingInvoice';
import { FREE_PLAN, getActivePlanDisplay } from '@/features/profile/utils/profileBillingPlans';
import { readBillingSubscription } from '@/features/profile/utils/profileBillingStorage';
import { dispatchSyncSystemAlerts } from '@/utils/syncSystemAlertsToStore';
import { store } from '@/store/store';

const ALERT_COLOR = '#e8473f';

const UsageMeter = ({
  label,
  used,
  limit,
  metric,
  warnOnNearLimit = false,
  valueClassName = 'text-[#1a1a18]',
  barClassName = 'bg-[#1a1a18]',
}) => {
  const status = getUsageStatus(used, limit);
  const isAlert =
    warnOnNearLimit && (status === 'near-limit' || status === 'at-limit');
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const hint = getUsageHint(metric, used, limit, status);

  return (
    <div className="flex flex-col gap-[5px] rounded-[10px] bg-[#f0f0ee] p-[14px]">
      <p className="text-[11px] font-medium text-[#888580]">{label}</p>
      <div className="flex items-baseline justify-between">
        <span
          className={`text-[18px] font-semibold leading-none ${
            isAlert ? '' : valueClassName
          }`}
          style={isAlert ? { color: ALERT_COLOR } : undefined}
        >
          {used.toLocaleString('en-IN')}
        </span>
        <span className="text-[12px] text-[#888580]">/ {limit.toLocaleString('en-IN')}</span>
      </div>
      <div className="h-[5px] w-full overflow-hidden rounded-[3px] bg-[#e8e8e6]">
        <div
          className={`h-full rounded-[3px] transition-[width] ${isAlert ? '' : barClassName}`}
          style={{
            width: `${pct}%`,
            backgroundColor: isAlert ? ALERT_COLOR : undefined,
          }}
        />
      </div>
      <p
        className="text-[11px]"
        style={isAlert ? { color: ALERT_COLOR } : { color: '#888580' }}
      >
        {hint}
      </p>
    </div>
  );
};

const ProfileBillingPanel = () => {
  const dispatch = useDispatch();
  const email = useSelector((s) => s.auth.email);
  const firstName = useSelector((s) => s.auth.firstName);
  const lastName = useSelector((s) => s.auth.lastName);
  const forms = useSelector((s) => s.forms.forms);
  const responsesByFormId = useSelector((s) => s.forms.responsesByFormId);

  const [choosePlanOpen, setChoosePlanOpen] = useState(false);
  const [billingVersion, setBillingVersion] = useState(0);
  const [invoiceExpanded, setInvoiceExpanded] = useState(true);
  const [taxInvoiceOpen, setTaxInvoiceOpen] = useState(false);

  const subscription = useMemo(
    () => readBillingSubscription(email),
    [email, billingVersion]
  );

  const paidPlan = subscription
    ? getActivePlanDisplay(subscription.planId, subscription.interval)
    : null;

  const plan = paidPlan ?? FREE_PLAN;
  const isPaid = Boolean(subscription?.planId);

  const usageMetrics = useMemo(
    () => getWorkspaceUsageMetrics({ forms, email, responsesByFormId }),
    [forms, email, responsesByFormId, billingVersion],
  );
  const { formsUsed, responsesUsed, teamUsed } = usageMetrics;

  const invoice = useMemo(() => {
    if (!subscription) return null;
    return buildTaxInvoice(subscription, { firstName, lastName, email });
  }, [subscription, firstName, lastName, email]);

  const showUpgradeCta = useMemo(() => {
    if (isPaid) return false;
    const responsesStatus = getUsageStatus(responsesUsed, plan.responsesLimit);
    return responsesStatus === 'near-limit' || responsesStatus === 'at-limit';
  }, [isPaid, responsesUsed, plan.responsesLimit]);

  const handleBillingUpdated = () => {
    setBillingVersion((v) => v + 1);
    setInvoiceExpanded(true);
    dispatchSyncSystemAlerts(dispatch, store.getState());
  };

  return (
    <>
      <BillingChoosePlanModal
        open={choosePlanOpen}
        onClose={() => setChoosePlanOpen(false)}
        onBillingUpdated={handleBillingUpdated}
        customerEmail={email}
        customer={{ firstName, lastName, email }}
      />
      <TaxInvoiceModal
        open={taxInvoiceOpen}
        onClose={() => setTaxInvoiceOpen(false)}
        invoice={invoice}
      />

      <div className="flex flex-col gap-4">
        <section className="overflow-hidden rounded-[12px] border border-[#e5e3df] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0f0ee] px-5 py-4">
            <div>
              <h2 className="text-[13px] font-semibold text-[#111110]">Current plan</h2>
              <p className="mt-px text-[12px] text-[#888580]">
                {isPaid ? plan.headerSubtext : FREE_PLAN.headerSubtext}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setChoosePlanOpen(true)}
              className="rounded-[8px] bg-[#111110] px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-[#2d2d2b]"
            >
              {isPaid ? 'Manage →' : 'Upgrade plan'}
            </button>
          </div>

          <div className="flex flex-col gap-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3.5">
                <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-[#e8e8e6] bg-[#f0f0ee]">
                  {isPaid ? (
                    <img
                      src={clearformLogo}
                      alt=""
                      className="size-8 object-contain"
                      aria-hidden
                    />
                  ) : (
                    <RiLayoutGridLine size={20} className="text-[#6b6b68]" aria-hidden />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[16px] font-semibold text-[#111110]">{plan.name}</span>
                    <span
                      className={`rounded-full px-[9px] py-[3px] text-[10px] font-medium ${
                        isPaid
                          ? 'bg-[#e8f5e9] text-[#2d7d32]'
                          : 'bg-[#f0f0ee] text-[#555350]'
                      }`}
                    >
                      Active
                    </span>
                  </div>
                  <p className="mt-0.5 text-[12px] text-[#888580]">{plan.limitsLabel}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[20px] font-bold leading-none text-[#111110]">
                  {isPaid ? plan.priceLabel : FREE_PLAN.priceLabel}
                  {isPaid ? (
                    <span className="text-[13px] font-normal text-[#888580]">/mo</span>
                  ) : null}
                </p>
                <p className="mt-0.5 text-[11px] text-[#888580]">
                  {isPaid ? plan.renewLabel : FREE_PLAN.priceSubtext}
                </p>
              </div>
            </div>

            {isPaid ? (
              <>
                <div className="h-px bg-[#f0f0ee]" aria-hidden />
                <div>
                  <p className="text-[12px] font-semibold text-[#111110]">
                    Usage this month
                    <span className="font-normal text-[#888580]"> · Resets {invoice?.nextBillingDate?.replace(/, \d{4}$/, '') ?? 'next cycle'}</span>
                  </p>
                  <div
                    className={`mt-3 grid grid-cols-1 gap-3 ${
                      subscription.planId === 'pro' ? 'sm:grid-cols-2' : 'sm:grid-cols-3'
                    }`}
                  >
                    {subscription.planId === 'starter' ? (
                      <UsageMeter
                        label="Forms used"
                        used={formsUsed}
                        limit={plan.formsLimit}
                        metric="forms"
                      />
                    ) : null}
                    <UsageMeter
                      label="Responses"
                      used={responsesUsed}
                      limit={plan.responsesLimit}
                      metric="responses"
                    />
                    {subscription.planId === 'starter' ? (
                      <UsageMeter
                        label="Team members"
                        used={teamUsed}
                        limit={plan.teamLimit}
                        metric="team"
                      />
                    ) : (
                      <div className="hidden rounded-[10px] bg-[#f0f0ee] sm:block" aria-hidden />
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="h-px bg-[#f0f0ee]" aria-hidden />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <UsageMeter
                    label="Forms used"
                    used={formsUsed}
                    limit={plan.formsLimit}
                    metric="forms"
                  />
                  <UsageMeter
                    label="Responses this month"
                    used={responsesUsed}
                    limit={plan.responsesLimit}
                    metric="responses"
                    warnOnNearLimit
                  />
                  <UsageMeter
                    label="Team members"
                    used={teamUsed}
                    limit={plan.teamLimit}
                    metric="team"
                  />
                </div>
              </>
            )}
          </div>
        </section>

        {showUpgradeCta ? (
          <section className="overflow-hidden rounded-[12px] border border-[#1a1a18] bg-[#1a1a18]">
            <div className="flex flex-col gap-1 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.88px] text-white/40">
                Upgrade to Clearform Pro
              </p>
              <h3 className="pt-0.5 text-[18px] font-bold text-white">
                You&apos;re almost out of responses
              </h3>
              <p className="pb-2 text-[13px] leading-[20.8px] text-white/50">
                Get unlimited forms, 10,000 responses/month, AI dynamic questions, and team
                collaboration — from ₹799/month.
              </p>
              <button
                type="button"
                onClick={() => setChoosePlanOpen(true)}
                className="inline-flex w-fit items-center gap-1 rounded-[10px] bg-white px-6 py-3 text-[14px] font-medium text-[#1a1a18] transition-colors hover:bg-[#f7f7f6]"
              >
                View plans &amp; upgrade
                <RiArrowRightLine size={16} aria-hidden />
              </button>
            </div>
          </section>
        ) : null}

        <section className="overflow-hidden rounded-[12px] border border-[#e8e8e6] bg-white">
          {invoice ? (
            <>
              <button
                type="button"
                onClick={() => setInvoiceExpanded((v) => !v)}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-[#fafaf8]"
              >
                <div>
                  <h2 className="text-[13px] font-semibold text-[#111110]">Invoices</h2>
                  <p className="mt-px text-[11.5px] tracking-[0.1px] text-[#9e9b96]">
                    {invoice.invoiceNumber} · {invoice.issueDate}
                  </p>
                </div>
                {invoiceExpanded ? (
                  <RiArrowUpSLine size={22} className="shrink-0 text-[#656462]" aria-hidden />
                ) : (
                  <RiArrowDownSLine size={22} className="shrink-0 text-[#656462]" aria-hidden />
                )}
              </button>
              {invoiceExpanded ? (
                <BillingInvoiceExpanded
                  invoice={invoice}
                  onOpenTaxInvoice={() => setTaxInvoiceOpen(true)}
                />
              ) : null}
            </>
          ) : (
            <>
              <div className="border-b border-[#f0f0ee] px-5 py-4">
                <h2 className="text-[13px] font-semibold text-[#1a1a18]">Invoices</h2>
                <p className="mt-px text-[12px] text-[#888580]">No invoices yet</p>
              </div>
              <div className="flex flex-col items-center gap-4 px-5 py-8">
                <p className="max-w-md text-center text-[13px] text-[#888580]">
                  Invoices will appear here once you subscribe to a paid plan.
                </p>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
};

export default ProfileBillingPanel;
