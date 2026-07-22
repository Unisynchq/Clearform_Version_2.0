import { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getTemplateCardPreview } from '@/features/templates/utils/templateCardPreview';

const TemplateCardPreview = ({ templateId, snapshot }) => {
  const preview = useMemo(
    () => getTemplateCardPreview(templateId, snapshot),
    [templateId, snapshot]
  );

  return (
    <div className="bg-white border border-[rgba(0,0,0,0.07)] rounded-[11px] overflow-hidden h-[151px] shrink-0">
      <div className="flex flex-col gap-[5px] px-[31px] pt-[20px] pb-[18px]">
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.78px] text-black leading-none"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {preview.sectionLabel}
        </p>
        <p
          className="text-[15px] font-semibold text-[#111] tracking-[-0.36px] leading-[21px] pt-0.5 line-clamp-2"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {preview.title}
        </p>
        <p
          className="text-[10px] font-light text-[#888] leading-[13px] pt-0.5 line-clamp-3"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {preview.description}
        </p>
        <div className="h-px bg-[rgba(0,0,0,0.1)] mt-2 w-full" />
      </div>
    </div>
  );
};

const TemplateCard = ({
  template,
  isLoading,
  anyLoading,
  onUseTemplate,
  onPreview,
  selected = false,
  onSelect,
}) => {
  const tagSurface = 'bg-[#f0efe9]';
  const formMeta = useMemo(
    () => getTemplateCardPreview(template.id, template.snapshot).formMeta,
    [template.id, template.snapshot]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{
        opacity: 1,
        y: 0,
        borderColor: selected ? '#1a1a1a' : '#e8e7e2',
      }}
      onClick={() => !isLoading && !anyLoading && onSelect?.(template)}
      transition={{ duration: 0.15 }}
      className={`relative bg-[#fbfaf8] border rounded-[12px] px-[19px] pt-[17px] pb-[19px] flex flex-col min-h-[402px] ${
        isLoading ? 'cursor-default' : 'cursor-pointer'
      } ${selected ? 'ring-2 ring-[#1a1a1a]/15' : ''}`}
    >
      <div className="flex items-start justify-between gap-3 mb-[14px]">
        <p className="text-[12px] font-normal text-[#656565] leading-[20px] whitespace-nowrap">
          {formMeta}
        </p>
        <span
          className={`inline-flex shrink-0 items-center rounded-[4px] px-3 py-[4px] text-[11px] font-medium text-[#656565] tracking-[0.5px] leading-[16.5px] uppercase whitespace-nowrap ${tagSurface}`}
        >
          {template.category}
        </span>
      </div>

      <TemplateCardPreview templateId={template.id} snapshot={template.snapshot} />

      <h3
        className="mt-[15px] text-[16px] font-bold text-[#111110] leading-[22.4px] tracking-[-0.1px]"
        style={{ fontFamily: 'Arimo, sans-serif' }}
      >
        {template.title}
      </h3>
      <p className="mt-[11px] text-[12.5px] font-normal text-[#656565] leading-[20px] flex-1">
        {template.description}
      </p>

      <div className="mt-5 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPreview?.(template);
          }}
          disabled={isLoading || anyLoading}
          className="h-8 min-w-[88px] px-[13px] bg-white border border-[#e5e3dc] rounded-[6px] text-[13.5px] font-medium text-[#1a1a1c] hover:bg-[#fafaf7] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Preview
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUseTemplate?.(template);
          }}
          disabled={isLoading || anyLoading}
          className="h-8 min-w-[112px] px-[13px] bg-[#1a1a1c] border border-[#1a1a1c] rounded-[6px] text-[13.5px] font-medium text-white hover:bg-[#2c2c2e] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Use template
        </button>
      </div>

      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[rgba(219,219,219,0.7)] flex items-center justify-center rounded-[12px] z-10"
          >
            <div className="flex items-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4 border-2 border-[#1a1a1c] border-r-transparent rounded-full"
              />
              <span className="text-[12px] font-medium text-[#1a1a1c]">Creating form…</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TemplateCard;
