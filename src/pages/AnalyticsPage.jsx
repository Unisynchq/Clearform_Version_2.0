import { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchCompareAnalytics,
  fetchPerformanceAnalytics,
  generateAiInsights,
} from '@/api/services/analyticsService';
import { isApiConfigured } from '@/config/env';
import { motion, AnimatePresence } from 'motion/react';
import { useHydrationFrame } from '@/hooks/useHydrationFrame';
import { useAnalyticsPageState } from '@/hooks/useAnalyticsPageState';
import { fadeUp, fadeUpTransition } from '@/motion/presets';
import { RiDownloadLine, RiArrowDownSLine, RiPencilLine } from 'react-icons/ri';
import AnalyticsDateRangeControl from '@/components/analytics/AnalyticsDateRangeControl';
import { openFormOverlay, openShareModal } from '@/store/slices/uiSlice';
import AnalyticsExportModal from '@/components/analytics/AnalyticsExportModal';
import {
  AnalyticsStatsRow,
  AnalyticsFunnelCard,
  AnalyticsDailyResponsesCard,
  AnalyticsDropoffRiverCard,
} from '@/components/analytics/AnalyticsPerformanceDashboard';
import {
  AnalyticsPerformanceSkeleton,
  AnalyticsPanelSkeleton,
  AnalyticsPerformanceEmpty,
} from '@/components/analytics/AnalyticsPerformanceStates';
import AnalyticsResponsesPanel from '@/components/analytics/AnalyticsResponsesPanel';
import AnalyticsComparePanel from '@/components/analytics/AnalyticsComparePanel';
import AnalyticsSettingsPanel from '@/components/analytics/AnalyticsSettingsPanel';
import AnalyticsAiInsightsPanel from '@/components/analytics/AnalyticsAiInsightsPanel';
import Topbar from '@/components/layout/Topbar';

function useClickOutside(ref, open, onClose) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose, ref]);
}

const AnalyticsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const forms = useSelector((s) => s.forms.forms);
  const hydrationReady = useHydrationFrame();
  const {
    MAIN_TABS,
    selectedFormId,
    selectedForm,
    hasResponseData,
    activeTab,
    aiInsightsVisit,
    handlePickForm: pickFormFromUrl,
    handleTabChange,
  } = useAnalyticsPageState(forms);

  const [formMenuOpen, setFormMenuOpen] = useState(false);
  const [rangeLabel, setRangeLabel] = useState('All time');
  const [exportOpen, setExportOpen] = useState(false);
  const [perfApiStats, setPerfApiStats] = useState(null);
  const [compareApiData, setCompareApiData] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState(null);
  const [aiApiInsights, setAiApiInsights] = useState(null);
  const [aiInsightsError, setAiInsightsError] = useState(null);
  const [aiPollTick, setAiPollTick] = useState(0);
  const aiPollAttemptsRef = useRef(0);

  const rangeLabelToParam = useCallback((label) => {
    if (label === 'Last 7 days') return '7d';
    if (label === 'Last 30 days') return '30d';
    if (label === 'Last 90 days') return '90d';
    return 'all';
  }, []);

  useEffect(() => {
    if (!selectedFormId) return;
    setPerfApiStats(null);
    fetchPerformanceAnalytics(selectedFormId, { range: rangeLabelToParam(rangeLabel) })
      .then((data) => { if (data && !data.source) setPerfApiStats(data); })
      .catch(() => {});
  }, [selectedFormId, rangeLabel, rangeLabelToParam]);

  useEffect(() => {
    if (!selectedFormId || activeTab !== 'compare') return;
    let cancelled = false;
    setCompareApiData(null);
    setCompareError(null);
    setCompareLoading(true);
    fetchCompareAnalytics(selectedFormId, { range: rangeLabelToParam(rangeLabel) })
      .then((data) => {
        if (cancelled) return;
        if (data && !data.source) setCompareApiData(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setCompareError(err?.message ?? 'Could not load compare analytics.');
        }
      })
      .finally(() => {
        if (!cancelled) setCompareLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedFormId, activeTab, rangeLabel, rangeLabelToParam]);

  const fetchAiInsightsOnce = useCallback(async () => {
    if (!selectedFormId) return null;
    const range = rangeLabelToParam(rangeLabel);
    const data = await generateAiInsights(selectedFormId, { range });
    if (data && !data.source) return data;
    return null;
  }, [selectedFormId, rangeLabel, rangeLabelToParam]);

  useEffect(() => {
    if (!selectedFormId || activeTab !== 'ai') return undefined;
    let cancelled = false;
    aiPollAttemptsRef.current = 0;
    setAiApiInsights(null);
    setAiInsightsError(null);

    const load = async () => {
      try {
        const data = await fetchAiInsightsOnce();
        if (cancelled) return;
        if (!data) {
          setAiInsightsError('No insights data returned.');
          return;
        }
        setAiApiInsights(data);
        if (data.status === 'error') {
          setAiInsightsError(data.message ?? 'Insights could not be generated.');
        }
      } catch (err) {
        if (!cancelled) {
          setAiInsightsError(err?.message ?? 'Could not load AI insights.');
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [selectedFormId, activeTab, rangeLabel, aiInsightsVisit, aiPollTick, rangeLabelToParam, fetchAiInsightsOnce]);

  useEffect(() => {
    if (!selectedFormId || activeTab !== 'ai') return undefined;
    if (aiApiInsights?.status !== 'processing') return undefined;

    const maxAttempts = 25;
    const intervalMs = 2500;
    const id = window.setInterval(async () => {
      aiPollAttemptsRef.current += 1;
      if (aiPollAttemptsRef.current > maxAttempts) {
        setAiInsightsError('Insights are taking longer than expected. Try again in a moment.');
        window.clearInterval(id);
        return;
      }
      try {
        const data = await fetchAiInsightsOnce();
        if (!data) return;
        setAiApiInsights(data);
        if (data.status === 'ready' || data.status === 'insufficient_data' || data.status === 'error') {
          window.clearInterval(id);
          if (data.status === 'error') {
            setAiInsightsError(data.message ?? 'Insights could not be generated.');
          }
        }
      } catch (err) {
        setAiInsightsError(err?.message ?? 'Could not load AI insights.');
        window.clearInterval(id);
      }
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [
    selectedFormId,
    activeTab,
    aiApiInsights?.status,
    rangeLabel,
    fetchAiInsightsOnce,
    aiPollTick,
  ]);

  const retryAiInsights = useCallback(() => {
    setAiPollTick((n) => n + 1);
    setAiInsightsError(null);
    setAiApiInsights(null);
  }, []);
  const [exportFormatDefault, setExportFormatDefault] = useState('PDF');
  const [viewLoading, setViewLoading] = useState(true);
  const viewLoadingTimerRef = useRef(null);

  const formMenuRef = useRef(null);
  const bootLoading = !hydrationReady;
  const effectiveLoading = bootLoading || viewLoading;

  useClickOutside(formMenuRef, formMenuOpen, () => setFormMenuOpen(false));

  useEffect(() => {
    if (bootLoading) {
      setViewLoading(true);
      return undefined;
    }
    setViewLoading(true);
    if (viewLoadingTimerRef.current) clearTimeout(viewLoadingTimerRef.current);
    viewLoadingTimerRef.current = setTimeout(() => {
      setViewLoading(false);
      viewLoadingTimerRef.current = null;
    }, 280);
    return () => {
      if (viewLoadingTimerRef.current) {
        clearTimeout(viewLoadingTimerRef.current);
        viewLoadingTimerRef.current = null;
      }
    };
  }, [bootLoading, activeTab, selectedFormId]);

  const handlePickForm = (id) => {
    setFormMenuOpen(false);
    pickFormFromUrl(id);
  };

  const goBuilder = () => {
    if (!selectedForm) return;
    dispatch(openFormOverlay(selectedForm.id));
    navigate('/dashboard');
  };

  const goEditForm = () => {
    goBuilder();
  };

  const openExport = (fmt = 'PDF') => {
    setExportFormatDefault(fmt);
    setExportOpen(true);
  };

  const handleShareSurvey = () => {
    if (!selectedForm) return;
    dispatch(
      openShareModal({ formId: selectedForm.id, formTitle: selectedForm.title })
    );
    navigate('/dashboard');
  };

  const defaultExportName = `${selectedForm?.title ?? 'Form'} — ${
    activeTab === 'performance'
      ? 'Performance'
      : activeTab === 'responses'
        ? 'Responses'
        : activeTab === 'compare'
          ? 'Compare'
          : activeTab === 'ai'
            ? 'AI Insights'
            : 'Settings'
  }`;

  const showDateFilter = activeTab !== 'settings';

  const effectiveHasResponseData =
    (perfApiStats?.responses ?? 0) > 0 || (selectedForm?.responses ?? 0) > 0;

  const mainContentKey = effectiveLoading
    ? `loading-${activeTab}-${selectedFormId ?? 'none'}`
    : `ready-${activeTab}-${selectedFormId ?? 'none'}-${
        activeTab === 'ai' ? aiInsightsVisit : '0'
      }-${activeTab === 'performance' && !effectiveHasResponseData ? 'empty' : 'full'}`;

  const renderLoadingSkeleton = () => {
    if (activeTab === 'performance') return <AnalyticsPerformanceSkeleton />;
    if (activeTab === 'responses') return <AnalyticsPanelSkeleton blocks={4} />;
    if (activeTab === 'compare') return <AnalyticsPanelSkeleton blocks={3} />;
    if (activeTab === 'ai') return <AnalyticsPanelSkeleton blocks={4} />;
    return <AnalyticsPanelSkeleton blocks={2} />;
  };

  const renderMainContent = () => {
    if (effectiveLoading) return renderLoadingSkeleton();

    if (!selectedForm) {
      return (
        <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 text-center text-[14px] text-[#6b6b68]">
          <p className="font-medium text-[#1a1a18]">No form selected</p>
          <p>Create a form or pick one from the header menu.</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'performance':
        if (!effectiveHasResponseData) {
          return (
            <AnalyticsPerformanceEmpty
              onPreview={goBuilder}
              onShare={handleShareSurvey}
            />
          );
        }
        return (
          <div className="flex flex-col gap-5 max-w-[1400px] mx-auto">
            <AnalyticsStatsRow form={selectedForm} apiStats={perfApiStats} />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
              <AnalyticsFunnelCard form={selectedForm} apiStats={perfApiStats} />
              <AnalyticsDailyResponsesCard apiStats={perfApiStats} />
            </div>
            {(perfApiStats?.responses ?? selectedForm?.responses ?? 0) >= 3 ? (
              <AnalyticsDropoffRiverCard form={selectedForm} />
            ) : (
              <p className="text-[13px] text-[#888580] px-1">
                Per-question drop-off appears after you have at least 3 responses.
              </p>
            )}
          </div>
        );
      case 'responses':
        return (
          <AnalyticsResponsesPanel
            form={selectedForm}
            rangeLabel={rangeLabel}
            onRangeChange={setRangeLabel}
          />
        );
      case 'compare':
        if (compareLoading) {
          return <AnalyticsPanelSkeleton blocks={3} />;
        }
        if (compareError) {
          return (
            <div className="mx-auto flex max-w-[480px] flex-col items-center gap-3 rounded-xl border border-[#e8e8e5] bg-white px-6 py-10 text-center shadow-sm">
              <p className="text-[14px] font-medium text-[#17160e]">Compare data unavailable</p>
              <p className="text-[13px] text-[#6b6b68]">{compareError}</p>
              <button
                type="button"
                onClick={() => {
                  setCompareError(null);
                  setCompareLoading(true);
                  fetchCompareAnalytics(selectedFormId, { range: rangeLabelToParam(rangeLabel) })
                    .then((data) => {
                      if (data && !data.source) setCompareApiData(data);
                    })
                    .catch((err) => setCompareError(err?.message ?? 'Could not load compare analytics.'))
                    .finally(() => setCompareLoading(false));
                }}
                className="mt-1 h-9 rounded-lg bg-[#17160e] px-4 text-[12px] font-medium text-white hover:bg-[#2c2c2e] cursor-pointer"
              >
                Retry
              </button>
            </div>
          );
        }
        return (
          <AnalyticsComparePanel
            currentForm={selectedForm}
            rangeLabel={rangeLabel}
            compareApiData={compareApiData}
            responseCount={perfApiStats?.responses ?? selectedForm?.responses ?? 0}
          />
        );
      case 'settings':
        return <AnalyticsSettingsPanel form={selectedForm} />;
      case 'ai':
        return (
          <AnalyticsAiInsightsPanel
            key={`ai-insights-${aiInsightsVisit}-${aiPollTick}`}
            loadKey={aiInsightsVisit}
            form={selectedForm}
            rangeLabel={rangeLabel}
            apiInsights={aiApiInsights}
            insightsError={aiInsightsError}
            insightsNoDataInRange={aiApiInsights?.status === 'insufficient_data'}
            onClearDateFilter={() => setRangeLabel('All time')}
            onShareForm={handleShareSurvey}
            onRetryInsights={retryAiInsights}
          />
        );
      default:
        return null;
    }
  };

  const headerActions = () => {
    if (activeTab === 'responses' || activeTab === 'compare') {
      return (
        <>
          <button
            type="button"
            onClick={() => openExport('CSV')}
            className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg border border-[#96948d] text-[12px] text-[#6a6860] hover:bg-[#f4f3ef] transition-colors cursor-pointer whitespace-nowrap"
          >
            <RiDownloadLine size={12} aria-hidden />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={goEditForm}
            className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg bg-[#17160e] text-[12px] font-medium text-white hover:bg-[#2c2c2e] cursor-pointer whitespace-nowrap"
          >
            <RiPencilLine size={13} aria-hidden />
            <span>Edit form</span>
          </button>
        </>
      );
    }
    if (activeTab === 'settings') {
      return (
        <>
          <button
            type="button"
            onClick={() => openExport('PDF')}
            className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg border border-[#96948d] text-[12px] text-[#6a6860] hover:bg-[#f4f3ef] cursor-pointer whitespace-nowrap"
          >
            <RiDownloadLine size={12} aria-hidden />
            <span>Export</span>
          </button>
          <button
            type="button"
            onClick={goBuilder}
            disabled={!selectedForm}
            className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-[#17160e] text-[12px] font-medium text-white hover:bg-[#2c2c2e] disabled:opacity-45 cursor-pointer whitespace-nowrap"
          >
            Go to Builder →
          </button>
        </>
      );
    }
    /* performance + ai */
    return (
      <>
        <button
          type="button"
          onClick={() => openExport('PDF')}
          className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg border border-[#96948d] text-[12px] text-[#6a6860] hover:bg-[#f4f3ef] cursor-pointer whitespace-nowrap"
        >
          <RiDownloadLine size={12} aria-hidden />
          <span>Export</span>
        </button>
        <button
          type="button"
          onClick={goBuilder}
          disabled={!selectedForm}
          className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-[#17160e] text-[12px] font-medium text-white hover:bg-[#2c2c2e] disabled:opacity-45 cursor-pointer whitespace-nowrap"
        >
          Go to Builder →
        </button>
      </>
    );
  };

  return (
    <>
      <AnalyticsExportModal
        key={`${exportOpen}-${exportFormatDefault}`}
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        defaultName={defaultExportName}
        rangeLabel={rangeLabel}
        defaultFormat={exportFormatDefault}
      />
      <div className="flex flex-col min-h-full bg-[#f4f3ef]">
        <Topbar title="Analytics" useFormsLoading={false} />
        <header className="sticky top-[52px] z-20 shrink-0 bg-white border-b border-[#e9e7e0] min-h-[56px] flex items-center justify-between gap-6 px-6 py-2">
          <div className="flex items-center gap-2 min-w-0 flex-1 text-[12.5px]">
            <span className="text-[#646464] shrink-0">Analytics</span>
            <span className="text-[#656462] text-[10px] shrink-0">›</span>
            <span className="text-[#646464] shrink-0 hidden sm:inline">Forms</span>
            <span className="text-[#656462] text-[10px] shrink-0 hidden sm:inline">›</span>
            <div className="relative min-w-0 max-w-[240px]" ref={formMenuRef}>
              <button
                type="button"
                onClick={() => setFormMenuOpen((o) => !o)}
                className="flex w-full items-center gap-1.5 rounded-lg border border-[rgba(0,0,0,0.1)] px-3 py-1.5 text-left hover:bg-[#f4f3ef] cursor-pointer"
              >
                <span className="min-w-0 flex-1 truncate font-medium text-[#17160e]">
                  {selectedForm?.title ?? 'Select a form'}
                </span>
                <RiArrowDownSLine
                  className={`text-[#656462] shrink-0 transition-transform ${formMenuOpen ? 'rotate-180' : ''}`}
                  size={14}
                />
              </button>
              {formMenuOpen && (
                <div className="absolute left-0 top-[calc(100%+6px)] z-30 min-w-[260px] max-h-[280px] overflow-y-auto bg-white border border-[#e5e3dc] rounded-[10px] shadow-[0_8px_24px_rgba(0,0,0,0.08)] py-1">
                  {forms.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => handlePickForm(f.id)}
                      className={`w-full text-left px-3 py-2 text-[13px] hover:bg-[#f4f3ef] cursor-pointer truncate ${
                        f.id === selectedFormId ? 'bg-[#f4f3ef] font-medium text-[#1a1a1c]' : 'text-[#393939]'
                      }`}
                    >
                      {f.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 shrink-0">
            {!isApiConfigured() ? (
              <span className="hidden sm:inline-flex items-center rounded-full border border-[#e5e3dc] bg-[#fafaf8] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.04em] text-[#888580]">
                Sample data
              </span>
            ) : null}
            {headerActions()}
          </div>
        </header>

        <div className="sticky top-[108px] z-10 shrink-0 bg-white border-b border-[#e9e7e0] min-h-10 flex items-center justify-between px-6 gap-3 py-1">
          <nav className="flex items-center gap-1 overflow-x-auto py-1">
            {MAIN_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`relative shrink-0 px-3 h-8 text-[13px] rounded-[8px] cursor-pointer transition-colors duration-200 ease-out ${
                    isActive
                      ? 'font-medium text-[#17160e]'
                      : 'text-[#646464] hover:text-[#17160e] hover:bg-black/[0.035]'
                  }`}
                >
                  {isActive ? (
                    <motion.span
                      layoutId="analytics-active-tab"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      className="absolute inset-0 rounded-[8px] bg-black/[0.06]"
                      aria-hidden
                    />
                  ) : null}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </nav>
          {showDateFilter ? (
            <AnalyticsDateRangeControl
              value={rangeLabel}
              onChange={setRangeLabel}
              align="right"
            />
          ) : (
            <span className="w-[100px] shrink-0" aria-hidden />
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 pb-12">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={mainContentKey}
              initial={fadeUp.initial}
              animate={fadeUp.animate}
              exit={fadeUp.exit}
              transition={fadeUpTransition(effectiveLoading ? 0.2 : 0.28)}
              className="w-full"
            >
              {renderMainContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default AnalyticsPage;
