import { useEffect, useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { resolvePageTitle } from '@/constants/pageTitles';

/**
 * Sets `document.title` from the current route and optional form title from Redux.
 */
export function usePageTitle() {
  const { pathname } = useLocation();
  const { formId } = useParams();
  const forms = useSelector((s) => s.forms.forms);

  const dynamicTitle = useMemo(() => {
    if (!formId) return null;
    const form = forms.find((f) => String(f.id) === String(formId));
    return form?.title ?? null;
  }, [formId, forms]);

  useEffect(() => {
    document.title = resolvePageTitle(pathname, dynamicTitle);
  }, [pathname, dynamicTitle]);
}
