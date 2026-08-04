import { useState, useCallback, useEffect, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { FcGoogle } from 'react-icons/fc';
import { RiEyeLine, RiEyeOffLine } from 'react-icons/ri';
import { setSubmitting, setError, loginSuccess } from '@/store/slices/authSlice';
import {
  applyBackendOnboardingState,
  completeAuthNavigationAfterSync,
} from '@/features/onboarding/utils/authOnboarding';
import {
  signInWithEmail,
  requestPasswordResetEmail,
  signInWithGoogle,
  startMicrosoftSignInRedirect,
} from '@/features/auth/services/supabaseAuthService';
import AuthFieldError from '@/features/auth/components/AuthFieldError';
import AuthBrowserTipBanner from '@/features/auth/components/AuthBrowserTipBanner';
import AuthActionButton from '@/features/auth/components/AuthActionButton';
import {
  hasValidationErrors,
  validateSignInForm,
} from '@/features/auth/utils/authValidation';
import { useToast } from '@/hooks/useToast';
import clearformLogoWhite from '@/assets/clearform-logo-white.svg';
import bgImage from '@/assets/onboarding-bg.jpg';

const inputBaseClass =
  'w-full h-[40px] bg-[#fafafa] border rounded-[10px] px-[13px] text-[13px] text-[#0f0f0e] placeholder:text-[#757575] outline-none focus:bg-white transition-colors duration-150';
const inputValidClass = 'border-[rgba(81,76,84,0.15)] focus:border-[rgba(81,76,84,0.4)]';
const inputInvalidClass = 'border-[#c74e43] focus:border-[#c74e43]';

const MicrosoftIcon = memo(() => (
  <svg width="20" height="20" viewBox="0 0 21 21" fill="none" aria-hidden="true">
    <rect x="0" y="0" width="10" height="10" fill="#F25022" />
    <rect x="11" y="0" width="10" height="10" fill="#7FBA00" />
    <rect x="0" y="11" width="10" height="10" fill="#00A4EF" />
    <rect x="11" y="11" width="10" height="10" fill="#FFB900" />
  </svg>
));

const SocialButton = memo(({ children, label, onClick, disabled = false }) => (
  <motion.button
    type="button"
    aria-label={label}
    onClick={onClick}
    disabled={disabled}
    whileHover={disabled ? undefined : { scale: 1.01 }}
    whileTap={disabled ? undefined : { scale: 0.98 }}
    transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
    className="flex h-[42px] w-[54px] items-center justify-center rounded-[10px] border border-[rgba(81,76,84,0.18)] bg-white hover:bg-[#f4f4f4] cursor-pointer shadow-[0_0_0_1px_rgba(255,255,255,0.6)_inset] disabled:cursor-not-allowed disabled:opacity-60"
  >
    {children}
  </motion.button>
));

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
          value={value ?? ''}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={isPassword ? 'current-password' : name === 'email' ? 'email' : 'on'}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`${inputBaseClass} ${error ? inputInvalidClass : inputValidClass}`}
        />
        {isPassword ? (
          <button
            type="button"
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a8a6a0] hover:text-[#6b6966] transition-colors cursor-pointer p-1"
          >
            {showPassword ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
          </button>
        ) : null}
      </div>
      <AuthFieldError id={errorId} message={error} />
    </div>
  );
});

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
      <img
        src={clearformLogoWhite}
        alt="Clearform"
        width="125"
        height="35"
        className="absolute left-8 top-8 w-[125px] h-[35px] object-contain z-10"
      />
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

const SignInPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const { isSubmitting } = useSelector((state) => state.auth);
  const [formState, setFormState] = useState({ email: '', password: '' });
  const { email, password } = formState;
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const oauthError = searchParams.get('oauth_error');
    if (!oauthError) return;
    dispatch(setSubmitting(false));
    dispatch(setError(oauthError));
    showToast({ type: 'error', message: oauthError, duration: 7000 });
    const next = new URLSearchParams(searchParams);
    next.delete('oauth_error');
    setSearchParams(next, { replace: true });
  }, [dispatch, searchParams, setSearchParams, showToast]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: null } : prev));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const nextErrors = validateSignInForm({ email, password });
      setErrors(nextErrors);
      if (hasValidationErrors(nextErrors)) return;

      dispatch(setSubmitting(true));
      try {
        const user = await signInWithEmail(email.trim(), password);
        applyBackendOnboardingState(dispatch, user.onboardingCompleted);
        const path = await completeAuthNavigationAfterSync(dispatch, {
          onboardingCompleted: user.onboardingCompleted,
          isNewUser: user.isNewUser,
          returnTo: location.state?.from,
          showToast,
        });
        dispatch(loginSuccess({ email: user.email, firstName: user.firstName, lastName: user.lastName }));
        showToast({ type: 'success', message: 'Signed in successfully', duration: 3000 });
        navigate(path, { replace: true });
      } catch (err) {
        if (String(err?.message ?? '').includes('No account found')) {
          showToast({ type: 'info', message: "Account not found. Let's create one!", duration: 4000 });
          navigate('/signup');
        } else {
          dispatch(setError(err?.message ?? 'Could not sign in.'));
          setErrors({ password: err?.message ?? 'Could not sign in.' });
        }
      } finally {
        dispatch(setSubmitting(false));
      }
    },
    [dispatch, navigate, location.state, email, password, showToast],
  );

  const handleForgotPassword = useCallback(async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrors((prev) => ({ ...prev, email: 'Enter your email address first.' }));
      showToast({
        type: 'error',
        message: 'Enter your email address first.',
        duration: 4000,
      });
      return;
    }

    try {
      await requestPasswordResetEmail(trimmedEmail);
      showToast({
        type: 'success',
        message: `Password reset link sent to ${trimmedEmail}.`,
        duration: 4500,
      });
    } catch (err) {
      showToast({
        type: 'error',
        message: err?.message ?? 'Could not send password reset email.',
        duration: 4000,
      });
    }
  }, [email, showToast]);

  const handleGoogleSignIn = useCallback(async () => {
    dispatch(setSubmitting(true));
    dispatch(setError(null));
    try {
      await signInWithGoogle(location.state?.from);
    } catch (err) {
      dispatch(setError(err?.message ?? 'Could not start Google sign-in.'));
      showToast({
        type: 'error',
        message: err?.message ?? 'Could not start Google sign-in.',
        duration: 4000,
      });
      dispatch(setSubmitting(false));
    }
  }, [dispatch, location.state?.from, showToast]);

  const handleMicrosoftSignIn = useCallback(async () => {
    dispatch(setSubmitting(true));
    dispatch(setError(null));
    try {
      await startMicrosoftSignInRedirect(location.state?.from);
    } catch (err) {
      dispatch(setError(err?.message ?? 'Could not start Microsoft sign-in.'));
      showToast({
        type: 'error',
        message: err?.message ?? 'Could not start Microsoft sign-in.',
        duration: 6000,
      });
    } finally {
      dispatch(setSubmitting(false));
    }
  }, [dispatch, location.state?.from, showToast]);


  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white">
      <LeftPanel />

      <div className="flex-1 flex items-center justify-center bg-white px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full max-w-[406px] flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <h1 className="text-[22px] font-bold text-[#0f0f0e] leading-[28px]">Welcome back</h1>
            <p className="text-[14px] font-normal text-[#6b6860] leading-[20px]">
              Sign in to continue managing your forms and workflows.
            </p>
          </div>

          <AuthBrowserTipBanner />

          <form onSubmit={handleSubmit} className="flex flex-col gap-[14px]" noValidate>
            <InputField
              label="Email"
              required
              type="email"
              name="email"
              placeholder="johndoe@gmail.com"
              value={email}
              onChange={handleChange}
              error={errors.email}
            />

            <InputField
              label="Password"
              required
              type="password"
              name="password"
              placeholder="Enter your password"
              value={password}
              onChange={handleChange}
              error={errors.password}
            />

            <button
              type="button"
              onClick={handleForgotPassword}
              className="mt-[-6px] self-end text-[12.5px] font-medium text-[#757575] hover:text-[#1a1a1c] transition-colors cursor-pointer"
            >
              Forgot password?
            </button>

            <AuthActionButton
              type="submit"
              isLoading={isSubmitting}
              loadingLabel="Signing in…"
              className="w-full h-[46px] bg-black text-white text-[15px] font-semibold rounded-[12px] flex items-center justify-center cursor-pointer hover:bg-[#2c2c2e] active:scale-[0.99] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Sign In
            </AuthActionButton>

            <div className="flex items-center gap-4 py-2">
              <div className="h-px bg-[rgba(81,76,84,0.15)] flex-1" />
              <span className="text-[13px] font-medium text-[#655d67]">OR</span>
              <div className="h-px bg-[rgba(81,76,84,0.15)] flex-1" />
            </div>

            <div className="flex items-center justify-center gap-4 py-0.5">
              <SocialButton label="Continue with Google" onClick={handleGoogleSignIn} disabled={isSubmitting}>
                <FcGoogle size={22} />
              </SocialButton>
              <SocialButton label="Continue with Microsoft" onClick={handleMicrosoftSignIn} disabled={isSubmitting}>
                <MicrosoftIcon />
              </SocialButton>
            </div>

            <div className="flex flex-col gap-3 mt-1">
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="w-full h-[46px] border border-[rgba(0,0,0,0.2)] text-[#737373] text-[15px] font-normal rounded-[12px] flex items-center justify-center cursor-pointer hover:bg-[rgba(0,0,0,0.02)] active:scale-[0.99] transition-all duration-150"
              >
                Don't have an account? Sign up
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default SignInPage;
