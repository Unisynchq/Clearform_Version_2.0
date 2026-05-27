import { motion } from 'motion/react';
import { RiArrowRightSLine } from 'react-icons/ri';
import { premiumTransition } from '@/constants/premiumTransition';

const VARIANT_STYLES = {
  primary: {
    shell: 'border-[#0a0a0a] bg-[#0a0a0a]',
    iconWrap: 'bg-[rgba(255,255,255,0.12)]',
    icon: 'text-white',
    title: 'text-[16px] font-semibold leading-snug tracking-[-0.02em] text-white',
    description: 'text-[13.5px] leading-[1.55] text-[rgba(255,255,255,0.58)]',
    cta: 'text-[13px] font-medium text-white',
  },
  secondary: {
    shell: 'border-[#e5e4e0] bg-white hover:border-[#d4d3cf]',
    iconWrap: 'bg-[#f2f1ee]',
    icon: 'text-[#0a0a0a]',
    title: 'text-[14px] font-medium leading-snug tracking-[-0.015em] text-[#0a0a0a]',
    description: 'text-[12.5px] leading-[1.5] text-[#9a9892]',
    cta: 'text-[14px] font-medium tracking-[-0.01em] text-[#0a0a0a]',
  },
};

const OnboardingWelcomeOptionCard = ({
  variant = 'primary',
  badge,
  icon: Icon,
  title,
  description,
  ctaLabel,
  onClick,
}) => {
  const styles = VARIANT_STYLES[variant] ?? VARIANT_STYLES.primary;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: premiumTransition }}
      whileTap={{ scale: 0.985, transition: { duration: 0.12 } }}
      transition={premiumTransition}
      className={`flex min-h-[220px] w-full flex-col rounded-[16px] border p-7 text-left cursor-pointer ${styles.shell}`}
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-[12px] ${styles.iconWrap}`}
        >
          <Icon size={22} className={styles.icon} aria-hidden />
        </span>
        {badge ? (
          <span className="shrink-0 rounded-[100px] bg-[#e8000d] px-[9px] py-[3px] text-[10.5px] font-semibold uppercase tracking-[0.5px] text-white">
            {badge}
          </span>
        ) : (
          <span className="size-11 shrink-0" aria-hidden />
        )}
      </div>

      <div className="mt-5 flex min-h-0 flex-1 flex-col gap-2">
        <h3 className={styles.title}>{title}</h3>
        <p className={`${styles.description} line-clamp-3`}>{description}</p>
      </div>

      <span className={`mt-6 inline-flex items-center gap-0.5 ${styles.cta}`}>
        {ctaLabel}
        <RiArrowRightSLine size={16} className="-mr-0.5 shrink-0" aria-hidden />
      </span>
    </motion.button>
  );
};

export default OnboardingWelcomeOptionCard;
