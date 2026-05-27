import { useState } from 'react';
import { RiArrowRightLine, RiCheckLine, RiLockLine } from 'react-icons/ri';
import phonepeIcon from '@/assets/Icons/upi/phonepe.svg';
import gpayIcon from '@/assets/Icons/upi/gpay.svg';
import paytmIcon from '@/assets/Icons/upi/paytm.svg';
import {
  POPULAR_BANKS,
  UPI_APPS,
  calculateCheckoutSummary,
  getPayButtonLabel,
} from '@/features/profile/utils/profileBillingCheckout';

const UPI_ICON_BY_ID = {
  phonepe: phonepeIcon,
  gpay: gpayIcon,
  paytm: paytmIcon,
};

const PRO_ACCENT = '#e8473f';

const labelClass = 'text-[11px] font-semibold tracking-[0.22px] text-[#555350]';
const inputClass =
  'w-full rounded-[8px] border border-[#e8e8e6] bg-white px-[13px] py-[10px] text-[13px] text-[#1a1a18] outline-none placeholder:text-[#757575] focus:border-[#1a1a18]';

export const PaymentMethodTabs = ({ method, onChange }) => (
  <div className="flex justify-center gap-1.5 pt-1.5" role="tablist" aria-label="Payment method">
    {[
      { id: 'card', label: 'Card', icon: '💳' },
      { id: 'upi', label: 'UPI', icon: '⚡' },
      { id: 'netbanking', label: 'Netbanking', icon: '🏦' },
      { id: 'more', label: 'More', icon: '⋯', disabled: true },
    ].map((tab) => {
      const active = method === tab.id;
      return (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active}
          disabled={tab.disabled}
          onClick={() => !tab.disabled && onChange(tab.id)}
          className={`flex min-w-[50px] flex-col items-center gap-0.5 rounded-[8px] border px-2 py-2.5 text-[12px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            active
              ? 'border-[#1a1a18] bg-[#f0f0ee] text-[#1a1a18]'
              : 'border-[#e8e8e6] bg-white text-[#888580] hover:border-[#c9c6c0]'
          }`}
        >
          <span className="text-[18px] leading-none" aria-hidden>
            {tab.icon}
          </span>
          {tab.label}
        </button>
      );
    })}
  </div>
);

const PayButton = ({ summary, paymentMethod, netbankingBank, onPay, payContext }) => (
  <>
    <button
      type="button"
      onClick={() => onPay?.(payContext)}
      className="inline-flex w-full items-center justify-center gap-1 rounded-[10px] px-6 py-3 text-[14px] font-medium text-white transition-opacity hover:opacity-90"
      style={{ backgroundColor: PRO_ACCENT }}
    >
      {getPayButtonLabel(summary, paymentMethod, netbankingBank)}
      <RiArrowRightLine size={16} aria-hidden />
    </button>
    <p className="flex items-center justify-center gap-1 text-center text-[10.5px] text-[#888580]">
      <RiLockLine size={10} aria-hidden />
      {paymentMethod === 'upi'
        ? 'UPI powered by NPCI · Secured by Razorpay'
        : paymentMethod === 'netbanking'
          ? 'Secured by Razorpay · RBI compliant'
          : 'Secured by Razorpay · 256-bit SSL encryption'}
    </p>
  </>
);

export const CardPaymentForm = ({ selection, onPay }) => {
  const summary = calculateCheckoutSummary({
    ...selection,
    promoApplied: selection.planId === 'pro',
  });
  const [saveCard, setSaveCard] = useState(true);
  const [cardNumber, setCardNumber] = useState('4242  4242  4242  4242');

  if (!summary) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Name on card</label>
        <input type="text" defaultValue="Punith Raj" className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Card number</label>
        <input
          type="text"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
          className={`${inputClass} border-[#1a1a18]`}
        />
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Expiry</label>
          <input type="text" defaultValue="08 / 27" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>CVV</label>
          <input type="password" defaultValue="•••" className={inputClass} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Billing email</label>
        <input type="email" defaultValue="punithraj2202@gmail.com" className={inputClass} />
      </div>
      <label className="flex cursor-pointer gap-2 rounded-[8px] bg-[#f0f0ee] px-3 py-2.5">
        <input
          type="checkbox"
          checked={saveCard}
          onChange={(e) => setSaveCard(e.target.checked)}
          className="mt-0.5 size-[13px] accent-[#1a1a18]"
        />
        <span className="text-[12px] leading-[18px] text-[#555350]">
          Save card for future billing. Remove anytime from Settings.
        </span>
      </label>
      <PayButton
        summary={summary}
        paymentMethod="card"
        onPay={onPay}
        payContext={{ paymentMethod: 'card', cardNumber }}
      />
    </div>
  );
};

