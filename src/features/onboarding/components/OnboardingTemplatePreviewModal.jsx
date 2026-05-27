import { useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  RiCloseLine,
  RiStarLine,
  RiTimeLine,
  RiLayoutMasonryLine,
  RiArrowRightLine,
  RiAddLine,
  RiListCheck2,
} from 'react-icons/ri';
import { getTemplatePreviewBlocks } from '../utils/templatePreviewBlocks';

const ease = [0.25, 0.1, 0.25, 1];

const PreviewMetaTag = ({ icon: Icon, children }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e4e2dc] bg-white px-2.5 py-1 text-[11px] text-[#3d3c38]">
    <Icon size={12} className="text-[#6b6860] shrink-0" />
    {children}
  </span>
);

const PreviewBlock = ({ block }) => {
  if (block.type === 'welcome' || block.type === 'section') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease }}
        className="flex shrink-0 flex-col gap-2 rounded-[10px] border border-[#e8e7e2] bg-[#f7f6f4] p-4"
      >
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.5px] text-[#9c9a94]">
          {block.type === 'welcome' ? <RiAddLine size={12} /> : <RiListCheck2 size={12} />}
          {block.label}
        </div>
        <p className="text-[15px] font-semibold text-[#0f0e0c]">{block.title}</p>
        {block.description && (
          <p className="text-[13px] leading-[19px] text-[#6b6860]">{block.description}</p>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease }}
      className="flex shrink-0 flex-col gap-3 rounded-[10px] border border-[#e8e7e2] bg-white p-4"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1a1a1a] text-[10px] font-semibold text-white">
          {block.num}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#9c9a94]">
          {block.label}
        </span>
      </div>
      <p className="text-[15px] font-semibold text-[#0f0e0c]">{block.title}</p>
      {block.description && <p className="text-[13px] text-[#6b6860]">{block.description}</p>}
      {block.fields?.length > 0 && (
        <div className="flex flex-col gap-2 pt-1">
          {block.fields.map((field) => (
            <div
              key={`${block.num}-${field}`}
              className="border-b border-[#e4e2dc] pb-1.5 text-[13px] text-[#9c9a94]"
            >
              {field}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default function OnboardingTemplatePreviewModal({
  open,
  template,
  onClose,
  onUseTemplate,
}) {
  const { blocks, meta } = useMemo(
    () => getTemplatePreviewBlocks(template?.id),
    [template?.id]
  );

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!template) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-[300] cursor-default border-0 bg-black/30 backdrop-blur-[2px]"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-preview-title"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.22, ease }}
            className="fixed top-1/2 left-1/2 z-[301] flex w-[min(100%,640px)] max-h-[min(88vh,760px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[14px] border border-[#e4e2dc] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
          >
            <div className="relative shrink-0 border-b border-[#e8e7e2] p-6 pb-4">
              <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full hover:bg-[#f4f3ef]"
                aria-label="Close preview"
              >
                <RiCloseLine size={16} className="text-[#6b6860]" />
              </button>

              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.4px] text-[#9c9a94]">
                {template.category}
              </p>
              <h2
                id="onboarding-preview-title"
                className="mb-2 pr-8 text-[22px] font-semibold leading-[28px] tracking-[-0.3px] text-[#0f0e0c]"
              >
                {template.title}
              </h2>
              <p className="mb-4 text-[14px] leading-[21px] text-[#6b6860]">{template.description}</p>

              <div className="flex flex-wrap gap-2">
                <PreviewMetaTag icon={RiStarLine}>
                  {meta.questionCount} questions
                </PreviewMetaTag>
                <PreviewMetaTag icon={RiTimeLine}>{meta.duration}</PreviewMetaTag>
                <PreviewMetaTag icon={RiLayoutMasonryLine}>{meta.structure}</PreviewMetaTag>
                <span className="inline-flex items-center rounded-full bg-[#f0efe9] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.3px] text-[#3d3c38]">
                  {template.category}
                </span>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.5px] text-[#9c9a94]">
                {meta.questionCount} questions in this template
              </p>
              <div className="flex flex-col gap-3">
                {blocks.map((block) => (
                  <PreviewBlock
                    key={`${block.type}-${block.num ?? block.title}-${block.label}`}
                    block={block}
                  />
                ))}
              </div>
            </div>

            <div className="flex shrink-0 justify-end border-t border-[#e8e7e2] p-6 pt-4">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUseTemplate?.();
                }}
                className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[10px] bg-[#1a1a1a] px-5 text-[14px] font-medium text-white transition-colors hover:bg-[#2c2c2e]"
              >
                <RiArrowRightLine size={16} />
                Use template
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
