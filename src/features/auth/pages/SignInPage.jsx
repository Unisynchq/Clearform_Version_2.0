import { useState, useCallback, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { FcGoogle } from 'react-icons/fc';
import { RiGlobalLine, RiArrowDownSLine, RiAppleFill, RiEyeLine, RiEyeOffLine } from 'react-icons/ri';
import { setField, setSubmitting, loginSuccess } from '@/store/slices/authSlice';
import { resolveSignInNavigation } from '@/features/onboarding/utils/authOnboarding';
import {
  mapFirebaseAuthError,
  profileFromFirebaseUser,
  signInWithEmail,
  signInWithGoogle,
} from '@/features/auth/utils/firebaseAuth';
import AuthFieldError from '@/features/auth/components/AuthFieldError';
import {
  hasValidationErrors,
  validateSignInForm,
} from '@/features/auth/utils/authValidation';
import { useToast } from '@/hooks/useToast';
import clearformLogoWhite from '@/assets/clearform-logo-white.svg';
import bgImage from '@/assets/onboarding-bg.jpg';

/* ─── Static sub-components ─── */

const MicrosoftIcon = memo(() => (
  <svg width="20" height="20" viewBox="0 0 21 21" fill="none" aria-hidden="true">
    <rect x="0" y="0" width="10" height="10" fill="#F25022" />
    <rect x="11" y="0" width="10" height="10" fill="#7FBA00" />
    <rect x="0" y="11" width="10" height="10" fill="#00A4EF" />
    <rect x="11" y="11" width="10" height="10" fill="#FFB900" />
  </svg>
));

const SocialButton = memo(({ children, label, onClick, disabled }) => (
  <motion.button
    type="button"
    aria-label={label}
    onClick={onClick}
    disabled={disabled}
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.96 }}
    transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
    className="flex items-center justify-center w-[58px] h-[40px] bg-white border border-[rgba(81,76,84,0.15)] rounded-[10px] hover:bg-[#f4f4f4] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
  >
    {children}
  </motion.button>
));

const inputBaseClass =
  'w-full h-[40px] bg-[#fafafa] border rounded-[10px] px-[13px] text-[13px] text-[#0f0f0e] placeholder:text-[#757575] outline-none focus:bg-white transition-colors duration-150';
const inputValidClass = 'border-[rgba(81,76,84,0.15)] focus:border-[rgba(81,76,84,0.4)]';
const inputInvalidClass = 'border-[#c74e43] focus:border-[#c74e43]';

