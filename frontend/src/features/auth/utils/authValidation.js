const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email) {
  const trimmed = (email ?? '').trim();
  if (!trimmed) return 'Email is required';
  if (!EMAIL_RE.test(trimmed)) return 'Enter a valid email address';
  return null;
}

export function validatePassword(password, { minLength = 8 } = {}) {
  if (!password) return 'Password is required';
  if (password.length < minLength) {
    return `Password must be at least ${minLength} characters`;
  }
  return null;
}

export function validateName(name, label) {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return `${label} is required`;
  if (trimmed.length < 2) return `${label} must be at least 2 characters`;
  return null;
}

export function validateSignInForm({ email, password }) {
  return {
    email: validateEmail(email),
    password: password ? null : 'Password is required',
  };
}

export function validateSignupForm({ firstName, lastName, email, password }) {
  return {
    firstName: validateName(firstName, 'First name'),
    lastName: validateName(lastName, 'Last name'),
    email: validateEmail(email),
    password: validatePassword(password),
  };
}

export function hasValidationErrors(errors) {
  return Object.values(errors).some(Boolean);
}
