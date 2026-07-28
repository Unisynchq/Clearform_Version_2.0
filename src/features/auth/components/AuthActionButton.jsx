import { motion } from 'motion/react';

const AuthSpinner = () => (
  <svg className="h-[18px] w-[18px] animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const AuthActionButton = ({
  children,
  isLoading = false,
  loadingLabel,
  type = 'button',
  className = '',
  ...props
}) => (
  <motion.button
    type={type}
    disabled={isLoading || props.disabled}
    aria-busy={isLoading}
    whileHover={isLoading ? undefined : { scale: 1.01 }}
    whileTap={isLoading ? undefined : { scale: 0.98 }}
    transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
    className={className}
    {...props}
  >
    {isLoading ? (
      <span className="inline-flex items-center gap-2">
        <AuthSpinner />
        <span>{loadingLabel ?? 'Loading…'}</span>
      </span>
    ) : (
      children
    )}
  </motion.button>
);

export default AuthActionButton;
