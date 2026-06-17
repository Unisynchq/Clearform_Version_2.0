import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { PILOT_BILLING_PATH } from '@/features/billing/utils/pilotBillingRoutes';

/**
 * Legacy `/buy/pilot` entry — auth first, then Profile → Billing.
 */
const PilotCheckoutRedirect = () => {
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/?plan=pilot" replace />;
  }

  return <Navigate to={PILOT_BILLING_PATH} replace />;
};

export default PilotCheckoutRedirect;
