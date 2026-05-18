import { useCallback, useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { RiArrowDownSLine, RiArrowUpSLine, RiLinkedinBoxFill, RiMailLine } from 'react-icons/ri';
import HelpSupportSkeleton from '../components/help/HelpSupportSkeleton';
import { HelpSupportEmptyFaq, HelpSupportErrorState } from '../components/help/HelpSupportStates';
import { fetchHelpSupportContent } from '../lib/helpSupportData';

/** Figma 2439:4994 / 2439:4847 — Help & Support */
export default function HelpSupportPage() {
  const [openId, setOpenId] = useState(null);
  const [status, setStatus] = useState('loading');
  const [data, setData] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const location = useLocation();
  const [searchParams] = useSearchParams();

  const loadContent = useCallback(
    (signal, { isRetry = false } = {}) => {
      if (isRetry) setIsRetrying(true);
      else setStatus('loading');

      return fetchHelpSupportContent(signal, searchParams)
        .then((result) => {
          setData(result);
          setStatus('ready');
          setOpenId(null);
        })
        .catch((err) => {
          if (err?.name === 'AbortError') return;
          setData(null);
          setStatus('error');
        })
        .finally(() => {
          setIsRetrying(false);
        });
    },
    [searchParams],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadContent(controller.signal);
    return () => controller.abort();
  }, [loadContent, retryKey]);

  useEffect(() => {
    if (status !== 'ready' || !data) return;
    if (location.hash !== '#get-in-touch') return;

    const id = window.requestAnimationFrame(() => {
      document.getElementById('get-in-touch')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => window.cancelAnimationFrame(id);
  }, [location.hash, status, data]);

  const handleRetry = () => setRetryKey((k) => k + 1);

  if (status === 'loading') {
    return <HelpSupportSkeleton />;
  }

  if (status === 'error') {
    return <HelpSupportErrorState onRetry={handleRetry} isRetrying={isRetrying} />;
  }

  const { faqItems, contact } = data;
  const hasFaq = faqItems.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="mx-auto w-full max-w-[920px] px-8 pb-12 pt-8"
    >
      <header className="mb-7">
        <h1 className="text-[22px] font-semibold tracking-[-0.44px] text-[#111110]">Help & Support</h1>
        <p className="mt-1 text-[13px] text-[#777]">
          Answers to common questions, or reach out to us directly.
        </p>
      </header>

      {hasFaq ? (
        <>
          <p className="mb-3 text-[12px] font-semibold text-[#999]">Frequently asked questions</p>
          <div className="overflow-hidden rounded-[10px] border border-[#e4e3df] bg-white">
            {faqItems.map((item, index) => {
              const expanded = openId === item.id;
              return (
                <div
                  key={item.id}
                  className={index < faqItems.length - 1 ? 'border-b border-[#f0efeb]' : ''}
                >
                  <button
                    type="button"
                    onClick={() => setOpenId(expanded ? null : item.id)}
                    className="flex w-full items-center justify-between gap-4 px-[18px] py-3.5 text-left transition-colors hover:bg-[#fafaf8]"
                    aria-expanded={expanded}
                  >
                    <span className="text-[13px] font-medium text-[#111]">{item.question}</span>
                    {expanded ? (
                      <RiArrowUpSLine size={14} className="shrink-0 text-[#999]" aria-hidden />
                    ) : (
                      <RiArrowDownSLine size={14} className="shrink-0 text-[#999]" aria-hidden />
                    )}
                  </button>
                  <AnimatePresence initial={false}>
                    {expanded ? (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="px-[18px] pb-4 text-[12.5px] leading-[19.5px] text-[#777]">
                          {item.answer}
                        </p>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <HelpSupportEmptyFaq />
      )}

      <p id="get-in-touch" className="mb-3 mt-7 scroll-mt-8 text-[12px] font-semibold text-[#999]">
        Get in touch
      </p>

      <div className="flex flex-col gap-3">
        <div className="rounded-[10px] border border-[#e4e3df] bg-white p-[19px]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[13px] font-semibold text-[#111110]">Email us</p>
              <p className="mt-2 text-[12px] leading-[18px] text-[#777]">
                Send us a message and we&apos;ll get back to you within one business day.
              </p>
            </div>
            <a
              href={`mailto:${contact.generalEmail}`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-[6px] border border-[#e4e3df] bg-[#f5f4f0] px-3 py-1.5 text-[12px] font-medium text-[#111] transition-colors hover:bg-[#eeede8]"
            >
              <RiMailLine size={14} className="text-[#777]" aria-hidden />
              {contact.generalEmail}
            </a>
          </div>
        </div>

        <div className="rounded-[10px] border border-[#e4e3df] bg-white p-[19px]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[13px] font-semibold text-[#111110]">Talk to the founder</p>
              <p className="mt-2 text-[12px] leading-[18px] text-[#777]">
                Questions about the product, partnerships, or feedback — reach out directly.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:items-end">
              <a
                href={contact.founderLinkedIn}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-[6px] border border-[#e4e3df] bg-[#f5f4f0] px-3 py-1.5 text-[12px] font-medium text-[#111] transition-colors hover:bg-[#eeede8]"
              >
                <RiLinkedinBoxFill size={14} className="text-[#0a66c2]" aria-hidden />
                LinkedIn
              </a>
              <a
                href={`mailto:${contact.founderEmail}`}
                className="inline-flex items-center gap-1.5 rounded-[6px] border border-[#e4e3df] bg-[#f5f4f0] px-3 py-1.5 text-[12px] font-medium text-[#111] transition-colors hover:bg-[#eeede8]"
              >
                <RiMailLine size={14} className="text-[#777]" aria-hidden />
                {contact.founderEmail}
              </a>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
