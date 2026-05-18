import { useState, memo } from 'react';
import { motion } from 'motion/react';
import clearformLogoWhite from '../../assets/clearform-logo-white.svg';
import bgImage from '../../assets/onboarding-bg.jpg';

const PANEL_FRAME =
  'absolute left-4 top-4 bottom-4 right-0 rounded-[20px] overflow-hidden';

const GRADIENT_IDLE = 'linear-gradient(160deg, #1a0a0a 0%, #6b0f0f 45%, #1a0505 100%)';
const GRADIENT_MID = 'linear-gradient(200deg, #2a1010 0%, #8b1a1a 48%, #120808 100%)';
const GRADIENT_DEEP = 'linear-gradient(140deg, #1a0505 0%, #5c1212 38%, #1a0a0a 100%)';

const TAGLINE = ['Forms', 'built', 'for', 'Clarity,', 'Not', 'just', 'Collection.'];

const easeSmooth = [0.25, 0.1, 0.25, 1];

const AuthLeftPanel = memo(() => {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <motion.div className="relative hidden w-[540px] shrink-0 overflow-hidden bg-white lg:block">
      {/* Animated red gradient — visible before / behind image */}
      <motion.div
        className={PANEL_FRAME}
        animate={{ background: [GRADIENT_IDLE, GRADIENT_MID, GRADIENT_DEEP, GRADIENT_IDLE] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden
      />

      {/* Photo + animated wash */}
      <div className={PANEL_FRAME}>
        <motion.img
          src={bgImage}
          alt=""
          role="presentation"
          fetchPriority="high"
          decoding="async"
          onLoad={() => setImgLoaded(true)}
          className="absolute inset-0 h-full w-full object-cover"
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{
            opacity: imgLoaded ? 1 : 0,
            scale: imgLoaded ? [1.04, 1.09, 1.04] : 1.1,
          }}
          transition={{
            opacity: { duration: 0.65, ease: easeSmooth },
            scale: { duration: 20, repeat: Infinity, ease: 'easeInOut' },
          }}
        />

        {/* Animated overlay — red tint + depth (replaces static bg-black/30) */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(125deg, rgba(107,15,15,0.5) 0%, rgba(0,0,0,0.28) 42%, rgba(26,5,5,0.55) 100%)',
              backgroundSize: '220% 220%',
            }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: imgLoaded ? 1 : 0.55,
              backgroundPosition: ['0% 25%', '100% 75%', '0% 25%'],
            }}
            transition={{
              opacity: { duration: 0.7, ease: easeSmooth },
              backgroundPosition: { duration: 14, repeat: Infinity, ease: 'easeInOut' },
            }}
          />
          <motion.div
            className="absolute inset-0 bg-black"
            initial={{ opacity: 0.15 }}
            animate={{ opacity: imgLoaded ? [0.2, 0.36, 0.2] : [0.35, 0.5, 0.35] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(105deg, transparent 38%, rgba(255,110,110,0.14) 50%, transparent 62%)',
              backgroundSize: '200% 100%',
            }}
            animate={{ backgroundPosition: ['-120% 0%', '220% 0%'] }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'linear',
              repeatDelay: 1.5,
            }}
          />
        </div>
      </div>

      <img
        src={clearformLogoWhite}
        alt="Clearform"
        width="125"
        height="35"
        className="absolute left-8 top-8 z-10 h-[35px] w-[125px] object-contain"
      />

      <p className="absolute bottom-14 left-10 z-10 flex w-[min(100%,380px)] flex-wrap gap-x-[14px] gap-y-0 select-none text-[clamp(28px,4vw,52px)] font-bold leading-[1.15] tracking-[-2px] text-white">
        {TAGLINE.map((word, i) => (
          <motion.span
            key={word}
            initial={{ opacity: 0, x: -32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, ease: easeSmooth, delay: 0.15 + i * 0.08 }}
          >
            {word}
          </motion.span>
        ))}
      </p>
    </motion.div>
  );
});

AuthLeftPanel.displayName = 'AuthLeftPanel';

export default AuthLeftPanel;
