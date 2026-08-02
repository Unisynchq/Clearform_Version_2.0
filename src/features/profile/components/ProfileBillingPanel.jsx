import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import {
  RiArrowDownSLine,
  RiArrowRightLine,
  RiArrowUpSLine,
  RiCheckLine,
  RiLockLine,
} from 'react-icons/ri';
import clearformLogo from '@/assets/clearform-high-resolution-logo-transparent (1).png';
import { isApiConfigured } from '@/config/env';
import { useBillingStatus } from '@/features/billing/utils/useBillingStatus';
import { captureAndClaimPendingPurchase } from '@/features/billing/utils/billingReturnFlow';
import { openPublishPassRazorpayCheckout } from '@/features/billing/utils/openPublishPassRazorpayCheckout';
import { openStarterRazorpayCheckout } from '@/features/billing/utils/openStarterRazorpayCheckout';
import PublishPassesWidget from '@/features/billing/components/PublishPassesWidget';
import PromoCodeRedeemBox from '@/features/billing/components/PromoCodeRedeemBox';
import BillingInvoiceExpanded from '@/features/profile/components/billing/BillingInvoiceExpanded';
import TaxInvoiceModal from '@/features/profile/components/billing/TaxInvoiceModal';
import { getUsageHint, getUsageStatus } from '@/features/profile/utils/profileBillingDefaults';
import { getWorkspaceUsageMetrics } from '@/features/profile/utils/workspaceUsageMetrics';
import {
  API_UNPAID_PLAN,
  FREE_PLAN,
  getActivePlanDisplay,
  PILOT_35_PLAN_ID,
  PRO_PLAN_ID,
  STARTER_PLAN_ID,
} from '@/features/profile/utils/profileBillingPlans';
import {
  buildInvoiceFromBillingReceipt,
  buildTaxInvoice,
} from '@/features/profile/utils/profileBillingInvoice';
import { readBillingSubscription } from '@/features/profile/utils/profileBillingStorage';
import { dispatchSyncSystemAlerts } from '@/utils/syncSystemAlertsToStore';
import { store } from '@/store/store';
import { useToast } from '@/hooks/useToast';
import { trackBillingViewed } from '@/analytics/track';

const ALERT_COLOR = '#e8473f';

