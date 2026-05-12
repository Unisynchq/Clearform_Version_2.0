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
              <AnalyticsFunnelCard />
              <AnalyticsDailyResponsesCard />
            </div>
            <AnalyticsDropoffRiverCard />
          </div>
        );
      case 'responses':
        return <AnalyticsResponsesPanel rangeLabel={rangeLabel} />;
      case 'compare':
        return <AnalyticsComparePanel currentForm={selectedForm} />;
      case 'settings':
        return <AnalyticsSettingsPanel form={selectedForm} />;
      case 'ai':
        return <AnalyticsAiInsightsPanel formTitle={selectedForm?.title} />;
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
            className="flex items-center gap-1.5 h-8 px-[13px] rounded-[8px] border border-[#96948d] text-[12px] text-[#6a6860] hover:bg-[#f4f3ef] transition-colors cursor-pointer"
          >
            <RiDownloadLine size={12} />
            Export CSV
          </button>
          <button
            type="button"
            onClick={goEditForm}
            className="flex items-center gap-1.5 h-8 px-[14px] rounded-[8px] bg-[#17160e] text-[12px] font-medium text-white hover:bg-[#2c2c2e] cursor-pointer"
          >
            <RiPencilLine size={13} />
            Edit form
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
            className="flex items-center gap-1.5 h-8 px-[13px] rounded-[8px] border border-[#96948d] text-[12px] text-[#6a6860] hover:bg-[#f4f3ef] cursor-pointer"
          >
            <RiDownloadLine size={12} />
            Export
          </button>
          <button
            type="button"
            onClick={handleShareReport}
            className="flex items-center gap-1.5 h-8 px-[13px] rounded-[8px] border border-[#96948d] text-[12px] text-[#6a6860] hover:bg-[#f4f3ef] cursor-pointer"
          >
            Share report
          </button>
          <button
            type="button"
            onClick={goBuilder}
            disabled={!selectedForm}
            className="h-8 px-[14px] rounded-[8px] bg-[#17160e] text-[12px] font-medium text-white hover:bg-[#2c2c2e] disabled:opacity-45 cursor-pointer"
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
          className="flex items-center gap-1.5 h-8 px-[13px] rounded-[8px] border border-[#96948d] text-[12px] text-[#6a6860] hover:bg-[#f4f3ef] cursor-pointer"
        >
          <RiDownloadLine size={12} />
          Export
        </button>
        <button
          type="button"
          onClick={goBuilder}
          disabled={!selectedForm}
          className="h-8 px-[14px] rounded-[8px] bg-[#17160e] text-[12px] font-medium text-white hover:bg-[#2c2c2e] disabled:opacity-45 cursor-pointer"
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
        <header className="sticky top-0 z-20 shrink-0 bg-white border-b border-[#e9e7e0] min-h-[52px] flex items-center justify-between px-6 gap-4 py-2">
          <div className="flex items-center gap-2 min-w-0 flex-1 text-[12.5px]">
            <span className="text-[#646464] shrink-0">Analytics</span>
            <span className="text-[#656462] text-[10px] shrink-0">›</span>
            <span className="text-[#646464] shrink-0">Forms</span>
            <span className="text-[#656462] text-[10px] shrink-0">›</span>
            <div className="relative min-w-0" ref={formMenuRef}>
              <button
                type="button"
                onClick={() => setFormMenuOpen((o) => !o)}
                className="flex items-center gap-1.5 max-w-[280px] border border-[rgba(0,0,0,0.1)] rounded-[6px] px-3 py-1 hover:bg-[#f4f3ef] cursor-pointer text-left"
              >
                <span className="font-medium text-[#17160e] truncate">
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
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            {headerActions()}
          </div>
        </header>

        <div className="sticky top-[52px] z-10 shrink-0 bg-white border-b border-[#e9e7e0] min-h-10 flex items-center justify-between px-6 gap-3 py-1">
          <nav className="flex items-center gap-0 overflow-x-auto">
            {MAIN_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 px-3 min-h-10 text-[13px] border-b-2 transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-[#17160e] font-medium text-[#17160e]'
                    : 'border-transparent text-[#646464] hover:text-[#17160e]'
                }`}
              >
                {tab.label}
              </button>
            ))}
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
