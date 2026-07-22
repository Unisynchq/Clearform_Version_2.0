import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getFormBuilderPath } from '@/features/forms/utils/formBuilderNavigation';

/** Supports old `/dashboard/form-builder` links that only pass `location.state`. */
const LegacyFormBuilderRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    navigate(getFormBuilderPath(location.state?.formId), {
      replace: true,
      state: location.state,
    });
  }, [navigate, location.state]);

  return null;
};

export default LegacyFormBuilderRedirect;