const UsageMeter = ({
  label,
  used,
  limit,
  metric,
  warnOnNearLimit = false,
  unlimited = false,
  locked = false,
  valueClassName = 'text-[#1a1a18]',
  barClassName = 'bg-[#1a1a18]',
  numberLocale = 'en-IN',
}) => {
  if (locked) {
    return (
      <div className="flex flex-col gap-[5px] rounded-[10px] bg-[#f0f0ee] p-[14px]">
        <p className="text-[11px] font-medium text-[#888580]">{label}</p>
        <div className="flex items-baseline justify-between">
          <span className={`text-[18px] font-semibold leading-none ${valueClassName}`}>
            {used.toLocaleString(numberLocale)}
          </span>
          <span className="inline-flex items-center gap-1 text-[12px] text-[#888580]">
            <RiLockLine size={12} aria-hidden />
            Locked
          </span>
        </div>
        <p className="text-[11px] text-[#888580]">Unlock with ₹99 Pass or Starter</p>
      </div>
    );
  }

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
          {used.toLocaleString(numberLocale)}
        </span>
        <span className="text-[12px] text-[#888580]">
          {unlimited ? 'Unlimited' : `/ ${limit.toLocaleString(numberLocale)}`}
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
  const billingViewTrackedRef = useRef(false);

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

  useEffect(() => {
    if (!apiStatus || billingViewTrackedRef.current) return;
    billingViewTrackedRef.current = true;
    trackBillingViewed({
      planId: apiStatus.planId,
      aiTier: apiStatus.aiTier,
    });
  }, [apiStatus]);

  const localSubscription = useMemo(
    () => (useApiBilling ? null : readBillingSubscription(email)),
    [email, billingVersion, useApiBilling],
  );

  const entitlements = apiStatus?.entitlements ?? null;
  const publishPassesAvailable = entitlements?.publishPassesAvailable ?? 0;
  const canPublishUnlimited = Boolean(
    entitlements?.canPublish &&
      (apiStatus?.planId === STARTER_PLAN_ID ||
        apiStatus?.planId === PRO_PLAN_ID ||
        apiStatus?.planId === PILOT_35_PLAN_ID) &&
      apiStatus?.status !== 'EXPIRED' &&
      apiStatus?.status !== 'UNPAID',
  );
  const isStarterOrPro = Boolean(
    useApiBilling &&
      (apiStatus?.planId === STARTER_PLAN_ID ||
        apiStatus?.planId === PRO_PLAN_ID ||
        apiStatus?.planId === PILOT_35_PLAN_ID) &&
      apiStatus?.status !== 'EXPIRED' &&
      apiStatus?.status !== 'UNPAID',
  );

  const isPaid = useApiBilling ? isStarterOrPro : Boolean(localSubscription?.planId);

  const isPlanExpired = useApiBilling && apiStatus?.status === 'EXPIRED';
  const isUnpaid =
    useApiBilling &&
    (!apiStatus ||
      apiStatus.status === 'UNPAID' ||
      apiStatus.status === 'EXPIRED' ||
      apiStatus.planId === 'unpaid' ||
      apiStatus.planId === 'free' ||
      !isPaid);
  const isPromoTrial = useApiBilling && isPaid && apiStatus?.source === 'PROMO';

  const handleBuyPublishPass = useCallback(async () => {
    if (!useApiBilling) return;
    setCheckoutLoading(true);
    try {
      await openPublishPassRazorpayCheckout();
    } catch (err) {
      showToast({
        type: 'error',
        message: err?.message ?? 'Could not start checkout.',
        duration: 6000,
      });
    } finally {
      setCheckoutLoading(false);
    }
  }, [useApiBilling, showToast]);

  const handleBuyStarter = useCallback(async () => {
    if (!useApiBilling) return;
    setCheckoutLoading(true);
    try {
      await openStarterRazorpayCheckout({ currency: 'INR' });
    } catch (err) {
      showToast({
        type: 'error',
        message: err?.message ?? 'Could not start checkout.',
        duration: 6000,
      });
    } finally {
      setCheckoutLoading(false);
    }
  }, [useApiBilling, showToast]);

  useEffect(() => {
    const upgrade = searchParams.get('upgrade');
    if (!upgrade || !useApiBilling || statusLoading) return;
    if (upgradeStartedRef.current) return;
    upgradeStartedRef.current = true;

    setCheckoutLoading(true);
    const start =
      upgrade === 'starter' || upgrade === 'starter_usd'
        ? openStarterRazorpayCheckout({
            currency: upgrade === 'starter_usd' ? 'USD' : 'INR',
          })
        : upgrade === 'publish_pass' || upgrade === 'pass'
          ? openPublishPassRazorpayCheckout()
          : upgrade === 'pilot'
            ? openPublishPassRazorpayCheckout()
            : null;

    if (start) {
      start
        .catch((err) => {
          showToast({
            type: 'error',
            message: err?.message ?? 'Could not start checkout.',
            duration: 6000,
          });
        })
        .finally(() => setCheckoutLoading(false));
    } else {
      setCheckoutLoading(false);
    }

    const next = new URLSearchParams(searchParams);
    next.delete('upgrade');
    setSearchParams(next, { replace: true });
  }, [
    searchParams,
    useApiBilling,
    statusLoading,
    setSearchParams,
    showToast,
  ]);

  const plan = useMemo(() => {
    if (useApiBilling && apiStatus) {
      const display =
        getActivePlanDisplay(apiStatus.planId, 'monthly', {
          expiresAt: apiStatus.expiresAt ?? apiStatus.periodEnd,
          isTrial: apiStatus.source === 'PROMO',
          status: apiStatus.status,
        }) ?? API_UNPAID_PLAN;
      // Active paid only — expired / unpaid stay on locked card even if planId was remapped.
      if (
        (apiStatus.planId === STARTER_PLAN_ID ||
          apiStatus.planId === PRO_PLAN_ID ||
          apiStatus.planId === PILOT_35_PLAN_ID) &&
        apiStatus.status !== 'EXPIRED' &&
        apiStatus.status !== 'UNPAID'
      ) {
        return display;
      }
      return (
        getActivePlanDisplay('unpaid', 'monthly', { status: apiStatus.status }) ??
        API_UNPAID_PLAN
      );
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

  const {
    formsUsed,
    responsesUsed,
    teamUsed,
    teamLimit: workspacesLimit,
    aiCreditsUsed,
    aiCreditsLimit,
    aiCreditsPeriodLabel,
  } = usageMetrics;

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

  /** Always surface unlock CTAs when unpaid / expired — no free tier soft-landing. */
  const showUpgradeCta = useMemo(() => {
    if (!useApiBilling || isPaid) return false;
    return true;
  }, [useApiBilling, isPaid]);

  const formsUnlimited = plan.formsLimit == null && isPaid;
  const isProPlan = plan.id === PRO_PLAN_ID || plan.id === PILOT_35_PLAN_ID;

  /** Unpaid always shows the unlock list (matches pricing philosophy; works before BE redeploy). */
  const UNLOCK_FEATURES = [
    { id: 'publish_pass', label: 'Publish Pass (₹99) — one form live, link + QR', included: false },
    { id: 'starter', label: 'Starter (₹499/mo) — unlimited publish, embed, Sheets', included: false },
    { id: 'responses', label: '200 responses / month on Starter · 100 per form on Pass', included: false },
    { id: 'insights', label: 'AI Insights + quality scoring on Starter / Pro', included: false },
    { id: 'export', label: 'Export & advanced analytics on Starter / Pro', included: false },
  ];
  const displayFeatures = isUnpaid
    ? UNLOCK_FEATURES
    : (Array.isArray(apiStatus?.features) ? apiStatus.features.filter((f) => f.included) : []);

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

        {useApiBilling ? (
          <PublishPassesWidget
            available={publishPassesAvailable}
            canPublishUnlimited={canPublishUnlimited}
            preferredCurrency="INR"
            onCheckoutStarted={setCheckoutLoading}
          />
        ) : null}

        <section className="overflow-hidden rounded-[12px] border border-[#e5e3df] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0f0ee] px-5 py-4">
            <div>
              <h2 className="text-[13px] font-semibold text-[#111110]">Current plan</h2>
              <p className="mt-px text-[12px] text-[#888580]">{plan.headerSubtext}</p>
            </div>
            <button
              type="button"
              onClick={
                isPaid
                  ? () => setInvoiceExpanded(true)
                  : handleBuyStarter
              }
              disabled={checkoutLoading}
              className="rounded-[8px] bg-[#111110] px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-[#2d2d2b] disabled:opacity-60"
            >
              {checkoutLoading
                ? 'Opening checkout…'
                : isPaid
                  ? 'View receipt'
                  : isPlanExpired
                    ? 'Renew Starter — ₹499/mo'
                    : 'Get Starter — ₹499/mo'}
            </button>
          </div>

          <div className="flex flex-col gap-4 p-5">
            {/* Only block on the *first* load — a background refetch (e.g. on
                tab focus) must not tear down already-rendered plan/usage data. */}
            {(statusLoading && !apiStatus) || checkoutLoading ? (
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
                        <RiLockLine size={20} className="text-[#6b6b68]" aria-hidden />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[16px] font-semibold text-[#111110]">{plan.name}</span>
                        <span
                          className={`rounded-full px-[9px] py-[3px] text-[10px] font-medium ${
                            isPromoTrial
                              ? 'bg-[#fff4e0] text-[#a15c07]'
                              : isPaid
                                ? 'bg-[#e8f5e9] text-[#2d7d32]'
                                : 'bg-[#f0f0ee] text-[#555350]'
                          }`}
                        >
                          {isPromoTrial
                            ? 'Trial'
                            : isPaid
                              ? 'Active'
                              : isPlanExpired
                                ? 'Expired'
                                : 'Locked'}
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
                    {isProPlan ? 'Pro usage' : 'Usage'}
                    {apiStatus?.periodLabel ? (
                      <span className="font-normal text-[#888580]"> · {apiStatus.periodLabel}</span>
                    ) : isPaid && plan.renewLabel ? (
                      <span className="font-normal text-[#888580]"> · {plan.renewLabel}</span>
                    ) : null}
                  </p>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <UsageMeter
                      label="Forms used"
                      used={formsUsed}
                      limit={plan.formsLimit ?? 0}
                      metric="forms"
                      unlimited={formsUnlimited}
                      locked={!isPaid}
                    />
                    <UsageMeter
                      label={isProPlan ? 'Responses' : 'Responses'}
                      used={responsesUsed}
                      limit={isPaid ? (plan.responsesLimit ?? 0) : 0}
                      metric="responses"
                      warnOnNearLimit={isPaid}
                      locked={!isPaid}
                    />
                    <UsageMeter
                      label="Workspaces"
                      used={teamUsed}
                      limit={workspacesLimit ?? plan.workspacesLimit ?? plan.teamLimit ?? 1}
                      metric="team"
                    />
                    {useApiBilling && isPaid && Number(aiCreditsLimit) > 0 ? (
                      <UsageMeter
                        label={`AI credits${aiCreditsPeriodLabel ? ` · ${aiCreditsPeriodLabel}` : ''}`}
                        used={aiCreditsUsed ?? 0}
                        limit={aiCreditsLimit}
                        metric="ai_credits"
                        warnOnNearLimit
                        numberLocale="en-US"
                      />
                    ) : null}
                  </div>
                </div>

                {useApiBilling && displayFeatures.length > 0 ? (
                  <div>
                    <p className="text-[12px] font-semibold text-[#111110]">
                      {isUnpaid ? 'Unlock with a paid plan' : 'Included in your plan'}
                    </p>
                    <ul className="mt-3 flex flex-col gap-2">
                      {displayFeatures.map((feature) => (
                        <li
                          key={feature.id}
                          className={`flex items-start gap-2 text-[13px] ${
                            feature.included ? 'text-[#444340]' : 'text-[#888580]'
                          }`}
                        >
                          {feature.included ? (
                            <RiCheckLine
                              size={16}
                              className="mt-0.5 shrink-0 text-[#2d7d32]"
                              aria-hidden
                            />
                          ) : (
                            <RiLockLine
                              size={16}
                              className="mt-0.5 shrink-0 text-[#b0aea8]"
                              aria-hidden
                            />
                          )}
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

        {useApiBilling && !isPaid ? (
          <PromoCodeRedeemBox onRedeemed={() => setBillingVersion((v) => v + 1)} />
        ) : null}

        {showUpgradeCta ? (
          <section className="overflow-hidden rounded-[12px] border border-[#1a1a18] bg-[#1a1a18]">
            <div className="flex flex-col gap-1 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.88px] text-white/40">
                Clearform pricing
              </p>
              <h3 className="pt-0.5 text-[18px] font-bold text-white">
                {isPlanExpired ? 'Your plan has ended' : 'Unlock publishing'}
              </h3>
              <p className="pb-2 text-[13px] leading-[20.8px] text-white/50">
                ₹99 Publish Pass · or Starter ₹499/mo for unlimited publish, embed, Sheets & AI Insights.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleBuyPublishPass}
                  disabled={checkoutLoading}
                  className="inline-flex w-fit items-center gap-1 rounded-[10px] border border-white/30 bg-transparent px-5 py-3 text-[14px] font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-60"
                >
                  {checkoutLoading ? 'Opening…' : 'Buy ₹99'}
                </button>
                <button
                  type="button"
                  onClick={handleBuyStarter}
                  disabled={checkoutLoading}
                  className="inline-flex w-fit items-center gap-1 rounded-[10px] bg-white px-6 py-3 text-[14px] font-medium text-[#1a1a18] transition-colors hover:bg-[#f7f7f6] disabled:opacity-60"
                >
                  {checkoutLoading ? 'Opening checkout…' : 'Starter — ₹499/mo'}
                  <RiArrowRightLine size={16} aria-hidden />
                </button>
              </div>
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
                  Your Razorpay payment receipt will appear here after you complete a purchase.
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
