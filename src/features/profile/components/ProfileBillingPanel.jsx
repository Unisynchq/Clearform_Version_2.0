import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import {
  RiArrowDownSLine,
  RiArrowRightLine,
  RiArrowUpSLine,
  RiCheckLine,
  RiLayoutGridLine,
} from 'react-icons/ri';
import clearformLogo from '@/assets/clearform-high-resolution-logo-transparent (1).png';
import { isApiConfigured } from '@/config/env';
import { useBillingStatus } from '@/features/billing/utils/useBillingStatus';
import { captureAndClaimPendingPurchase } from '@/features/billing/utils/billingReturnFlow';
import { openPilotRazorpayCheckout } from '@/features/billing/utils/openPilotRazorpayCheckout';
import BillingInvoiceExpanded from '@/features/profile/components/billing/BillingInvoiceExpanded';
import TaxInvoiceModal from '@/features/profile/components/billing/TaxInvoiceModal';
import { getUsageHint, getUsageStatus } from '@/features/profile/utils/profileBillingDefaults';
import { getWorkspaceUsageMetrics } from '@/features/profile/utils/workspaceUsageMetrics';
import {
  API_FREE_PLAN,
  FREE_PLAN,
  getActivePlanDisplay,
  PILOT_35_PLAN_ID,
} from '@/features/profile/utils/profileBillingPlans';
import {
  buildInvoiceFromBillingReceipt,
  buildTaxInvoice,
} from '@/features/profile/utils/profileBillingInvoice';
import { readBillingSubscription } from '@/features/profile/utils/profileBillingStorage';
import { dispatchSyncSystemAlerts } from '@/utils/syncSystemAlertsToStore';
import { store } from '@/store/store';
import { useToast } from '@/hooks/useToast';

const ALERT_COLOR = '#e8473f';

