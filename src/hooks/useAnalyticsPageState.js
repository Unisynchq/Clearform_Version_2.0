import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const MAIN_TABS = [  { id: 'performance', label: 'Performance' },
  { id: 'responses', label: 'Responses' },
  { id: 'compare', label: 'Compare' },
  { id: 'ai', label: 'AI Insights' },
  { id: 'settings', label: 'Settings' },
];

/**
 * URL-first analytics form + tab state with local tab mirror for instant UI.
 */
export function useAnalyticsPageState(forms) {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramFormId = searchParams.get('form');
  const paramTab = searchParams.get('tab');
  const paramView = searchParams.get('view');

  const selectedFormId = useMemo(() => {
    if (!forms.length) return null;
    if (paramFormId) {
      const match = forms.find((f) => String(f.id) === paramFormId);
      if (match) return match.id;
    }
    return forms[0].id;
  }, [forms, paramFormId]);

  const [activeTab, setActiveTab] = useState('performance');
  const [aiInsightsVisit, setAiInsightsVisit] = useState(0);

  const responsesView = paramView === 'best' ? 'best' : 'all';

  // Legacy: ?tab=best → ?tab=responses&view=best
  useEffect(() => {
    if (paramTab !== 'best') return;
    const next = new URLSearchParams(searchParams);
    next.set('tab', 'responses');
    next.set('view', 'best');
    if (selectedFormId != null) next.set('form', String(selectedFormId));
    setSearchParams(next, { replace: true });
  }, [paramTab, searchParams, selectedFormId, setSearchParams]);

  useEffect(() => {
    if (paramTab === 'best') return;
    if (paramTab && MAIN_TABS.some((tab) => tab.id === paramTab)) {
      setActiveTab(paramTab);
      if (paramTab === 'ai') setAiInsightsVisit((n) => n + 1);
    }
  }, [paramTab]);

  const selectedForm = forms.find((f) => f.id === selectedFormId) ?? forms[0];
  const hasResponseData = selectedForm && selectedForm.responses > 0;

  const handlePickForm = (id) => {
    const next = new URLSearchParams(searchParams);
    next.set('form', String(id));
    setSearchParams(next, { replace: true });
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'ai') setAiInsightsVisit((n) => n + 1);
    const next = new URLSearchParams(searchParams);
    if (tabId === 'performance') {
      next.delete('tab');
    } else {
      next.set('tab', tabId);
    }
    if (tabId !== 'responses') {
      next.delete('view');
    }
    if (selectedFormId != null) next.set('form', String(selectedFormId));
    setSearchParams(next, { replace: true });
  };

  const handleResponsesViewChange = (viewId) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', 'responses');
    if (viewId === 'best') {
      next.set('view', 'best');
    } else {
      next.delete('view');
    }
    if (selectedFormId != null) next.set('form', String(selectedFormId));
    setSearchParams(next, { replace: true });
  };

  return {
    MAIN_TABS,
    selectedFormId,
    selectedForm,
    hasResponseData,
    activeTab,
    responsesView,
    aiInsightsVisit,
    handlePickForm,
    handleTabChange,
    handleResponsesViewChange,
    setActiveTab,
    searchParams,
    setSearchParams,
  };
}
