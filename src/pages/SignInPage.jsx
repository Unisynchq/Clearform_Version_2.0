import { useState, useCallback, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { FcGoogle } from 'react-icons/fc';
import { RiGlobalLine, RiArrowDownSLine, RiAppleFill, RiEyeLine, RiEyeOffLine } from 'react-icons/ri';
import { setField, setSubmitting, setAuthenticated } from '../redux/slices/authSlice';
import clearformLogo from '../assets/clearform-high-resolution-logo-transparent.png';
import AuthLeftPanel from '../components/auth/AuthLeftPanel';

/* ─── Static sub-components ─── */

const SocialButton = memo(({ children, label }) => (
  <motion.button
    type="button"
    aria-label={label}
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.96 }}
    transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
    className="flex items-center justify-center w-[58px] h-[40px] bg-white border border-[rgba(81,76,84,0.15)] rounded-[10px] hover:bg-[#f4f4f4] cursor-pointer"
  >
    {children}
  </motion.button>
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
          autoComplete={isPassword ? 'current-password' : name === 'email' ? 'email' : 'on'}
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

/* ─── Left panel ─── */

/* ─── Main page ─── */

const SignInPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { email, password, isSubmitting } = useSelector((state) => state.auth);

  const handleChange = useCallback((e) => {
    dispatch(setField({ field: e.target.name, value: e.target.value }));
  }, [dispatch]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    dispatch(setSubmitting(true));
    setTimeout(() => {
      dispatch(setSubmitting(false));
      dispatch(setAuthenticated(true));
      navigate('/dashboard');
    }, 1000);
  }, [dispatch, navigate]);

  return (
    <div className="flex min-h-dvh w-full overflow-hidden bg-white">

      <AuthLeftPanel />

      {/* ── Right panel ── */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-white">
        <div className="flex shrink-0 items-center justify-center border-b border-[rgba(81,76,84,0.1)] px-4 py-4 lg:hidden">
          <img src={clearformLogo} alt="Clearform" className="h-8 w-auto object-contain" />
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex w-full min-w-0 max-w-[406px] flex-col gap-5"
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
            />

            <PasswordField value={password} onChange={handleChange} />

            {/* Social login */}
            <div className="flex items-center justify-center gap-3 py-0.5">
              <SocialButton label="Continue with Google"><FcGoogle size={22} /></SocialButton>
              <SocialButton label="Continue with Apple">
                <RiAppleFill size={22} className="text-[#0f0f0e]" />
              </SocialButton>
            </div>

            {/* CTA */}
            <div className="mt-1 flex flex-col gap-4 border-t border-[rgba(81,76,84,0.12)] pt-5">
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={isSubmitting ? undefined : { scale: 1.01 }}
                whileTap={isSubmitting ? undefined : { scale: 0.99 }}
                transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
                className="flex h-[48px] w-full cursor-pointer items-center justify-center rounded-[12px] bg-[#0f0f0e] text-[15px] font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.08)] transition-colors duration-150 hover:bg-[#2c2c2e] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <svg className="h-[18px] w-[18px] animate-spin" viewBox="0 0 24 24" fill="none" aria-label="Loading">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  'Sign in'
                )}
              </motion.button>

              <p className="text-center text-[13.5px] leading-[20px] text-[#6b6860]">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="font-semibold text-[#0f0f0e] underline decoration-[rgba(15,15,14,0.35)] underline-offset-[3px] transition-colors hover:text-[#2c2c2e] hover:decoration-[#0f0f0e]"
                >
                  Sign up
                </button>
              </p>
            </div>
          </form>

          {/* Footer */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-[13px] text-[#4c414e] leading-[20px]">Have a question?</span>
              <button
                type="button"
                onClick={() => navigate('/dashboard/help#get-in-touch')}
                className="cursor-pointer text-[13px] text-[#3c323e] leading-[20px] underline transition-colors hover:text-[#1a1a1c]"
              >
                Contact us
              </button>
            </div>
            <button type="button" className="flex h-[30px] shrink-0 cursor-pointer items-center gap-1.5 self-start rounded-[8px] border border-[rgba(81,76,84,0.15)] px-3 hover:bg-[#f4f3ef] transition-colors duration-150 sm:self-auto">
              <RiGlobalLine size={14} className="text-[#655d67]" />
              <span className="text-[13px] text-[#655d67] leading-[20px]">English</span>
              <RiArrowDownSLine size={14} className="text-[#655d67]" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  </div>
  );
};

/* ─── Password field with inline "Forgot password?" link ─── */

const PasswordField = memo(({ value, onChange }) => {
  const [showPassword, setShowPassword] = useState(false);

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
          className="w-full h-[40px] bg-[#fafafa] border border-[rgba(81,76,84,0.15)] rounded-[10px] px-[13px] pr-10 text-[13px] text-[#0f0f0e] placeholder:text-[#757575] outline-none focus:border-[rgba(81,76,84,0.4)] focus:bg-white transition-colors duration-150"
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
    </div>
  );
});

export default SignInPage;