const InputField = memo(({ label, required, type = 'text', placeholder, value, onChange, name, error }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const errorId = `${name}-error`;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label htmlFor={name} className="flex items-center gap-0.5 text-[13.5px] font-normal text-[#655d67] leading-[20px]">
        {label}
        {required && <span className="text-[#c74e43] text-[14px]" aria-hidden="true">*</span>}
      </label>
      <div className="relative">
        <input
          id={name}
          type={isPassword && showPassword ? 'text' : type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={isPassword ? 'current-password' : name === 'email' ? 'email' : 'on'}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`${inputBaseClass} ${error ? inputInvalidClass : inputValidClass}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a8a6a0] hover:text-[#6b6966] transition-colors cursor-pointer"
          >
            {showPassword ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
          </button>
        )}
      </div>
      <AuthFieldError id={errorId} message={error} />
    </div>
  );
});

/* ─── Left panel ─── */

const LeftPanel = memo(() => {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div className="w-[540px] shrink-0 relative bg-white overflow-hidden">
      <div className="absolute left-4 top-4 bottom-4 right-0 rounded-[20px] bg-[linear-gradient(160deg,#1a0a0a_0%,#6b0f0f_45%,#1a0505_100%)]" />

      <div className="absolute left-4 top-4 bottom-4 right-0 rounded-[20px] overflow-hidden">
        <img
          src={bgImage}
          alt=""
          role="presentation"
          fetchPriority="high"
          decoding="async"
          onLoad={() => setImgLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            imgLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Logo */}
      <img
        src={clearformLogoWhite}
        alt="Clearform"
        width="125"
        height="35"
        className="absolute left-8 top-8 w-[125px] h-[35px] object-contain z-10"
      />

      {/* Tagline — words slide in from the left one by one */}
      <p className="absolute left-10 bottom-14 text-[52px] font-bold text-white leading-[60px] tracking-[-2px] w-[380px] z-10 select-none flex flex-wrap gap-x-[14px] gap-y-0">
        {['Forms', 'built', 'for', 'Clarity,', 'Not', 'just', 'Collection.'].map((word, i) => (
          <motion.span
            key={word}
            initial={{ opacity: 0, x: -32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 + i * 0.08 }}
          >
            {word}
          </motion.span>
        ))}
      </p>
    </div>
  );
});

/* ─── Main page ─── */

const SignInPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { email, password, isSubmitting } = useSelector((state) => state.auth);
  const [errors, setErrors] = useState({});

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    dispatch(setField({ field: name, value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: null } : prev));
  }, [dispatch]);

  const completeAuth = useCallback((user) => {
    const profile = profileFromFirebaseUser(user);
    dispatch(loginSuccess(profile));
    showToast({ type: 'success', message: 'Signed in successfully', duration: 3000 });
    navigate(resolveSignInNavigation(dispatch));
  }, [dispatch, navigate, showToast]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const nextErrors = validateSignInForm({ email, password });
    setErrors(nextErrors);
    if (hasValidationErrors(nextErrors)) return;

    const trimmedEmail = email.trim();
    dispatch(setSubmitting(true));
    try {
      const user = await signInWithEmail(trimmedEmail, password);
      completeAuth(user);
    } catch (err) {
      setErrors({ password: mapFirebaseAuthError(err) });
    } finally {
      dispatch(setSubmitting(false));
    }
  }, [dispatch, email, password, completeAuth]);

  const handleGoogleSignIn = useCallback(async () => {
    dispatch(setSubmitting(true));
    try {
      const user = await signInWithGoogle();
      completeAuth(user);
    } catch (err) {
      showToast({ type: 'error', message: mapFirebaseAuthError(err), duration: 4000 });
    } finally {
      dispatch(setSubmitting(false));
    }
  }, [dispatch, completeAuth, showToast]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white">

      <LeftPanel />

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center bg-white px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full max-w-[406px] flex flex-col gap-4"
        >
          {/* Heading */}
          <div className="flex flex-col gap-1.5">
            <h1 className="text-[22px] font-bold text-[#0f0f0e] leading-[28px]">
              Welcome back
            </h1>
            <p className="text-[14px] font-normal text-[#6b6860] leading-[20px]">
              Sign in to continue managing your forms and workflows.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-[14px]" noValidate>
            <InputField
              label="Email" required type="email" name="email"
              placeholder="johndoe@gmail.com" value={email} onChange={handleChange}
              error={errors.email}
            />

            <PasswordField value={password} onChange={handleChange} error={errors.password} />

            {/* Social login */}
            <div className="flex items-center justify-center gap-3 py-0.5">
              <SocialButton label="Continue with Google" onClick={handleGoogleSignIn} disabled={isSubmitting}>
                <FcGoogle size={22} />
              </SocialButton>
              <SocialButton label="Continue with Microsoft"><MicrosoftIcon /></SocialButton>
              <SocialButton label="Continue with Apple">
                <RiAppleFill size={22} className="text-[#0f0f0e]" />
              </SocialButton>
            </div>

            {/* CTA */}
            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-[46px] bg-black text-white text-[15px] font-semibold rounded-[12px] flex items-center justify-center cursor-pointer hover:bg-[#2c2c2e] active:scale-[0.99] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <svg className="animate-spin w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" aria-label="Loading">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : 'Sign In'}
              </button>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full h-[46px] border border-[rgba(0,0,0,0.2)] text-[#737373] text-[15px] font-normal rounded-[12px] flex items-center justify-center cursor-pointer hover:bg-[rgba(0,0,0,0.02)] active:scale-[0.99] transition-all duration-150"
              >
                Don't have an account? Sign up
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-[#4c414e] leading-[20px]">Have a question?</span>
              <a href="#" className="text-[13px] text-[#3c323e] leading-[20px] underline hover:text-[#1a1a1c] transition-colors">
                Contact us
              </a>
            </div>
            <button className="flex items-center gap-1.5 border border-[rgba(81,76,84,0.15)] rounded-[8px] px-3 h-[30px] hover:bg-[#f4f3ef] transition-colors duration-150 cursor-pointer">
              <RiGlobalLine size={14} className="text-[#655d67]" />
              <span className="text-[13px] text-[#655d67] leading-[20px]">English</span>
              <RiArrowDownSLine size={14} className="text-[#655d67]" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

/* ─── Password field with inline "Forgot password?" link ─── */

const PasswordField = memo(({ value, onChange, error }) => {
  const [showPassword, setShowPassword] = useState(false);
  const errorId = 'password-error';

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between">
        <label htmlFor="password" className="flex items-center gap-0.5 text-[13.5px] font-normal text-[#655d67] leading-[20px]">
          Password<span className="text-[#c74e43] text-[14px]" aria-hidden="true">*</span>
        </label>
        <a
          href="#"
          className="text-[13px] text-[#3c323e] leading-[20px] underline hover:text-[#1a1a1c] transition-colors"
        >
          Forgot password?
        </a>
      </div>
      <div className="relative">
        <input
          id="password"
          type={showPassword ? 'text' : 'password'}
          name="password"
          value={value}
          onChange={onChange}
          placeholder="Enter your password"
          autoComplete="current-password"
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`${inputBaseClass} pr-10 ${error ? inputInvalidClass : inputValidClass}`}
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a8a6a0] hover:text-[#6b6966] transition-colors cursor-pointer"
        >
          {showPassword ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
        </button>
      </div>
      <AuthFieldError id={errorId} message={error} />
    </div>
  );
});

export default SignInPage;
