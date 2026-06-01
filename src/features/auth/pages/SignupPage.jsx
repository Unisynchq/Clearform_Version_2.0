import { useState, useCallback, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { FcGoogle } from 'react-icons/fc';
import { RiGlobalLine, RiArrowDownSLine, RiEyeLine, RiEyeOffLine } from 'react-icons/ri';
import { setField, setSubmitting, setError, loginSuccess } from '@/store/slices/authSlice';
import {
  applyBackendOnboardingState,
  resolveAuthNavigationAfterSync,
} from '@/features/onboarding/utils/authOnboarding';
import {
  signUpWithEmail,
  signInWithGoogle,
  startMicrosoftSignInRedirect,
} from '@/features/auth/services/firebaseAuthService';
import AuthFieldError from '@/features/auth/components/AuthFieldError';
import {
  hasValidationErrors,
  validateSignupForm,
} from '@/features/auth/utils/authValidation';
import { useToast } from '@/hooks/useToast';
import clearformLogoWhite from '@/assets/clearform-logo-white.svg';
import bgImage from '@/assets/onboarding-bg.jpg';

/* ─── Static sub-components (memo prevents re-renders on form typing) ─── */

const MicrosoftIcon = memo(() => (
  <svg width="20" height="20" viewBox="0 0 21 21" fill="none" aria-hidden="true">
    <rect x="0" y="0" width="10" height="10" fill="#F25022" />
    <rect x="11" y="0" width="10" height="10" fill="#7FBA00" />
    <rect x="0" y="11" width="10" height="10" fill="#00A4EF" />
    <rect x="11" y="11" width="10" height="10" fill="#FFB900" />
  </svg>
));

const SocialButton = memo(({ children, label, onClick }) => (
  <motion.button
    type="button"
    aria-label={label}
    onClick={onClick}
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.96 }}
    transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
    className="flex items-center justify-center w-[58px] h-[40px] bg-white border border-[rgba(81,76,84,0.15)] rounded-[10px] hover:bg-[#f4f4f4] cursor-pointer"
  >
    {children}
  </motion.button>
));

const inputBaseClass =
  'w-full h-[40px] bg-[#fafafa] border rounded-[10px] px-[13px] text-[13px] text-[#0f0f0e] placeholder:text-[#757575] outline-none focus:bg-white transition-colors duration-150';
const inputValidClass = 'border-[rgba(81,76,84,0.15)] focus:border-[rgba(81,76,84,0.4)]';
const inputInvalidClass = 'border-[#c74e43] focus:border-[#c74e43]';
const nameInputBaseClass =
  'w-full h-[40px] bg-[#fafafa] border rounded-[8px] px-3 text-[13px] text-[#0f0f0e] placeholder:text-[#757575] outline-none focus:bg-white transition-colors duration-150';
const nameInputValidClass = 'border-[#e1e0e2] focus:border-[rgba(81,76,84,0.4)]';
const nameInputInvalidClass = 'border-[#c74e43] focus:border-[#c74e43]';

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
          autoComplete={isPassword ? 'new-password' : name === 'email' ? 'email' : 'given-name'}
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

const NameField = memo(({ id, label, name, value, onChange, placeholder, autoComplete, error }) => {
  const errorId = `${name}-error`;

  return (
    <div className="flex flex-col gap-1 flex-1">
      <label htmlFor={id} className="text-[12px] font-bold text-[#5a5a56] leading-[18px]">
        {label}
      </label>
      <input
        id={id}
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`${nameInputBaseClass} ${error ? nameInputInvalidClass : nameInputValidClass}`}
      />
      <AuthFieldError id={errorId} message={error} />
    </div>
  );
});

/* ─── Left panel — isolated so image state doesn't re-render the form ─── */

