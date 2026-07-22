import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RiArrowDownSLine } from 'react-icons/ri';
import Topbar from '@/components/layout/Topbar';

const pageEase = [0.25, 0.1, 0.25, 1];
const SUPPORT_EMAIL = 'hello@clearform.in';

const FAQS = [
  'How do I share a form with respondents?',
  'Where can I see my form responses?',
  'Can I add logic to show or hide fields?',
  'How do I invite teammates to a workspace?',
  'Can I export responses to a spreadsheet?',
  'How do I set a form to close after a deadline?',
];

const FaqRow = ({ question, open, onToggle }) => (
  <div className="border-b border-[#f0efeb] last:border-b-0">
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between gap-4 px-5 py-[15px] text-left cursor-pointer hover:bg-[#fafaf8] transition-colors"
    >
      <span className="text-[13.5px] font-medium text-[#111] leading-snug pr-2">
        {question}
      </span>
      <motion.span
        animate={{ rotate: open ? 180 : 0 }}
        transition={{ duration: 0.2, ease: pageEase }}
        className="shrink-0 text-[#6b6966]"
      >
        <RiArrowDownSLine size={18} />
      </motion.span>
    </button>
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: pageEase }}
          className="overflow-hidden"
        >
          <p className="px-5 pb-5 pt-0 text-[12.5px] text-[#6b6966] leading-[19px]">
            See the documentation or contact support for step-by-step guidance on this topic.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const HelpSupportPage = () => {
  const [openId, setOpenId] = useState(null);

  return (
    <>
      <div className="flex flex-col h-full min-h-0 overflow-hidden bg-[#f5f4f0]">
        <Topbar title="Help & Support" useFormsLoading={false} />
        <div className="flex-1 overflow-y-auto px-8 pt-8 pb-12">
          <div className="max-w-[910px] mx-auto flex flex-col gap-6">
            <header className="flex flex-col gap-2">
              <h2 className="text-[22px] font-semibold text-[#111110] tracking-[-0.44px]">
                Help & Support
              </h2>
              <p className="text-[13px] text-[#777] leading-[20px] max-w-[520px]">
                Answers to common questions, or reach out to us directly.
              </p>
            </header>

            <section className="flex flex-col gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.65px] text-[#999]">
                Frequently asked questions
              </p>
              <div className="bg-white border border-[#e4e3df] rounded-[12px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                {FAQS.map((q, i) => (
                  <FaqRow
                    key={q}
                    question={q}
                    open={openId === i}
                    onToggle={() => setOpenId((id) => (id === i ? null : i))}
                  />
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-3 pt-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.65px] text-[#999]">
                Get in touch
              </p>
              <div className="bg-white border border-[#e4e3df] rounded-[12px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-[14px] font-semibold text-[#111110]">Email us</h3>
                    <p className="mt-1.5 text-[12.5px] text-[#777] leading-[19px] max-w-[400px]">
                      Send us a message and we&apos;ll get back to you within one business day.
                    </p>
                  </div>
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="shrink-0 rounded-[8px] border border-[#e4e3df] bg-[#f5f4f0] px-4 py-2 text-[12.5px] font-medium text-[#111] hover:bg-[#eceae4] transition-colors"
                  >
                    {SUPPORT_EMAIL}
                  </a>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default HelpSupportPage;
