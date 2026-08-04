import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'motion/react';
import { RiEyeLine, RiEyeOffLine } from 'react-icons/ri';
import { setSubmitting, setError } from '@/store/slices/authSlice';
import {
  establishPasswordRecoverySession,
  resetPasswordWithToken,
  syncPasswordWithBackend,
} from '@/features/auth/services/supabaseAuthService';
import { supabase } from '@/config/supabase';
import AuthFieldError from '@/features/auth/components/AuthFieldError';
import { hasValidationErrors, validateResetPasswordForm } from '@/features/auth/utils/authValidation';
import { useToast } from '@/hooks/useToast';
import clearformLogoWhite from '@/assets/clearform-logo-white.svg';
import bgImage from '@/assets/onboarding-bg.jpg';

const inputBaseClass =
  'w-full h-[40px] bg-[#fafafa] border rounded-[10px] px-[13px] text-[13px] text-[#0f0f0e] placeholder:text-[#757575] outline-none focus:bg-white transition-colors duration-150';
const inputValidClass = 'border-[rgba(81,76,84,0.15)] focus:border-[rgba(81,76,84,0.4)]';
const inputInvalidClass = 'border-[#c74e43] focus:border-[#c74e43]';

const InputField = ({ label, required, type = 'text', placeholder, value, onChange, name, error }) => {
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
          autoComplete={isPassword ? 'new-password' : 'off'}
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
};

const LeftPanel = () => (
  <div className="w-[540px] shrink-0 relative bg-white overflow-hidden">
    <div className="absolute left-4 top-4 bottom-4 right-0 rounded-[20px] bg-[linear-gradient(160deg,#1a0a0a_0%,#6b0f0f_45%,#1a0505_100%)]" />
    <div className="absolute left-4 top-4 bottom-4 right-0 rounded-[20px] overflow-hidden">
      <img
        src={bgImage}
        alt=""
        role="presentation"
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover opacity-100"
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
    <p className="absolute left-10 bottom-14 text-[52px] font-bold text-white leading-[60px] tracking-[-2px] w-[380px] z-10 select-none">
      Reset your password and get back to work.
    </p>
  </div>
);

const ResetPasswordPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isSubmitting } = useSelector((state) => state.auth);
  const [formState, setFormState] = useState({ password: '', confirmPassword: '' });
  const { password, confirmPassword } = formState;
  const [errors, setErrors] = useState({});
  const [isDone, setIsDone] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ok = await establishPasswordRecoverySession();
        if (cancelled) return;
        if (!ok) {
          setSessionError(
            'This reset link is invalid or has expired. Request a new reset email and open it in the same browser, or sign in and set a password from Profile → Security.',
          );
          setSessionReady(false);
          return;
        }
        setSessionError(null);
        setSessionReady(true);
      } catch (err) {
        if (cancelled) return;
        // Last chance: user may already be signed in (Google/Microsoft) even if PKCE failed.
        try {
          const { data } = await supabase?.auth.getSession();
          if (!cancelled && data?.session?.user) {
            setSessionError(null);
            setSessionReady(true);
            return;
          }
        } catch {
          // ignore
        }
        setSessionError(
          err?.message ??
            'Could not open the password reset link. Sign in and set a password from Profile → Security, or request a new reset email.',
        );
        setSessionReady(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: null } : prev));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!sessionReady) {
        setErrors({
          form: sessionError ?? 'Reset session is not ready. Request a new reset link.',
        });
        return;
      }
      const nextErrors = validateResetPasswordForm({ password, confirmPassword });
      setErrors(nextErrors);
      if (hasValidationErrors(nextErrors)) return;
      dispatch(setSubmitting(true));
      try {
        await resetPasswordWithToken(password);
        try {
          await syncPasswordWithBackend({ newPassword: password });
        } catch {
          // Supabase password already updated; backend sync is best-effort for hasPassword.
        }
        setIsDone(true);
        showToast({
          type: 'success',
          message: 'Password reset successfully. You can sign in now.',
          duration: 4000,
        });
        navigate('/signin', { replace: true });
      } catch (err) {
        dispatch(setError(err?.message ?? 'Could not reset your password.'));
        setErrors({ form: err?.message ?? 'Could not reset your password.' });
      } finally {
        dispatch(setSubmitting(false));
      }
    },
    [dispatch, navigate, password, confirmPassword, showToast, sessionReady, sessionError],
  );

  const subtitle = useMemo(() => {
    if (isDone) return 'Your password has been updated.';
    if (sessionError) return 'We could not verify your reset link.';
    if (!sessionReady) return 'Verifying your reset link…';
    return 'Choose a new password for your account.';
  }, [isDone, sessionError, sessionReady]);

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
            <h1 className="text-[22px] font-bold text-[#0f0f0e] leading-[28px]">
              Reset password
            </h1>
            <p className="text-[14px] font-normal text-[#6b6860] leading-[20px]">
              {subtitle}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-[14px]" noValidate>
            {sessionError || errors.form ? (
              <div className="rounded-[10px] border border-[#fed7d7] bg-[#fff5f5] px-3 py-2 text-[13px] text-[#c53030]">
                {sessionError || errors.form}
              </div>
            ) : null}

            <InputField
              label="New password"
              required
              type="password"
              name="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={handleChange}
              error={errors.password}
            />

            <InputField
              label="Confirm new password"
              required
              type="password"
              name="confirmPassword"
              placeholder="Re-enter your new password"
              value={confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
            />

            <button
              type="submit"
              disabled={isSubmitting || !sessionReady}
              className="w-full h-[46px] bg-black text-white text-[15px] font-semibold rounded-[12px] flex items-center justify-center cursor-pointer hover:bg-[#2c2c2e] active:scale-[0.99] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Updating...' : 'Set new password'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/signin')}
              className="w-full h-[46px] border border-[rgba(0,0,0,0.2)] text-[#737373] text-[15px] font-normal rounded-[12px] flex items-center justify-center cursor-pointer hover:bg-[rgba(0,0,0,0.02)] active:scale-[0.99] transition-all duration-150"
            >
              Back to sign in
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
