import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { capturePendingPaymentFromUrl } from '@/features/billing/utils/pendingPaymentStorage';
import { PILOT_BILLING_PATH } from '@/features/billing/utils/pilotBillingRoutes';

const PilotCheckoutSuccessPage = () => {
  const navigate = useNavigate();
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);

  useEffect(() => {
    capturePendingPaymentFromUrl();
    if (isAuthenticated) {
      navigate(PILOT_BILLING_PATH, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-[#f4f3ef] flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white border border-[#e4e4e7] p-8 shadow-sm text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#ecfdf5] text-[#059669] text-xl">
          ✓
        </div>
        <h1 className="text-[22px] font-semibold text-[#18181b] mb-2">
          Payment received
        </h1>
        <p className="text-[14px] text-[#71717a] mb-8">
          {isAuthenticated
            ? 'Taking you to billing to activate your pilot plan…'
            : 'Create your Clearform account with the same email you used at checkout.'}
        </p>
        {!isAuthenticated ? (
          <Link
            to="/?plan=pilot"
            className="inline-flex w-full items-center justify-center rounded-lg bg-[#18181b] px-4 py-3 text-[14px] font-medium text-white hover:bg-[#27272a]"
          >
            Continue to sign up
          </Link>
        ) : null}
      </div>
    </div>
  );
};

export default PilotCheckoutSuccessPage;
