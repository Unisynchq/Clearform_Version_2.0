import { memo, useState } from 'react';
import { motion } from 'motion/react';
import welcomePanelBg from '@/assets/onboarding-welcome-panel.jpg';

const OnboardingBrandPanel = memo(() => {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div className="relative h-full w-full min-h-[480px] shrink-0">
      <div
        className="absolute inset-0 rounded-[20px] bg-[linear-gradient(160deg,#1a0a0a_0%,#6b0f0f_45%,#1a0505_100%)]"
        aria-hidden
      />
      <div className="absolute inset-0 overflow-hidden rounded-[20px]">
        <img
          src={welcomePanelBg}
          alt=""
          role="presentation"
          fetchPriority="high"
          decoding="async"
          onLoad={() => setImgLoaded(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            imgLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div className="absolute inset-0 rounded-[20px] bg-[rgba(0,0,0,0.35)]" aria-hidden />
        {/* Bottom scrim so headline stays readable over the red gradient */}
        <div
          className="absolute inset-x-0 bottom-0 h-[55%] rounded-b-[20px] bg-gradient-to-t from-black/80 via-black/35 to-transparent"
          aria-hidden
        />
      </div>

      <div
        className="absolute inset-x-0 bottom-0 z-10 flex flex-col justify-end px-10 pb-14 pt-16 sm:px-12 sm:pb-16 lg:pl-14 lg:pr-10 lg:pb-[72px]"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
          className="max-w-[340px] text-[44px] font-semibold leading-[1.12] tracking-[-0.04em] text-white sm:text-[48px] lg:text-[52px] lg:leading-[1.08] lg:tracking-[-0.03em]"
        >
          <span className="block">Build forms</span>
          <span className="block">that actually</span>
          <span className="mt-1 block text-[#ff5c5c] drop-shadow-[0_2px_18px_rgba(0,0,0,0.55)]">
            get answers.
          </span>
        </motion.h2>
      </div>
    </div>
  );
});

OnboardingBrandPanel.displayName = 'OnboardingBrandPanel';

export default OnboardingBrandPanel;