const LeftPanel = memo(() => {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div className="w-[540px] shrink-0 relative bg-white overflow-hidden">
      {/* Placeholder gradient shown instantly */}
      <div className="absolute left-4 top-4 bottom-4 right-0 rounded-[20px] bg-[linear-gradient(160deg,#1a0a0a_0%,#6b0f0f_45%,#1a0505_100%)]" />

      {/* Real image — fades in once loaded */}
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

/* ─── Main page ─────────────────────────────────────────────────────────── */

const SignupPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { firstName, lastName, email, password, isSubmitting } = useSelector(
    (state) => state.auth
  );
  const [errors, setErrors] = useState({});

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    dispatch(setField({ field: name, value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: null } : prev));
  }, [dispatch]);

  const handleFederatedSignUp = useCallback(
    async (signInFn, providerLabel) => {
      dispatch(setSubmitting(true));
      try {
        const user = await signInFn();
        applyBackendOnboardingState(dispatch, user.onboardingCompleted);
        const path = resolveAuthNavigationAfterSync(dispatch, {
          onboardingCompleted: user.onboardingCompleted,
        });
        dispatch(loginSuccess({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        }));
        showToast({ type: 'success', message: `Signed in with ${providerLabel}`, duration: 3000 });
        navigate(path, { replace: true });
      } catch (err) {
        dispatch(setError(err.message));
      } finally {
        dispatch(setSubmitting(false));
      }
    },
    [dispatch, navigate, showToast],
  );

  const handleGoogleSignIn = useCallback(
    () => handleFederatedSignUp(signInWithGoogle, 'Google'),
    [handleFederatedSignUp],
  );

  const handleMicrosoftSignIn = useCallback(async () => {
    dispatch(setSubmitting(true));
    dispatch(setError(null));
    try {
      await startMicrosoftSignInRedirect();
    } catch (err) {
      dispatch(setError(err.message));
      dispatch(setSubmitting(false));
    }
  }, [dispatch]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const nextErrors = validateSignupForm({ firstName, lastName, email, password });
    setErrors(nextErrors);
    if (hasValidationErrors(nextErrors)) return;

    dispatch(setSubmitting(true));
    try {
      const user = await signUpWithEmail(email.trim(), password, firstName.trim(), lastName.trim());
      applyBackendOnboardingState(dispatch, user.onboardingCompleted);
      const path = resolveAuthNavigationAfterSync(dispatch, {
        onboardingCompleted: user.onboardingCompleted,
      });
      dispatch(loginSuccess({ email: user.email, firstName: user.firstName, lastName: user.lastName }));
      showToast({
        type: 'success',
        message: user.firstName ? `Welcome, ${user.firstName}! Your account is ready.` : 'Account created successfully',
        duration: 3000,
      });
      navigate(path, { replace: true });
    } catch (err) {
      dispatch(setError(err.message));
      setErrors({ email: err.message });
    } finally {
      dispatch(setSubmitting(false));
    }
  }, [dispatch, navigate, email, firstName, lastName, password, showToast]);

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
              Create your account
            </h1>
            <p className="text-[14px] font-normal text-[#6b6860] leading-[20px]">
              Continue building forms, gathering responses, and automating your workflows.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-[14px]" noValidate>
            {/* Name row */}
            <div className="flex items-start gap-4">
              <NameField
                id="firstName"
                label="First name"
                name="firstName"
                value={firstName}
                onChange={handleChange}
                placeholder="John"
                autoComplete="given-name"
                error={errors.firstName}
              />
              <NameField
                id="lastName"
                label="Last name"
                name="lastName"
                value={lastName}
                onChange={handleChange}
                placeholder="Doe"
                autoComplete="family-name"
                error={errors.lastName}
              />
            </div>

            <InputField
              label="Email" required type="email" name="email"
              placeholder="johndoe@gmail.com" value={email} onChange={handleChange}
              error={errors.email}
            />

            <InputField
              label="Password" required type="password" name="password"
              placeholder="Min. 8 characters" value={password} onChange={handleChange}
              error={errors.password}
            />

            {/* Social login */}
            <div className="flex items-center justify-center gap-3 py-0.5">
              <SocialButton label="Continue with Google" onClick={handleGoogleSignIn}><FcGoogle size={22} /></SocialButton>
              <SocialButton label="Continue with Microsoft" onClick={handleMicrosoftSignIn}><MicrosoftIcon /></SocialButton>
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
                ) : 'Create Account'}
              </button>

              <button
                type="button"
                onClick={() => navigate('/signin')}
                className="w-full h-[46px] border border-[rgba(0,0,0,0.2)] text-[#737373] text-[15px] font-normal rounded-[12px] flex items-center justify-center cursor-pointer hover:bg-[rgba(0,0,0,0.02)] active:scale-[0.99] transition-all duration-150"
              >
                Already have an account? Log in
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

export default SignupPage;