const UsageMeter = ({
  label,
  used,
  limit,
  metric,
  warnOnNearLimit = false,
  unlimited = false,
  valueClassName = 'text-[#1a1a18]',
  barClassName = 'bg-[#1a1a18]',
}) => {
  const status = unlimited ? 'ok' : getUsageStatus(used, limit);
  const isAlert =
    warnOnNearLimit && (status === 'near-limit' || status === 'at-limit');
  const pct =
    unlimited || limit == null || limit <= 0
      ? 0
      : Math.min(100, (used / limit) * 100);
  const hint = unlimited
    ? 'Unlimited on your plan'
    : getUsageHint(metric, used, limit, status);

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
        <span className="text-[12px] text-[#888580]">
          {unlimited ? 'Unlimited' : `/ ${limit.toLocaleString('en-IN')}`}
        </span>
      </div>
      {!unlimited ? (
        <div className="h-[5px] w-full overflow-hidden rounded-[3px] bg-[#e8e8e6]">
          <div
            className={`h-full rounded-[3px] transition-[width] ${isAlert ? '' : barClassName}`}
            style={{
              width: `${pct}%`,
              backgroundColor: isAlert ? ALERT_COLOR : undefined,
            }}
          />
        </div>
      ) : null}
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
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const email = useSelector((s) => s.auth.email);
  const firstName = useSelector((s) => s.auth.firstName);
  const lastName = useSelector((s) => s.auth.lastName);
  const forms = useSelector((s) => s.forms.forms);
  const responsesByFormId = useSelector((s) => s.forms.responsesByFormId);

  const [billingVersion, setBillingVersion] = useState(0);
  const [invoiceExpanded, setInvoiceExpanded] = useState(true);
  const [taxInvoiceOpen, setTaxInvoiceOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const upgradeStartedRef = useRef(false);

  const useApiBilling = isApiConfigured();
  const {
    status: apiStatus,
    loading: statusLoading,
    error: statusError,
    refresh: refreshBillingStatus,
  } = useBillingStatus();

  useEffect(() => {
    if (billingVersion === 0) return;
    refreshBillingStatus().catch(() => {});
  }, [billingVersion, refreshBillingStatus]);

  useEffect(() => {
    if (!useApiBilling) return;
    (async () => {
      const result = await captureAndClaimPendingPurchase({ showToast });
      if (result.claimed) {
        setBillingVersion((v) => v + 1);
      }
    })();
  }, [showToast, useApiBilling]);

  useEffect(() => {
    if (!apiStatus) return;
    dispatchSyncSystemAlerts(dispatch, store.getState(), { apiBilling: apiStatus });
  }, [apiStatus, dispatch]);

  const localSubscription = useMemo(
    () => (useApiBilling ? null : readBillingSubscription(email)),
    [email, billingVersion, useApiBilling],
  );

  const isPaid = useApiBilling
    ? apiStatus?.planId === PILOT_35_PLAN_ID && apiStatus?.status !== 'EXPIRED'
    : Boolean(localSubscription?.planId);

  const isPilotExpired = useApiBilling && apiStatus?.status === 'EXPIRED';

  const handleStartPilotCheckout = useCallback(async () => {
    if (!useApiBilling || isPaid) return;
    setCheckoutLoading(true);
    try {
      await openPilotRazorpayCheckout();
    } catch (err) {
      showToast({
        type: 'error',
        message: err?.message ?? 'Could not start checkout.',
        duration: 6000,
      });
    } finally {
      setCheckoutLoading(false);
    }
  }, [useApiBilling, isPaid, showToast]);

  useEffect(() => {
    if (searchParams.get('upgrade') !== 'pilot' || !useApiBilling || statusLoading) return;
    if (isPaid) return;
    if (upgradeStartedRef.current) return;
    upgradeStartedRef.current = true;

    setCheckoutLoading(true);
    openPilotRazorpayCheckout()
      .catch((err) => {
        showToast({
          type: 'error',
          message: err?.message ?? 'Could not start checkout.',
          duration: 6000,
        });
      })
      .finally(() => setCheckoutLoading(false));

    const next = new URLSearchParams(searchParams);
    next.delete('upgrade');
    setSearchParams(next, { replace: true });
  }, [
    searchParams,
    isPaid,
    useApiBilling,
    statusLoading,
    setSearchParams,
    showToast,
  ]);

  const plan = useMemo(() => {
    if (useApiBilling && apiStatus) {
      if (apiStatus.planId === PILOT_35_PLAN_ID && apiStatus.status !== 'EXPIRED') {
        return (
          getActivePlanDisplay(apiStatus.planId, 'pilot', {
            expiresAt: apiStatus.expiresAt ?? apiStatus.periodEnd,
          }) ?? API_FREE_PLAN
        );
      }
      return API_FREE_PLAN;
    }
    if (localSubscription) {
      return (
        getActivePlanDisplay(localSubscription.planId, localSubscription.interval) ??
        FREE_PLAN
      );
    }
    return FREE_PLAN;
  }, [useApiBilling, apiStatus, localSubscription]);

  const usageMetrics = useMemo(() => {
    if (useApiBilling && apiStatus) {
      return getWorkspaceUsageMetrics({ forms, email, responsesByFormId, apiBilling: apiStatus });
    }
    return getWorkspaceUsageMetrics({ forms, email, responsesByFormId });
  }, [useApiBilling, apiStatus, forms, email, responsesByFormId, billingVersion]);

  const { formsUsed, responsesUsed, teamUsed } = usageMetrics;

  const invoice = useMemo(() => {
    if (useApiBilling && apiStatus?.receipt) {
      return buildInvoiceFromBillingReceipt(
        apiStatus.receipt,
        { firstName, lastName, email },
        { expiresAt: apiStatus.expiresAt, periodEnd: apiStatus.periodEnd },
      );
    }
    if (localSubscription) {
      return buildTaxInvoice(localSubscription, { firstName, lastName, email });
    }
    return null;
  }, [useApiBilling, apiStatus, localSubscription, firstName, lastName, email]);

  const showUpgradeCta = useMemo(() => {
    if (!useApiBilling || isPaid) return false;
    const responsesStatus = getUsageStatus(responsesUsed, plan.responsesLimit);
    return (
      isPilotExpired ||
      responsesStatus === 'near-limit' ||
      responsesStatus === 'at-limit'
    );
  }, [useApiBilling, isPaid, isPilotExpired, responsesUsed, plan.responsesLimit]);


  const formsUnlimited = plan.formsLimit == null;
  const isPilotPlan = plan.id === PILOT_35_PLAN_ID;

  return (
    <>
      <TaxInvoiceModal
        open={taxInvoiceOpen}
        onClose={() => setTaxInvoiceOpen(false)}
        invoice={invoice}
      />

      <div className="flex flex-col gap-4">
        {statusError ? (
          <p className="rounded-[10px] border border-[#f5c6c3] bg-[#fff5f5] px-4 py-3 text-[13px] text-[#c74e43]">
            {statusError}
          </p>
        ) : null}

        <section className="overflow-hidden rounded-[12px] border border-[#e5e3df] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0f0ee] px-5 py-4">
            <div>
              <h2 className="text-[13px] font-semibold text-[#111110]">Current plan</h2>
              <p className="mt-px text-[12px] text-[#888580]">
                {isPaid ? plan.headerSubtext : plan.headerSubtext}
              </p>
            </div>
            <button
              type="button"
              onClick={isPaid ? () => setInvoiceExpanded(true) : handleStartPilotCheckout}
              disabled={checkoutLoading}
              className="rounded-[8px] bg-[#111110] px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-[#2d2d2b] disabled:opacity-60"
            >
              {checkoutLoading
                ? 'Opening checkout…'
                : isPaid
                  ? 'View receipt'
                  : isPilotExpired
                    ? 'Renew Pilot — $34.99'
                    : 'Start Pilot — $34.99'}
            </button>
          </div>

          <div className="flex flex-col gap-4 p-5">
            {statusLoading || checkoutLoading ? (
              <p className="text-[13px] text-[#888580]">Loading billing…</p>
            ) : (
              <>
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
                          {isPaid ? 'Active' : isPilotExpired ? 'Expired' : 'Free'}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[12px] text-[#888580]">{plan.limitsLabel}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[20px] font-bold leading-none text-[#111110]">
                      {plan.priceLabel}
                      {isPaid && !plan.isOneTime ? (
                        <span className="text-[13px] font-normal text-[#888580]">/mo</span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#888580]">
                      {isPaid ? plan.renewLabel : plan.priceSubtext}
                    </p>
                  </div>
                </div>

                <div className="h-px bg-[#f0f0ee]" aria-hidden />

                <div>
                  <p className="text-[12px] font-semibold text-[#111110]">
                    {isPilotPlan ? 'Pilot usage' : 'Usage'}
                    {apiStatus?.periodLabel ? (
                      <span className="font-normal text-[#888580]"> · {apiStatus.periodLabel}</span>
                    ) : isPaid && plan.renewLabel ? (
                      <span className="font-normal text-[#888580]"> · {plan.renewLabel}</span>
                    ) : null}
                  </p>
                  <div
                    className={`mt-3 grid grid-cols-1 gap-3 ${
                      isPilotPlan ? 'sm:grid-cols-3' : 'sm:grid-cols-3'
                    }`}
                  >
                    <UsageMeter
                      label="Forms used"
                      used={formsUsed}
                      limit={plan.formsLimit ?? 0}
                      metric="forms"
                      unlimited={formsUnlimited}
                    />
                    <UsageMeter
                      label={isPilotPlan ? 'Responses' : 'Responses (total)'}
                      used={responsesUsed}
                      limit={plan.responsesLimit}
                      metric="responses"
                      warnOnNearLimit={!isPaid}
                    />
                    <UsageMeter
                      label="Workspaces"
                      used={teamUsed}
                      limit={plan.workspacesLimit ?? plan.teamLimit ?? 1}
                      metric="team"
                    />
                  </div>
                </div>

                {useApiBilling && Array.isArray(apiStatus?.features) && apiStatus.features.length > 0 ? (
                  <div>
                    <p className="text-[12px] font-semibold text-[#111110]">
                      Included in your plan
                    </p>
                    <ul className="mt-3 flex flex-col gap-2">
                      {apiStatus.features
                        .filter((f) => f.included)
                        .map((feature) => (
                          <li
                            key={feature.id}
                            className="flex items-start gap-2 text-[13px] text-[#444340]"
                          >
                            <RiCheckLine
                              size={16}
                              className="mt-0.5 shrink-0 text-[#2d7d32]"
                              aria-hidden
                            />
                            <span>{feature.label}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </section>

        {showUpgradeCta ? (
          <section className="overflow-hidden rounded-[12px] border border-[#1a1a18] bg-[#1a1a18]">
            <div className="flex flex-col gap-1 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.88px] text-white/40">
                Clearform Pilot
              </p>
              <h3 className="pt-0.5 text-[18px] font-bold text-white">
                {isPilotExpired
                  ? 'Your pilot access has ended'
                  : "You're almost out of responses"}
              </h3>
              <p className="pb-2 text-[13px] leading-[20.8px] text-white/50">
                $34.99 one-time · 90 days · 300 responses · AI quality scoring included.
              </p>
              <button
                type="button"
                onClick={handleStartPilotCheckout}
                disabled={checkoutLoading}
                className="inline-flex w-fit items-center gap-1 rounded-[10px] bg-white px-6 py-3 text-[14px] font-medium text-[#1a1a18] transition-colors hover:bg-[#f7f7f6] disabled:opacity-60"
              >
                {checkoutLoading ? 'Opening checkout…' : 'Start Pilot — $34.99'}
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
                  <h2 className="text-[13px] font-semibold text-[#111110]">Receipt</h2>
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
                <h2 className="text-[13px] font-semibold text-[#1a1a18]">Receipt</h2>
                <p className="mt-px text-[12px] text-[#888580]">No receipts yet</p>
              </div>
              <div className="flex flex-col items-center gap-4 px-5 py-8">
                <p className="max-w-md text-center text-[13px] text-[#888580]">
                  Your Razorpay payment receipt will appear here after you claim a pilot purchase.
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
