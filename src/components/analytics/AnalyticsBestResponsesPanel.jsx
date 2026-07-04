import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  RiArrowDownSLine,
  RiArrowUpSLine,
  RiCheckboxCircleFill,
  RiClipboardLine,
  RiLoaderLine,
} from 'react-icons/ri';
import { fetchTopResponses } from '@/api/services/analyticsService';

const MIN_RESPONSES_FOR_BEST = 5;

function ScoreBadge({ score }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[#eaf7ee] px-2.5 py-0.5 text-[11px] font-semibold text-[#1e7e34]">
      <RiCheckboxCircleFill size={11} className="mr-1 shrink-0" aria-hidden />
      {score} / 100
    </span>
  );
}

function ResponseRow({ response, index }) {
  const [expanded, setExpanded] = useState(index === 0);
  const [copied, setCopied] = useState(false);

  const answers = (Array.isArray(response.answers) ? response.answers : []).filter(
    (a) => typeof a?.value === 'string' && a.value.trim().length > 0,
  );

  const handleCopy = async (e) => {
    e.stopPropagation();
    const text = answers
      .map((a) => (a.label ? `${a.label}\n${a.value}` : a.value))
      .join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard access denied — no-op
    }
  };

  const submittedAt = response.submittedAt
    ? new Date(response.submittedAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <div className="overflow-hidden rounded-[10px] border border-[#e8e8e6] bg-white">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-[#fafaf8]"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="shrink-0 text-[12px] font-medium text-[#9e9b96]">#{index + 1}</span>
          <ScoreBadge score={response.qualityScore} />
          {submittedAt ? (
            <span className="truncate text-[11.5px] text-[#9e9b96]">{submittedAt}</span>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-[6px] border border-[#e0e0de] px-2.5 py-1 text-[11px] text-[#656462] transition-colors hover:bg-[#f4f3ef]"
          >
            <RiClipboardLine size={12} aria-hidden />
            {copied ? 'Copied' : 'Copy'}
          </button>
          {expanded ? (
            <RiArrowUpSLine size={18} className="text-[#656462]" aria-hidden />
          ) : (
            <RiArrowDownSLine size={18} className="text-[#656462]" aria-hidden />
          )}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 border-t border-[#f0f0ee] px-4 py-4">
              {answers.length > 0 ? (
                answers.map((answer, i) => (
                  <div key={i}>
                    {answer.label ? (
                      <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wide text-[#9e9b96]">
                        {answer.label}
                      </p>
                    ) : null}
                    <p className="text-[13px] leading-relaxed text-[#333330]">
                      {answer.value}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-[12px] text-[#9e9b96]">No answer text available.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyState({ responseCount }) {
  const notEnoughData = responseCount < MIN_RESPONSES_FOR_BEST;
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <RiCheckboxCircleFill size={32} className="text-[#d4d1c8]" aria-hidden />
      <p className="text-[14px] font-medium text-[#333330]">No top responses yet</p>
      <p className="max-w-xs text-[12px] leading-relaxed text-[#888580]">
        {notEnoughData
          ? `Collect at least ${MIN_RESPONSES_FOR_BEST} responses to start surfacing your best ones.`
          : 'Once responses score above 75, they will appear here for you to review and share.'}
      </p>
    </div>
  );
}

const AnalyticsBestResponsesPanel = ({ form, responseCount = 0 }) => {
  const formId = form?.id;
  const [responses, setResponses] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!formId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTopResponses(formId, { limit: 5, minScore: 75 });
      setResponses(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      setError(err?.message ?? 'Failed to load top responses.');
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[16px] font-semibold text-[#111110]">Best Responses</h2>
          <p className="mt-0.5 text-[12px] text-[#888580]">
            Top-scoring responses from your respondents — quality score 75+
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <RiLoaderLine size={22} className="animate-spin text-[#9e9b96]" aria-hidden />
        </div>
      )}

      {error && !loading && (
        <div className="rounded-[10px] border border-[#f5c0c0] bg-[#fff3f3] px-4 py-3">
          <p className="text-[13px] font-medium text-[#c0392b]">{error}</p>
          <button
            type="button"
            onClick={load}
            className="mt-2 text-[12px] text-[#c0392b] underline"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && responses !== null && (
        <>
          {responses.length === 0 ? (
            <EmptyState responseCount={responseCount} />
          ) : (
            <div className="flex flex-col gap-3">
              {responses.map((r, i) => (
                <ResponseRow key={r.id} response={r} index={i} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AnalyticsBestResponsesPanel;
