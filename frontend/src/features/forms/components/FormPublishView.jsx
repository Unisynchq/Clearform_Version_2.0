import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { completeOnboarding } from '@/store/slices/onboardingSlice';
import { motion, AnimatePresence } from 'motion/react';
import { premiumTransition } from '@/constants/premiumTransition';
import {
  RiCheckLine,
  RiCloseLine,
  RiCodeSSlashLine,
  RiDownloadLine,
  RiErrorWarningLine,
  RiEyeLine,
  RiFileCopyLine,
  RiMailLine,
  RiShareForwardLine,
  RiShareLine,
} from 'react-icons/ri';
import clearformLogo from '@/assets/clearform-high-resolution-logo-transparent.png';
import { useToast } from '@/hooks/useToast';
import { getFormBuilderPath } from '@/features/forms/utils/formBuilderNavigation';
import { getFreshAuthToken } from '@/features/auth/utils/authTokenRefresh';
import { auth } from '@/config/firebase';
import {
  AUTH_RETURN_TO_KEY,
  restoreFirebaseSessionFromCurrentUser,
} from '@/features/auth/services/firebaseAuthService';
import { loginSuccess } from '@/store/slices/authSlice';
import { isAuthSessionValid, readAuthSession } from '@/features/auth/utils/authStorage';

const FONT = { fontFamily: "'DM Sans', sans-serif" };

const publishStaggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.11, delayChildren: 0.05 },
  },
};

const publishStaggerItem = {
  hidden: { opacity: 0, y: 22, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: premiumTransition,
  },
};

const sharePanelMotion = {
  initial: { opacity: 0, y: 14, height: 0 },
  animate: {
    opacity: 1,
    y: 0,
    height: 'auto',
    transition: { ...premiumTransition, height: { duration: 0.32 } },
  },
  exit: {
    opacity: 0,
    y: -10,
    height: 0,
    transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] },
  },
};

const shimmer =
  'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.65),transparent)]';

const Sk = ({ className = '' }) => (
  <div className={`bg-[#e5e3dc] ${shimmer} ${className}`} aria-hidden />
);

const SkInner = ({ className = '' }) => (
  <div className={`bg-[#ddd9d0] ${shimmer} ${className}`} aria-hidden />
);

function useImageLoad(src) {
  const [status, setStatus] = useState(() => (src ? 'loading' : 'idle'));

  useEffect(() => {
    if (!src) {
      setStatus('idle');
      return undefined;
    }

    let cancelled = false;
    setStatus('loading');
    const img = new Image();
    img.onload = () => {
      if (!cancelled) setStatus('loaded');
    };
    img.onerror = () => {
      if (!cancelled) setStatus('error');
    };
    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [src]);

  return status;
}

function SuccessBannerSkeleton() {
  return (
    <div className="bg-white border border-[#e5e4e0] rounded-[16px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-[29px] py-[21px]">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <Sk className="w-10 h-10 rounded-[20px] shrink-0" />
        <div className="flex flex-col gap-2 min-w-0 flex-1">
          <Sk className="h-[15px] w-[min(100%,200px)] rounded-[4px]" />
          <Sk className="h-[12.5px] w-[min(100%,280px)] rounded-[4px]" />
        </div>
      </div>
      <div className="flex items-center gap-[10px] shrink-0">
        <Sk className="h-9 w-[132px] rounded-[8px]" />
        <Sk className="h-9 w-[88px] rounded-[8px]" />
      </div>
    </div>
  );
}

function FormLinkCardSkeleton() {
  return (
    <div className="border rounded-[16px] flex flex-col gap-5 p-[29px] bg-white border-[#e5e4e0]">
      <Sk className="h-[10.5px] w-[72px] rounded-[3px]" />

      <div className="flex flex-col gap-2">
        <Sk className="h-3 w-[68px] rounded-[3px]" />
        <div className="flex gap-2">
          <Sk className="flex-1 h-11 rounded-[8px] min-w-0" />
          <Sk className="h-11 w-[82px] rounded-[8px] shrink-0" />
        </div>
      </div>

      <div className="rounded-[12px] bg-[#f2f1ee] p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
          <div className="flex justify-center md:justify-start shrink-0">
            <div className="w-[200px] h-[200px] sm:w-[220px] sm:h-[220px] bg-white border border-[#e5e4e0] rounded-[12px] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex items-center justify-center">
              <SkInner className="w-full h-full rounded-[8px]" />
            </div>
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-4 items-center md:items-start">
            <div className="flex flex-col gap-2 w-full max-w-[360px] items-center md:items-start">
              <Sk className="h-[15px] w-[88px] rounded-[4px]" />
              <Sk className="h-[13px] w-full max-w-[320px] rounded-[4px]" />
              <Sk className="h-[12px] w-[min(100%,200px)] rounded-[4px]" />
            </div>
            <Sk className="h-10 w-[132px] rounded-[8px]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ShareViaCardSkeleton() {
  return (
    <div className="border rounded-[16px] flex flex-col gap-[18px] p-[29px] bg-white border-[#e5e4e0]">
      <Sk className="h-[10.5px] w-[76px] rounded-[3px]" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Sk className="h-[52px] rounded-[8px]" />
        <Sk className="h-[52px] rounded-[8px]" />
        <Sk className="h-[52px] rounded-[8px]" />
        <Sk className="h-[52px] rounded-[8px]" />
      </div>
    </div>
  );
}

function PublishViewContentSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading publish details">
      <SuccessBannerSkeleton />
      <FormLinkCardSkeleton />
      <ShareViaCardSkeleton />
    </div>
  );
}

const STEPS = [
  { id: 1, label: 'Choose use case' },
  { id: 2, label: 'Template preview' },
  { id: 3, label: 'Form builder' },
  { id: 4, label: 'Publish' },
];

const SHARE_CHANNELS = [
  { id: 'email', label: 'Send via email', icon: RiMailLine },
  { id: 'embed', label: 'Embed on website', icon: RiCodeSSlashLine },
  { id: 'social', label: 'Social media', icon: RiShareForwardLine },
  { id: 'copyShare', label: 'Copy & share', icon: RiFileCopyLine },
];

const SOCIAL_PLATFORMS = [
  { id: 'twitter', label: 'X (Twitter)', border: 'border-black', text: 'text-[#0a0a0a]' },
  { id: 'linkedin', label: 'LinkedIn', border: 'border-[#0a66c2]', text: 'text-[#0a66c2]' },
  { id: 'whatsapp', label: 'WhatsApp', border: 'border-[#25d366]', text: 'text-[#25d366]' },
  { id: 'facebook', label: 'Facebook', border: 'border-[#1877f2]', text: 'text-[#1877f2]' },
];

function slugify(text) {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'untitled-form'
  );
}

function buildEmbedCode(url) {
  return `<iframe\n  src="${url}"\n  width="100%"\n  height="600"\n  frameborder="0"\n  allow="fullscreen"\n></iframe>`;
}

function buildFullShareMessage(formTitle, formUrl) {
  return `📋 We're looking for a ${formTitle} to join our team!\nFill out our application form and tell us your story:\n${formUrl}\nPowered by Clearform`;
}

function buildSocialCaption(formTitle, formUrl) {
  return `We're hiring a ${formTitle}! Fill out our application and tell us your story 👇\n${formUrl}`;
}

const PublishStepBar = ({ activeStep = 4 }) => (
  <div className="flex items-center justify-center" style={FONT}>
    {STEPS.map((step, i) => (
      <div key={step.id} className="flex items-center">
        <div className="flex items-center gap-[6px] px-[14px]">
          {step.id < activeStep ? (
            <div className="w-5 h-5 rounded-[10px] bg-[#16a34a] flex items-center justify-center shrink-0">
              <RiCheckLine size={10} className="text-white" />
            </div>
          ) : (
            <div
              className={`w-5 h-5 rounded-[10px] flex items-center justify-center shrink-0 text-[11px] font-semibold ${
                step.id === activeStep ? 'bg-[#0a0a0a] text-white' : 'bg-transparent text-[#6b6965]'
              }`}
            >
              {step.id}
            </div>
          )}
          <span
            className={`text-[12.5px] whitespace-nowrap ${
              step.id === activeStep ? 'font-medium text-[#0a0a0a]' : 'font-normal text-[#6b6965]'
            }`}
          >
            {step.label}
          </span>
        </div>
        {i < STEPS.length - 1 && <div className="w-5 h-px bg-[#e5e4e0] shrink-0" />}
      </div>
    ))}
  </div>
);

const PublishNav = ({ showStepper, onHome }) => (
  <header
    className="h-[56px] shrink-0 bg-[#f5f4f1] border-b border-[#e5e4e0] flex items-center justify-between px-8 relative z-10"
    style={FONT}
  >
    <div className="flex items-center shrink-0">
      <img src={clearformLogo} alt="Clearform" className="h-[30px] w-auto object-contain" />
    </div>
    {showStepper && (
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[min(100vw-200px,640px)] overflow-x-auto px-2">
        <PublishStepBar activeStep={4} />
      </div>
    )}
    <button
      type="button"
      onClick={onHome}
      className={`h-[34px] px-[17px] bg-white border border-[#e5e4e0] rounded-[8px] text-[13px] font-medium text-[#0a0a0a] hover:bg-[#fafaf8] transition-colors cursor-pointer shrink-0${showStepper ? '' : ' ml-auto'}`}
    >
      Home
    </button>
  </header>
);

const SectionLabel = ({ children }) => (
  <p className="text-[10.5px] font-semibold text-[#b0aea8] tracking-[1.2px] uppercase" style={FONT}>
    {children}
  </p>
);

const AlertBanner = ({ children }) => (
  <div className="flex gap-[10px] items-start px-[17px] py-[13px] bg-[#fef2f2] border border-[#fca5a5] rounded-[8px]">
    <RiErrorWarningLine size={16} className="text-[#dc2626] shrink-0 mt-px" />
    <p className="text-[13px] text-[#dc2626] leading-snug" style={FONT}>
      {children}
    </p>
  </div>
);