export const UpiPaymentForm = ({ selection, onPay }) => {
  const summary = calculateCheckoutSummary({ ...selection, promoApplied: false });
  const [upiApp, setUpiApp] = useState('phonepe');
  const [upiId, setUpiId] = useState('punith@okaxis');
  const [verified, setVerified] = useState(true);

  if (!summary) return null;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12px] font-semibold text-[#555350]">Pay with UPI app</p>
      <div className="flex flex-wrap justify-center gap-2">
        {UPI_APPS.map((app) => (
          <button
            key={app.id}
            type="button"
            onClick={() => setUpiApp(app.id)}
            className={`flex min-w-[55px] flex-col items-center gap-0.5 rounded-[8px] border px-2 py-2.5 ${
              upiApp === app.id
                ? 'border-[#1a1a18] bg-[#f0f0ee]'
                : 'border-[#e8e8e6] bg-white'
            }`}
          >
            {UPI_ICON_BY_ID[app.id] ? (
              <img
                src={UPI_ICON_BY_ID[app.id]}
                alt=""
                className="h-5 w-auto max-w-[52px] object-contain"
                aria-hidden
              />
            ) : (
              <span className="text-[20px]" aria-hidden>
                {app.emoji}
              </span>
            )}
            <span className="text-[11px] text-[#555350]">{app.label}</span>
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2.5">
        <div className="h-px flex-1 bg-[#e8e8e6]" aria-hidden />
        <span className="text-[11px] text-[#c9c6c0]">or enter UPI ID manually</span>
        <div className="h-px flex-1 bg-[#e8e8e6]" aria-hidden />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>UPI ID</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={upiId}
            onChange={(e) => {
              setUpiId(e.target.value);
              setVerified(false);
            }}
            className={`${inputClass} flex-1`}
          />
          <button
            type="button"
            onClick={() => setVerified(true)}
            className="shrink-0 rounded-[8px] bg-[#1a1a18] px-3.5 py-2 text-[12px] font-medium text-white"
          >
            Verify
          </button>
        </div>
      </div>
      {verified ? (
        <div className="flex items-start gap-2.5 rounded-[9px] border border-[#a5d6a7] bg-[#e8f5e9] px-3.5 py-3 text-[12.5px] text-[#2d7d32]">
          <RiCheckLine size={14} className="mt-0.5 shrink-0" aria-hidden />
          UPI ID verified — {upiId}
        </div>
      ) : null}
      <PayButton
        summary={summary}
        paymentMethod="upi"
        onPay={onPay}
        payContext={{ paymentMethod: 'upi', upiApp, upiId }}
      />
    </div>
  );
};

export const NetbankingPaymentForm = ({ selection, onPay }) => {
  const summary = calculateCheckoutSummary({ ...selection, promoApplied: false });
  const [bankId, setBankId] = useState('hdfc');
  const [search, setSearch] = useState('');

  if (!summary) return null;

  const selectedBank = POPULAR_BANKS.find((b) => b.id === bankId) ?? POPULAR_BANKS[0];
  const filtered = search.trim()
    ? POPULAR_BANKS.filter((b) =>
        b.name.toLowerCase().includes(search.trim().toLowerCase())
      )
    : POPULAR_BANKS;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12px] font-semibold text-[#555350]">Popular banks</p>
      <div className="grid grid-cols-2 gap-2">
        {filtered.map((bank) => (
          <button
            key={bank.id}
            type="button"
            onClick={() => setBankId(bank.id)}
            className={`flex h-9 items-center gap-2 rounded-[8px] border px-3 py-2 text-left text-[12px] ${
              bankId === bank.id
                ? 'border-[#1a1a18] bg-[#f0f0ee] text-[#1a1a18]'
                : 'border-[#e8e8e6] bg-white text-[#555350]'
            }`}
          >
            <span
              className="size-2 shrink-0 rounded-[4px]"
              style={{ backgroundColor: bank.color }}
              aria-hidden
            />
            {bank.name}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Search your bank</label>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Type bank name…"
          className={inputClass}
        />
      </div>
      <PayButton
        summary={summary}
        paymentMethod="netbanking"
        netbankingBank={selectedBank}
        onPay={onPay}
        payContext={{ paymentMethod: 'netbanking', bankId }}
      />
    </div>
  );
};
