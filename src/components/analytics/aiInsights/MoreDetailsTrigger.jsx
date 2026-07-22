import { motion } from 'motion/react';

export default function MoreDetailsTrigger({ open, onClick, disabled = false }) {
  return (
    <motion.button
      type="button"
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-expanded={open}
      aria-label={open ? 'Show overview' : 'Show more details'}
      className={`shrink-0 rounded-[7.715px] px-[13px] py-1 text-[14.788px] font-normal outline-none focus-visible:ring-2 focus-visible:ring-[rgba(74,79,237,0.25)] ${
        disabled
          ? 'cursor-default text-[#dadada] select-none'
          : 'cursor-pointer text-[#99968e] hover:bg-[#fafaf8]'
      }`}
    >
      {open ? 'Overview' : 'More Details'}
    </motion.button>
  );
}
