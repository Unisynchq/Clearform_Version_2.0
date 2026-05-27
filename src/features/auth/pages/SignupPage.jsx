import { useState, useCallback, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { FcGoogle } from 'react-icons/fc';
import { RiGlobalLine, RiArrowDownSLine, RiEyeLine, RiEyeOffLine } from 'react-icons/ri';
import { setField, setSubmitting, setAuthenticated, resetForm } from '../redux/slices/authSlice';
import clearformLogo from '../assets/clearform-high-resolution-logo-transparent.png';
import bgImage from '../assets/onboarding-bg.jpg';
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

/* ─── Static sub-components (memo prevents re-renders on form typing) ─── */

const SocialButton = memo(({ children, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    className="flex items-center justify-center w-full h-[40px] bg-white border border-[rgba(81,76,84,0.15)] rounded-[10px] hover:bg-[#f4f4f4] active:scale-95 transition-all cursor-pointer gap-2 px-4"
  >
    {children}
    <span className="text-[13px] font-semibold text-[#0f0f0e]">{label}</span>
  </button>
));

const InputField = memo(({ label, required, type = 'text', placeholder, value, onChange, name }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

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
          autoComplete={isPassword ? 'current-password' : name === 'email' ? 'email' : 'given-name'}
          className="w-full h-[40px] bg-[#fafafa] border border-[rgba(81,76,84,0.15)] rounded-[10px] px-[13px] text-[13px] text-[#0f0f0e] placeholder:text-[#757575] outline-none focus:border-[rgba(81,76,84,0.4)] focus:bg-white transition-colors duration-150"
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

      {/* Logo badge */}
      <div className="absolute left-8 top-8 bg-white rounded-[10px] px-4 py-[10px] flex items-center z-10 shadow-sm">
        <img
          src={clearformLogo}
          alt="Clearform"
          width="110"
          height="28"
          className="h-[28px] w-auto object-contain"
        />
      </div>

      {/* Tagline */}
      <p className="absolute left-10 bottom-14 text-[52px] font-bold text-white leading-[60px] tracking-[-2px] w-[380px] z-10 select-none">
        Forms built for Clarity, Not just Collection.
      </p>
    </div>
  );
});

/* ─── Main page ─────────────────────────────────────────────────────────── */

const OnboardingPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false); // default to Login page
  const { firstName, lastName, email, password, isSubmitting, error } = useSelector(
    (state) => state.auth
  );

  const handleChange = useCallback((e) => {
    dispatch(setField({ field: e.target.name, value: e.target.value }));
  }, [dispatch]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    if (isSignUp && (!firstName || !lastName)) return;
    
    dispatch(setSubmitting(true));
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: `${firstName} ${lastName}`
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      dispatch(setAuthenticated(true));
      navigate('/dashboard');
    } catch (err) {
      dispatch(setField({ field: 'error', value: err.message }));
    } finally {
      dispatch(setSubmitting(false));
    }
  }, [dispatch, navigate, isSignUp, firstName, lastName, email, password]);

  const handleSocialLogin = useCallback(async (provider) => {
    dispatch(setSubmitting(true));
    try {
      await signInWithPopup(auth, provider);
      dispatch(setAuthenticated(true));
      navigate('/dashboard');
    } catch (err) {
      dispatch(setField({ field: 'error', value: err.message }));
    } finally {
      dispatch(setSubmitting(false));
    }
  }, [dispatch, navigate]);

  const handleToggleMode = useCallback(() => {
    dispatch(resetForm());
    setIsSignUp((prev) => !prev);
  }, [dispatch]);

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
              {isSignUp ? 'Create your account' : 'Log in to your account'}
            </h1>
            <p className="text-[14px] font-normal text-[#6b6860] leading-[20px]">
              Continue building forms, gathering responses, and automating your workflows.
            </p>
          </div>

          {/* Form */}
          {error && (
            <div className="p-3 bg-[#fff0ef] border border-[#f5c2c0] text-[#c74e43] rounded-[8px] text-[13px]">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-[14px]" noValidate>
            {/* Name row - only show on Sign Up */}
            {isSignUp && (
              <div className="flex items-start gap-4">
                <div className="flex flex-col gap-1 flex-1">
                  <label htmlFor="firstName" className="text-[12px] font-bold text-[#5a5a56] leading-[18px]">
                    First name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    name="firstName"
                    value={firstName}
                    onChange={handleChange}
                    placeholder="John"
                    autoComplete="given-name"
                    className="w-full h-[40px] bg-[#fafafa] border border-[#e1e0e2] rounded-[8px] px-3 text-[13px] text-[#0f0f0e] placeholder:text-[#757575] outline-none focus:border-[rgba(81,76,84,0.4)] focus:bg-white transition-colors duration-150"
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <label htmlFor="lastName" className="text-[12px] font-bold text-[#5a5a56] leading-[18px]">
                    Last name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    name="lastName"
                    value={lastName}
                    onChange={handleChange}
                    placeholder="Doe"
                    autoComplete="family-name"
                    className="w-full h-[40px] bg-[#fafafa] border border-[#e1e0e2] rounded-[8px] px-3 text-[13px] text-[#0f0f0e] placeholder:text-[#757575] outline-none focus:border-[rgba(81,76,84,0.4)] focus:bg-white transition-colors duration-150"
                  />
                </div>
              </div>
            )}

            <InputField
              label="Email" required type="email" name="email"
              placeholder="johndoe@gmail.com" value={email} onChange={handleChange}
            />

            <InputField
              label="Password" required type="password" name="password"
              placeholder="Min. 8 characters" value={password} onChange={handleChange}
            />

            {/* Social login */}
            <div className="flex items-center justify-center gap-3 py-0.5">
              <SocialButton onClick={() => handleSocialLogin(googleProvider)} label="Continue with Google">
                <FcGoogle size={22} />
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
                ) : isSignUp ? 'Create Account' : 'Log In'}
              </button>

              <button
                type="button"
                onClick={handleToggleMode}
                className="w-full h-[46px] border border-[rgba(0,0,0,0.2)] text-[#737373] text-[15px] font-normal rounded-[12px] flex items-center justify-center cursor-pointer hover:bg-[rgba(0,0,0,0.02)] active:scale-[0.99] transition-all duration-150"
              >
                {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
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
              <span className="text-[13px] text-[#655d67] leading-[20px]">English</span>
              <RiArrowDownSLine size={14} className="text-[#655d67]" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OnboardingPage;