function PublishIncompleteView({ formTitle, formId, showOnboardingStepper, onHome }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f5f4f1]" style={FONT}>
      <PublishNav showStepper={showOnboardingStepper} onHome={onHome} />
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-[440px] w-full bg-white border border-[#e5e4e0] rounded-[16px] shadow-[0_3px_12px_rgba(0,0,0,0.06)] p-8 text-center flex flex-col gap-4">
          <h1 className="text-[17px] font-semibold text-[#0a0a0a] tracking-[-0.3px]">
            Complete your form before publishing
          </h1>
          <p className="text-[13px] text-[#6b6965] leading-[19.5px]">
            Add at least one question in the builder, then publish when you&apos;re ready.
          </p>
          <button
            type="button"
            onClick={() =>
              navigate(getFormBuilderPath(formId), {
                state: { formId, formTitle },
                replace: true,
              })
            }
            className="mx-auto inline-flex items-center justify-center px-4 py-2.5 bg-[#0a0a0a] text-white text-[13px] font-medium rounded-[8px] hover:bg-[#2c2c2c] transition-colors cursor-pointer"
          >
            Back to builder
          </button>
        </div>
      </main>
    </div>
  );
}

function SuccessBanner({ formTitle, shortUrl, onViewResponses, onShare }) {
  return (
    <div className="bg-white border border-[#e5e4e0] rounded-[16px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-[29px] py-[21px]">
      <div className="flex items-center gap-4 min-w-0">
        <motion.div
          className="w-10 h-10 rounded-[20px] bg-[#16a34a] flex items-center justify-center shrink-0"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 22, delay: 0.18 }}
        >
          <RiCheckLine size={20} className="text-white" />
        </motion.div>
        <div className="min-w-0">
          <h1 className="text-[15px] font-semibold text-[#0a0a0a] tracking-[-0.2px]">
            Your form is published!
          </h1>
          <p className="text-[12.5px] text-[#6b6965] mt-0.5 truncate">
            {formTitle} · {shortUrl}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-[10px] shrink-0">
        <button
          type="button"
          onClick={onViewResponses}
          className="h-9 px-[18px] bg-[#0a0a0a] text-white text-[13px] font-medium rounded-[8px] hover:bg-[#2c2c2c] transition-colors cursor-pointer inline-flex items-center gap-[6px]"
        >
          <RiEyeLine size={14} />
          View responses
        </button>
        <button
          type="button"
          onClick={onShare}
          className="h-9 px-[19px] bg-white border border-[#e5e4e0] text-[#0a0a0a] text-[13px] font-medium rounded-[8px] hover:bg-[#fafaf8] transition-colors cursor-pointer inline-flex items-center gap-[6px]"
        >
          <RiShareLine size={14} />
          Share
        </button>
      </div>
    </div>
  );
}

