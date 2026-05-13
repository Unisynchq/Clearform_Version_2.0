import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  RiDownloadLine,
  RiArrowDownSLine,
  RiTimeLine,
  RiPencilLine,
} from 'react-icons/ri';
import { openFormOverlay, openShareModal } from '../redux/slices/uiSlice';
import { useToast } from '../hooks/useToast';
import AnalyticsExportModal from '../components/analytics/AnalyticsExportModal';
import {
  AnalyticsStatsRow,
  AnalyticsFunnelCard,
  AnalyticsDailyResponsesCard,
  AnalyticsDropoffRiverCard,
} from '../components/analytics/AnalyticsPerformanceDashboard';
import {
  AnalyticsPerformanceSkeleton,
  AnalyticsPerformanceEmpty,
} from '../components/analytics/AnalyticsPerformanceStates';
import AnalyticsResponsesPanel from '../components/analytics/AnalyticsResponsesPanel';
import AnalyticsComparePanel from '../components/analytics/AnalyticsComparePanel';
import AnalyticsSettingsPanel from '../components/analytics/AnalyticsSettingsPanel';
import AnalyticsAiInsightsPanel from '../components/analytics/AnalyticsAiInsightsPanel';

const pageEase = [0.25, 0.1, 0.25, 1];
const BOOT_MS = 900;

const RANGE_OPTIONS = [
  'All time',
  'Last 7 days',
  'Last 30 days',
  'Last 90 days',
  'This quarter',
  'Custom range…',
];

const MAIN_TABS = [
  { id: 'performance', label: 'Performance' },
  { id: 'responses', label: 'Responses' },
  { id: 'compare', label: 'Compare' },
  { id: 'ai', label: 'AI Insights' },
  { id: 'settings', label: 'Settings' },
];

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
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const forms = useSelector((s) => s.forms.forms);

  const paramFormId = searchParams.get('form');

  const selectedFormId = useMemo(() => {
    if (!forms.length) return null;
    if (paramFormId) {
      const match = forms.find((f) => String(f.id) === paramFormId);
      if (match) return match.id;
    }
    return forms[0].id;
  }, [forms, paramFormId]);

  const [formMenuOpen, setFormMenuOpen] = useState(false);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [rangeLabel, setRangeLabel] = useState('All time');
  const [activeTab, setActiveTab] = useState('performance');
  const [bootLoading, setBootLoading] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormatDefault, setExportFormatDefault] = useState('PDF');

  const formMenuRef = useRef(null);
  const rangeRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setBootLoading(false), BOOT_MS);
    return () => clearTimeout(t);
  }, []);

  useClickOutside(formMenuRef, formMenuOpen, () => setFormMenuOpen(false));
  useClickOutside(rangeRef, rangeOpen, () => setRangeOpen(false));

  const selectedForm = forms.find((f) => f.id === selectedFormId) ?? forms[0];
  const hasResponseData = selectedForm && selectedForm.responses > 0;

  const handlePickForm = (id) => {
    setFormMenuOpen(false);
    const next = new URLSearchParams(searchParams);
    next.set('form', String(id));
    setSearchParams(next, { replace: true });
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

  const handleShareReport = () => {
    showToast({
      type: 'info',
      message: 'Share report link copied to clipboard (demo).',
      duration: 2800,
    });
    navigator.clipboard?.writeText(
      `${window.location.origin}/dashboard/analytics?form=${selectedForm?.id}`
    );
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

  const renderMain = () => {
    if (bootLoading && activeTab === 'performance') {
      return <AnalyticsPerformanceSkeleton />;
    }

    switch (activeTab) {
      case 'performance':
        if (!hasResponseData) {
          return (
            <AnalyticsPerformanceEmpty
              onPreview={goBuilder}
              onShare={handleShareSurvey}
            />
          );
        }
        return (
          <div className="flex flex-col gap-5 max-w-[1400px] mx-auto">
            <AnalyticsStatsRow />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
              <AnalyticsFunnelCard form={selectedForm} />
              <AnalyticsDailyResponsesCard />
            </div>
            <AnalyticsDropoffRiverCard form={selectedForm} />
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
        return <AnalyticsComparePanel currentForm={selectedForm} rangeLabel={rangeLabel} />;
      case 'settings':
        return <AnalyticsSettingsPanel form={selectedForm} />;
      case 'ai':
        return (
          <AnalyticsAiInsightsPanel
            form={selectedForm}
            rangeLabel={rangeLabel}
            insightsNoDataInRange={false}
            onClearDateFilter={() => setRangeLabel('All time')}
            onShareForm={handleShareSurvey}
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
            onClick={handleShareReport}
            className="inline-flex items-center justify-center h-9 px-4 rounded-lg border border-[#96948d] text-[12px] text-[#6a6860] hover:bg-[#f4f3ef] cursor-pointer whitespace-nowrap"
          >
            Share report
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
        <header className="sticky top-0 z-20 shrink-0 bg-white border-b border-[#e9e7e0] min-h-[56px] flex items-center justify-between gap-6 px-6 py-2">
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
            {headerActions()}
          </div>
        </header>

        <div className="sticky top-[56px] z-10 shrink-0 bg-white border-b border-[#e9e7e0] min-h-10 flex items-center justify-between px-6 gap-3 py-1">
          <nav className="flex items-center gap-1 overflow-x-auto py-1">
            {MAIN_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
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
            <div className="relative shrink-0 py-1" ref={rangeRef}>
              <button
                type="button"
                onClick={() => setRangeOpen((o) => !o)}
                className="flex items-center gap-2 h-8 px-[13px] rounded-[8px] border border-[#e8e6e0] text-[12px] text-[#646464] hover:bg-[#f4f3ef] cursor-pointer"
              >
                <RiTimeLine size={17} className="text-[#6b6966]" />
                <span>{rangeLabel}</span>
                <RiArrowDownSLine size={16} className="text-[#6b6966]" />
              </button>
              {rangeOpen && (
                <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-[180px] bg-white border border-[#e5e3dc] rounded-[10px] shadow-[0_8px_24px_rgba(0,0,0,0.08)] py-1">
                  {RANGE_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setRangeLabel(opt);
                        setRangeOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-[12px] hover:bg-[#f4f3ef] cursor-pointer ${
                        opt === rangeLabel ? 'font-medium bg-[#f4f3ef]' : 'text-[#393939]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <span className="w-[100px] shrink-0" aria-hidden />
          )}
        </div>

        <motion.div
          key={activeTab}
          className="flex-1 overflow-y-auto px-6 py-5 pb-12"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: pageEase }}
        >
          {renderMain()}
        </motion.div>
      </div>
    </>
  );
};

export default AnalyticsPage;
