import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const TAG_SURFACES = {
  light: 'bg-white',
  muted: 'bg-[#f0efe9]',
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
  const [isHovered, setIsHovered] = useState(false);
  const { Icon } = template;
  const showActionRow = isHovered && !isLoading && !anyLoading;
  const tagSurface = TAG_SURFACES[template.tagVariant] || TAG_SURFACES.light;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{
        opacity: 1,
        y: 0,
        borderColor: selected ? '#1a1a1a' : showActionRow ? '#d4d2cb' : '#e8e7e2',
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => !isLoading && !anyLoading && onSelect?.(template)}
      transition={{ duration: 0.15 }}
      className={`relative bg-[#edeae3] border rounded-[12px] p-[26px] flex flex-col ${
        isLoading ? 'cursor-default' : 'cursor-pointer'
      } ${selected ? 'ring-2 ring-[#1a1a1a]/15' : ''}`}
    >
      <div className="flex gap-4 items-start">
        <div className="w-[48px] h-[48px] shrink-0 bg-[#f7f6f3] rounded-[8px] flex items-center justify-center">
          <motion.div layout className="bg-[#f6f5f3] rounded-[8px] p-2 flex items-center justify-center">
            <Icon size={16} className="text-[#6b6966]" />
          </motion.div>
        </div>

        <div className="flex flex-col flex-1 min-w-0">
          <h3
            className="text-[16px] font-bold text-[#111110] leading-[22.4px] tracking-[-0.1px] mb-2"
            style={{ fontFamily: 'Arimo, sans-serif' }}
          >
            {template.title}
          </h3>
          <p className="text-[14px] font-normal text-[#656565] leading-[22.4px] mb-4">
            {template.description}
          </p>
          <span
            className={`inline-flex self-start items-center rounded-[4px] px-3 py-1 text-[11px] font-medium text-[#656565] tracking-[0.5px] leading-[16.5px] whitespace-nowrap ${tagSurface}`}
          >
            {template.category}
          </span>

          <AnimatePresence initial={false}>
            {showActionRow && (
              <motion.div
                key="action-row"
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 36, marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden"
              >
                <div className="flex gap-2 h-9">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onPreview?.(template); }}
                    className="flex-1 h-9 bg-white border border-[#e5e3dc] rounded-lg text-[11px] font-medium text-[#1a1a1c] hover:bg-[#fafaf7] cursor-pointer"
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onUseTemplate?.(template); }}
                    className="flex-1 h-9 bg-[#1a1a1c] text-white rounded-lg text-[11px] font-medium hover:bg-[#2c2c2e] cursor-pointer"
                  >
                    Use template
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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