function ErrorBanner({ onRetry, onSaveDraft }) {
  return (
    <div className="bg-[#fef2f2] border border-[#fca5a5] rounded-[16px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-[29px] py-[21px]">
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-10 h-10 rounded-[20px] bg-[#dc2626] flex items-center justify-center shrink-0">
          <RiErrorWarningLine size={20} className="text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-[15px] font-semibold text-[#0a0a0a] tracking-[-0.2px]">
            Publishing failed
          </h1>
          <p className="text-[12.5px] text-[#dc2626] mt-0.5">
            We couldn&apos;t publish your form. Check your connection and try again — your draft is
            saved.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-[10px] shrink-0">
        <button
          type="button"
          onClick={onRetry}
          className="h-9 px-[18px] bg-[#dc2626] text-white text-[13px] font-medium rounded-[8px] hover:bg-[#b91c1c] transition-colors cursor-pointer"
        >
          Retry publishing
        </button>
        <button
          type="button"
          onClick={onSaveDraft}
          className="h-9 px-[19px] bg-white border border-[#e5e4e0] text-[#0a0a0a] text-[13px] font-medium rounded-[8px] hover:bg-[#fafaf8] transition-colors cursor-pointer"
        >
          Save as draft
        </button>
      </div>
    </div>
  );
}

function QrCodeFrame({ isError, qrImageUrl, qrLoading, qrError }) {
  return (
    <div className="w-[200px] h-[200px] sm:w-[220px] sm:h-[220px] bg-white border border-[#e5e4e0] rounded-[12px] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex items-center justify-center relative overflow-hidden">
      {isError ? (
        <span className="text-[#b0aea8] text-4xl font-light">?</span>
      ) : (
        <>
          {(qrLoading || qrError) && (
            <div className="absolute inset-4 flex items-center justify-center">
              {qrError ? (
                <p className="text-[12px] text-[#6b6965] text-center leading-snug px-2">
                  Couldn&apos;t load QR. Try refreshing the page.
                </p>
              ) : (
                <SkInner className="w-full h-full rounded-[8px]" />
              )}
            </div>
          )}
          {!qrError && (
            <img
              src={qrImageUrl}
              alt="QR code for your form"
              className={`w-full h-full object-contain transition-opacity duration-300 ${
                qrLoading ? 'opacity-0' : 'opacity-100'
              }`}
            />
          )}
        </>
      )}
    </div>
  );
}

function FormLinkCard({
  formUrl,
  shortUrl,
  qrImageUrl,
  isError,
  qrLoading,
  qrError,
  linkCopied,
  onCopyLink,
  onDownloadQr,
}) {
  const cardClass = isError
    ? 'bg-[#fef2f2] border-[#fca5a5]'
    : 'bg-white border-[#e5e4e0]';

  return (
    <div className={`border rounded-[16px] flex flex-col gap-5 p-[29px] ${cardClass}`}>
      <SectionLabel>Form link</SectionLabel>

      {isError && (
        <AlertBanner>
          No link available yet — your form must be published before you can share it.
        </AlertBanner>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-[12px] font-medium text-[#6b6965]">Public link</p>
        <div className="flex gap-2">
          <div
            className={`flex-1 min-w-0 h-11 flex items-center px-[15px] rounded-[8px] border text-[13px] truncate ${
              isError
                ? 'bg-[#fef2f2] border-[#fca5a5] text-[#dc2626]'
                : 'bg-[#f2f1ee] border-[#e5e4e0] text-[#2e2d2b]'
            }`}
          >
            {isError ? '— Not published —' : formUrl}
          </div>
          <button
            type="button"
            onClick={onCopyLink}
            disabled={isError}
            className={`h-11 px-[18px] rounded-[8px] text-[13px] font-medium shrink-0 inline-flex items-center gap-[6px] transition-colors ${
              isError
                ? 'bg-[#0a0a0a] text-white opacity-40 cursor-not-allowed'
                : linkCopied
                  ? 'bg-[#16a34a] text-white cursor-pointer'
                  : 'bg-[#0a0a0a] text-white hover:bg-[#2c2c2c] cursor-pointer'
            }`}
          >
            {linkCopied ? (
              <>
                <RiCheckLine size={13} />
                Copied!
              </>
            ) : (
              <>
                <RiFileCopyLine size={13} />
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      <div
        className={`rounded-[12px] bg-[#f2f1ee] p-5 sm:p-6 ${
          isError ? 'opacity-50 pointer-events-none' : ''
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
          <div className="flex justify-center md:justify-start shrink-0">
            <QrCodeFrame
              isError={isError}
              qrImageUrl={qrImageUrl}
              qrLoading={qrLoading}
              qrError={qrError}
            />
          </div>

          <div className="flex-1 min-w-0 flex flex-col gap-4 text-center md:text-left">
            <div>
              <p className="text-[15px] font-semibold text-[#0a0a0a] tracking-[-0.2px]">QR Code</p>
              <p className="text-[13px] text-[#6b6965] leading-[19.5px] mt-1.5 max-w-[360px] mx-auto md:mx-0">
                {isError
                  ? 'Available once your form is published.'
                  : 'Let respondents scan this code to access your form instantly.'}
              </p>
              {!isError && shortUrl && (
                <p className="text-[12px] text-[#b0aea8] mt-2 truncate">{shortUrl}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onDownloadQr}
              disabled={isError || qrLoading || qrError}
              className="h-10 px-[18px] bg-white border border-[#d4d3cf] rounded-[8px] text-[13px] font-medium inline-flex items-center justify-center gap-[6px] self-center md:self-start hover:bg-[#fafaf8] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RiDownloadLine size={14} />
              Download QR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmbedCodeBlock({ formUrl, embedCopyState, onCopyEmbed }) {
  const embedCode = buildEmbedCode(formUrl);

  return (
    <div className="border border-[#e5e4e0] rounded-[12px] overflow-hidden">
      <div className="bg-[#f2f1ee] border-b border-[#e5e4e0] flex items-center justify-between px-[18px] py-[14px]">
        <div className="flex items-center gap-2">
          <RiCodeSSlashLine size={14} className="text-[#0a0a0a]" />
          <span className="text-[13px] font-semibold text-[#0a0a0a]">Embed code</span>
        </div>
      </div>
      <div className="bg-white p-[18px] flex flex-col gap-3">
        {embedCopyState === 'failed' && (
          <AlertBanner>
            Clipboard access denied. Please copy the code manually below.
          </AlertBanner>
        )}
        <p className="text-[12.5px] text-[#6b6965] leading-[18.75px]">
          Paste this snippet inside your website&apos;s{' '}
          <code className="bg-[#f2f1ee] px-1.5 py-0.5 rounded-[3px] text-[11.5px]">&lt;body&gt;</code>{' '}
          tag to embed the form inline.
        </p>
        <div className="relative bg-[#1a1a1a] rounded-[8px] p-4 min-h-[200px]">
          <button
            type="button"
            onClick={() => onCopyEmbed(embedCode)}
            className={`absolute top-2.5 right-2.5 h-7 px-[13px] rounded-[5px] text-[11px] font-medium border transition-colors cursor-pointer ${
              embedCopyState === 'failed'
                ? 'bg-[rgba(220,38,38,0.2)] border-[rgba(220,38,38,0.3)] text-[#fca5a5]'
                : embedCopyState === 'copied'
                  ? 'bg-[rgba(22,163,74,0.25)] border-[rgba(22,163,74,0.4)] text-[#86efac]'
                  : 'bg-[rgba(255,255,255,0.1)] border-[rgba(255,255,255,0.15)] text-white/70 hover:text-white'
            }`}
          >
            {embedCopyState === 'failed' ? 'Failed' : embedCopyState === 'copied' ? 'Copied!' : 'Copy'}
          </button>
          <pre className="text-[12px] leading-[19.2px] font-mono text-[#7dd3fc] whitespace-pre-wrap break-all pr-20">
            {embedCode.split('\n').map((line, i) => (
              <span key={i} className="block">
                {line.includes('src=') ? (
                  <>
                    <span className="text-[#86efac]">{'  src'}</span>
                    <span className="text-[#a8b3c1]">=</span>
                    <span className="text-[#fde68a]">{line.slice(line.indexOf('='))}</span>
                  </>
                ) : line.includes('width') || line.includes('height') || line.includes('frameborder') || line.includes('allow') ? (
                  <span className="text-[#86efac]">{line}</span>
                ) : (
                  line
                )}
              </span>
            ))}
          </pre>
        </div>
        {embedCopyState === 'failed' && (
          <p className="text-[11.5px] text-[#6b6965]">
            Select all text above and press <strong>Ctrl+C</strong> (or ⌘C on Mac) to copy.
          </p>
        )}
      </div>
    </div>
  );
}

function SocialSharePanel({ formTitle, formUrl, caption, onCaptionChange }) {
  const openSocial = (platform) => {
    const text = encodeURIComponent(caption);
    const url = encodeURIComponent(formUrl);
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${text}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      whatsapp: `https://wa.me/?text=${text}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    };
    window.open(urls[platform], '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="border border-[#e5e4e0] rounded-[12px] overflow-hidden">
      <div className="bg-[#f2f1ee] border-b border-[#e5e4e0] flex items-center justify-between px-[18px] py-[14px]">
        <div className="flex items-center gap-2">
          <RiShareForwardLine size={14} className="text-[#0a0a0a]" />
          <span className="text-[13px] font-semibold text-[#0a0a0a]">Share on social</span>
        </div>
      </div>
      <div className="bg-white p-[18px] flex flex-col gap-3">
        <p className="text-[12.5px] text-[#6b6965]">
          Choose a platform to share your form link. A pre-filled post will open in a new tab.
        </p>
        <div className="flex flex-wrap gap-2.5">
          {SOCIAL_PLATFORMS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => openSocial(p.id)}
              className={`h-[38px] px-[17px] rounded-full border bg-white text-[13px] font-medium inline-flex items-center gap-[7px] hover:bg-[#fafaf8] transition-colors cursor-pointer ${p.border} ${p.text}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="border-t border-[#e5e4e0] pt-4 flex flex-col gap-1.5">
          <label className="text-[12px] font-medium text-[#2e2d2b]">Preview caption</label>
          <textarea
            value={caption}
            onChange={(e) => onCaptionChange(e.target.value)}
            rows={4}
            className="w-full border border-[#e5e4e0] rounded-[8px] px-[13px] py-2 text-[13px] text-[#0a0a0a] resize-none outline-none focus:border-[#999]"
          />
          <div className="flex justify-between text-[11px] text-[#b0aea8]">
            <span>Caption is pre-filled when you open the platform</span>
            <span>{caption.length} / 280</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CopySharePanel({ formUrl, fullMessage, linkCopied, messageCopied, onCopyMessage, onCopyLinkOnly }) {
  return (
    <div className="border border-[#e5e4e0] rounded-[12px] overflow-hidden">
      <div className="bg-[#f2f1ee] border-b border-[#e5e4e0] flex items-center justify-between px-[18px] py-[14px]">
        <div className="flex items-center gap-2">
          <RiFileCopyLine size={14} className="text-[#0a0a0a]" />
          <span className="text-[13px] font-semibold text-[#0a0a0a]">Copy & share</span>
        </div>
      </div>
      <div className="bg-white p-[18px] flex flex-col gap-2.5">
        <p className="text-[12.5px] text-[#6b6965]">
          Copy a ready-to-paste message, or just the link, and share it anywhere.
        </p>

        <div className="border border-[#e5e4e0] rounded-[10px] overflow-hidden">
          <div className="bg-[#f2f1ee] border-b border-[#e5e4e0] flex items-center justify-between px-[14px] py-2.5">
            <span className="text-[11.5px] font-semibold text-[#6b6965] tracking-[0.5px] uppercase">
              Full message
            </span>
            <button
              type="button"
              onClick={onCopyMessage}
              className={`h-[26px] px-[15px] rounded-[6px] text-[11px] font-medium border inline-flex items-center gap-[5px] transition-colors cursor-pointer ${
                messageCopied
                  ? 'bg-[#dcfce7] border-[#16a34a] text-[#16a34a]'
                  : 'bg-white border-[#d4d3cf] text-[#0a0a0a] hover:bg-[#fafaf8]'
              }`}
            >
              {messageCopied ? (
                <>
                  <RiCheckLine size={10} />
                  Copied!
                </>
              ) : (
                <>
                  <RiFileCopyLine size={10} />
                  Copy
                </>
              )}
            </button>
          </div>
          <div className="px-[14px] py-3 text-[12.5px] text-[#2e2d2b] leading-5 whitespace-pre-wrap">
            {fullMessage}
          </div>
        </div>

        <div className="border border-[#e5e4e0] rounded-[10px] overflow-hidden">
          <div className="bg-[#f2f1ee] border-b border-[#e5e4e0] flex items-center justify-between px-[14px] py-2.5">
            <span className="text-[11.5px] font-semibold text-[#6b6965] tracking-[0.5px] uppercase">
              Link only
            </span>
            <button
              type="button"
              onClick={onCopyLinkOnly}
              className={`h-[26px] px-[15px] rounded-[6px] text-[11px] font-medium border inline-flex items-center gap-[5px] transition-colors cursor-pointer ${
                linkCopied
                  ? 'bg-[#dcfce7] border-[#16a34a] text-[#16a34a]'
                  : 'bg-white border-[#d4d3cf] text-[#0a0a0a] hover:bg-[#fafaf8]'
              }`}
            >
              {linkCopied ? (
                <>
                  <RiCheckLine size={10} />
                  Copied!
                </>
              ) : (
                <>
                  <RiFileCopyLine size={10} />
                  Copy link
                </>
              )}
            </button>
          </div>
          <div className="px-[14px] py-3 text-[13px] font-medium text-[#2e2d2b] break-all">{formUrl}</div>
        </div>
      </div>
    </div>
  );
}

function ShareViaCard({
  isError,
  activePanel,
  onSelectChannel,
  onClosePanel,
  formUrl,
  formTitle,
  embedCopyState,
  onCopyEmbed,
  socialCaption,
  onSocialCaptionChange,
  fullMessage,
  copyShareState,
  onCopyFullMessage,
  onCopyLinkOnly,
}) {
  const cardClass = isError
    ? 'bg-[#fef2f2] border-[#fca5a5]'
    : 'bg-white border-[#e5e4e0]';

  return (
    <motion.div layout className={`border rounded-[16px] flex flex-col gap-[18px] p-[29px] ${cardClass}`}>
      <SectionLabel>Share via</SectionLabel>

      {isError && (
        <AlertBanner>Sharing is disabled until the form is published successfully.</AlertBanner>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SHARE_CHANNELS.map(({ id, label, icon: Icon }) => {
          const isActive = !isError && activePanel === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => !isError && onSelectChannel(id)}
              disabled={isError}
              className={`min-h-[52px] h-[52px] rounded-[8px] border text-[13px] font-medium inline-flex items-center justify-center gap-2 transition-colors ${
                isError
                  ? 'bg-[#f2f1ee] border-[#e5e4e0] text-[#0a0a0a] opacity-45 cursor-not-allowed'
                  : isActive
                    ? 'bg-[#0a0a0a] border-[#0a0a0a] text-white cursor-pointer'
                    : 'bg-white border-[#e5e4e0] text-[#0a0a0a] hover:bg-[#fafaf8] cursor-pointer'
              }`}
            >
              {!isError && <Icon size={15} />}
              {label}
            </button>
          );
        })}
      </div>

      <AnimatePresence initial={false} mode="wait">
        {!isError && activePanel === 'embed' && (
          <motion.div
            key="embed"
            className="relative overflow-hidden"
            {...sharePanelMotion}
          >
            <button
              type="button"
              onClick={onClosePanel}
              className="absolute top-3 right-3 z-10 w-6 h-6 flex items-center justify-center rounded hover:bg-black/5 cursor-pointer"
              aria-label="Close embed panel"
            >
              <RiCloseLine size={14} className="text-[#6b6965]" />
            </button>
            <EmbedCodeBlock formUrl={formUrl} embedCopyState={embedCopyState} onCopyEmbed={onCopyEmbed} />
          </motion.div>
        )}

        {!isError && activePanel === 'social' && (
          <motion.div
            key="social"
            className="relative overflow-hidden"
            {...sharePanelMotion}
          >
            <button
              type="button"
              onClick={onClosePanel}
              className="absolute top-3 right-3 z-10 w-6 h-6 flex items-center justify-center rounded hover:bg-black/5 cursor-pointer"
              aria-label="Close social panel"
            >
              <RiCloseLine size={14} className="text-[#6b6965]" />
            </button>
            <SocialSharePanel
              formTitle={formTitle}
              formUrl={formUrl}
              caption={socialCaption}
              onCaptionChange={onSocialCaptionChange}
            />
          </motion.div>
        )}

        {!isError && activePanel === 'copyShare' && (
          <motion.div
            key="copyShare"
            className="relative overflow-hidden"
            {...sharePanelMotion}
          >
            <button
              type="button"
              onClick={onClosePanel}
              className="absolute top-3 right-3 z-10 w-6 h-6 flex items-center justify-center rounded hover:bg-black/5 cursor-pointer"
              aria-label="Close copy panel"
            >
              <RiCloseLine size={14} className="text-[#6b6965]" />
            </button>
            <CopySharePanel
              formUrl={formUrl}
              fullMessage={fullMessage}
              linkCopied={copyShareState.linkCopied}
              messageCopied={copyShareState.messageCopied}
              onCopyMessage={onCopyFullMessage}
              onCopyLinkOnly={onCopyLinkOnly}
            />
          </motion.div>
        )}

        {!isError && activePanel === 'email' && (
          <motion.div
            key="email"
            className="overflow-hidden"
            {...sharePanelMotion}
          >
            <div className="border border-[#e5e4e0] rounded-[12px] bg-white p-[18px]">
              <p className="text-[12.5px] text-[#6b6965] mb-3">
                Open your email client with a pre-filled message containing your form link.
              </p>
              <a
                href={`mailto:?subject=${encodeURIComponent(`Apply: ${formTitle}`)}&body=${encodeURIComponent(fullMessage)}`}
                className="inline-flex h-9 px-4 items-center bg-[#0a0a0a] text-white text-[13px] font-medium rounded-[8px] hover:bg-[#2c2c2c]"
              >
                Open email app
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const FormPublishView = ({
  formTitle = 'Untitled Form',
  formId = null,
  publicUrl: publicUrlProp = null,
  showOnboardingStepper = true,
  fromOnboarding = false,
  publishFailed = false,
  onRetryPublish,
  onSaveAsDraft,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);
  const { showToast } = useToast();
  const form = useSelector((s) =>
    formId != null ? s.forms.forms.find((f) => f.id === formId) : null,
  );
  const isLive = form?.status === 'live';

  const [activeSharePanel, setActiveSharePanel] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [embedCopyState, setEmbedCopyState] = useState('idle');
  const [socialCaption, setSocialCaption] = useState('');
  const [copyShareState, setCopyShareState] = useState({ messageCopied: false, linkCopied: false });

  const formSlug = useMemo(() => slugify(formTitle), [formTitle]);
  const formPathId = formId != null ? String(formId) : formSlug;
  const formUrl =
    publicUrlProp ??
    (typeof window !== 'undefined'
      ? `${window.location.origin}/f/${formPathId}`
      : `https://clearform.io/f/${formPathId}`);
  const shortUrl =
    publicUrlProp && typeof window !== 'undefined'
      ? `${new URL(publicUrlProp).host}${new URL(publicUrlProp).pathname}`
      : typeof window !== 'undefined'
        ? `${window.location.host}/f/${formPathId}`
        : `clearform.io/f/${formPathId}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(formUrl)}`;
  const fullMessage = useMemo(() => buildFullShareMessage(formTitle, formUrl), [formTitle, formUrl]);

  const showErrorState = publishFailed;
  const showSuccessState = isLive && !publishFailed;

  const qrLoadStatus = useImageLoad(showSuccessState ? qrImageUrl : null);
  const qrLoading = qrLoadStatus === 'loading';
  const qrError = qrLoadStatus === 'error';
  const isPublishContentLoading = showSuccessState && qrLoading;

  useEffect(() => {
    setSocialCaption(buildSocialCaption(formTitle, formUrl));
  }, [formTitle, formUrl]);

  const copyToClipboard = useCallback(
    async (text, { onSuccess, onFail } = {}) => {
      try {
        await navigator.clipboard.writeText(text);
        onSuccess?.();
        return true;
      } catch {
        onFail?.();
        return false;
      }
    },
    [],
  );

  const handleCopyLink = useCallback(async () => {
    const ok = await copyToClipboard(formUrl);
    if (ok) {
      setLinkCopied(true);
      showToast({ type: 'success', message: 'Link copied to clipboard' });
      setTimeout(() => setLinkCopied(false), 2500);
    } else {
      showToast({ type: 'error', message: 'Could not copy link' });
    }
  }, [copyToClipboard, formUrl, showToast]);

  const handleCopyEmbed = useCallback(
    async (code) => {
      const ok = await copyToClipboard(code);
      if (ok) {
        setEmbedCopyState('copied');
        showToast({ type: 'success', message: 'Embed code copied' });
        setTimeout(() => setEmbedCopyState('idle'), 2500);
      } else {
        setEmbedCopyState('failed');
      }
    },
    [copyToClipboard, showToast],
  );

  const handleCopyFullMessage = useCallback(async () => {
    const ok = await copyToClipboard(fullMessage);
    if (ok) {
      setCopyShareState((s) => ({ ...s, messageCopied: true }));
      setTimeout(() => setCopyShareState((s) => ({ ...s, messageCopied: false })), 2500);
    }
  }, [copyToClipboard, fullMessage]);

  const handleCopyLinkOnly = useCallback(async () => {
    const ok = await copyToClipboard(formUrl);
    if (ok) {
      setCopyShareState((s) => ({ ...s, linkCopied: true }));
      setTimeout(() => setCopyShareState((s) => ({ ...s, linkCopied: false })), 2500);
    }
  }, [copyToClipboard, formUrl]);

  const downloadQr = useCallback(() => {
    const link = document.createElement('a');
    link.href = qrImageUrl;
    link.download = `${formSlug}-qr.png`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  }, [formSlug, qrImageUrl]);

  const handleViewResponses = useCallback(async () => {
    if (formId == null) return;
    const target = `/dashboard/analytics?form=${encodeURIComponent(String(formId))}&tab=responses`;

    let authed = isAuthenticated;

    if (auth?.currentUser?.email) {
      try {
        await getFreshAuthToken();
        const user = await restoreFirebaseSessionFromCurrentUser();
        if (user?.email) {
          dispatch(
            loginSuccess({
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
            }),
          );
          authed = true;
        }
      } catch {
        authed = Boolean(auth.currentUser);
      }
    }

    if (!authed && isAuthSessionValid()) {
      const session = readAuthSession();
      dispatch(
        loginSuccess({
          email: session.email,
          firstName: session.firstName,
          lastName: session.lastName,
        }),
      );
      authed = true;
    }

    if (!authed) {
      sessionStorage.setItem(AUTH_RETURN_TO_KEY, target);
      navigate('/signin', { state: { from: target } });
      return;
    }

    try {
      await getFreshAuthToken();
    } catch {
      // navigate anyway when Redux says authed; token may still be in sessionStorage
    }

    navigate(target);
  }, [formId, navigate, dispatch, isAuthenticated]);

  const handleHome = useCallback(() => {
    if (fromOnboarding) {
      dispatch(completeOnboarding());
    }
    navigate('/dashboard');
  }, [navigate, fromOnboarding, dispatch]);

  const handleRetry = useCallback(() => {
    if (onRetryPublish) {
      onRetryPublish();
    } else {
      navigate(getFormBuilderPath(formId), { state: { formId, formTitle }, replace: true });
    }
  }, [onRetryPublish, navigate, formId, formTitle]);

  const handleSaveDraft = useCallback(() => {
    if (onSaveAsDraft) {
      onSaveAsDraft();
    } else {
      navigate(getFormBuilderPath(formId), { state: { formId, formTitle }, replace: true });
    }
  }, [onSaveAsDraft, navigate, formId, formTitle]);

  if (!showSuccessState && !showErrorState) {
    return (
      <PublishIncompleteView
        formTitle={formTitle}
        formId={formId}
        showOnboardingStepper={showOnboardingStepper}
        onHome={handleHome}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f5f4f1]" style={FONT}>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...premiumTransition, delay: 0.04 }}
      >
        <PublishNav showStepper={showOnboardingStepper} onHome={handleHome} />
      </motion.div>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[720px] mx-auto px-5 sm:px-10 lg:px-20 py-10">
          <AnimatePresence mode="wait">
            {isPublishContentLoading ? (
              <motion.div
                key="publish-skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <PublishViewContentSkeleton />
              </motion.div>
            ) : (
              <motion.div
                key="publish-content"
                className="flex flex-col gap-4"
                variants={publishStaggerContainer}
                initial="hidden"
                animate="visible"
              >
                <motion.div variants={publishStaggerItem}>
                  {showErrorState ? (
                    <ErrorBanner onRetry={handleRetry} onSaveDraft={handleSaveDraft} />
                  ) : (
                    <SuccessBanner
                      formTitle={formTitle}
                      shortUrl={shortUrl}
                      onViewResponses={handleViewResponses}
                      onShare={() => {
                        setActiveSharePanel('copyShare');
                        document.getElementById('share-via-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    />
                  )}
                </motion.div>

                <motion.div variants={publishStaggerItem}>
                  <FormLinkCard
                    formUrl={formUrl}
                    shortUrl={shortUrl}
                    qrImageUrl={qrImageUrl}
                    isError={showErrorState}
                    qrLoading={qrLoading}
                    qrError={qrError}
                    linkCopied={linkCopied}
                    onCopyLink={handleCopyLink}
                    onDownloadQr={downloadQr}
                  />
                </motion.div>

                <motion.div id="share-via-section" variants={publishStaggerItem}>
                  <ShareViaCard
                    isError={showErrorState}
                    activePanel={activeSharePanel}
                    onSelectChannel={(id) => setActiveSharePanel((prev) => (prev === id ? null : id))}
                    onClosePanel={() => setActiveSharePanel(null)}
                    formUrl={formUrl}
                    formTitle={formTitle}
                    embedCopyState={embedCopyState}
                    onCopyEmbed={handleCopyEmbed}
                    socialCaption={socialCaption}
                    onSocialCaptionChange={setSocialCaption}
                    fullMessage={fullMessage}
                    copyShareState={copyShareState}
                    onCopyFullMessage={handleCopyFullMessage}
                    onCopyLinkOnly={handleCopyLinkOnly}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default FormPublishView;
