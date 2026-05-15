export const EMPTY_PROFILE = {
  displayName: '',
  username: '',
  email: 'you@example.com',
  language: 'en',
  timezone: 'utc',
  hasPhoto: false,
  photoInitial: '',
};

export const FILLED_PROFILE = {
  displayName: 'Musharof',
  username: '@musharof',
  email: 'musharof@clearform.io',
  language: 'en',
  timezone: 'utc',
  hasPhoto: true,
  photoInitial: 'M',
};

export function profileSnapshot(p) {
  return JSON.stringify({
    displayName: p.displayName,
    username: p.username,
    email: p.email,
    language: p.language,
    timezone: p.timezone,
    hasPhoto: p.hasPhoto,
    photoInitial: p.photoInitial,
  });
}

export function isProfileComplete(p) {
  return p.displayName.trim().length >= 3;
}

export function validateProfileForm(values, { emailTaken = false } = {}) {
  const errors = {};
  const name = values.displayName.trim();
  if (name.length > 0 && name.length < 3) {
    errors.displayName = 'Must be at least 3 characters';
  }
  if (emailTaken) {
    errors.email = 'This email is already associated with another account';
  }
  return errors;
}

export function validatePasswordForm({ current, next, confirm }, { wrongPassword = false } = {}) {
  const errors = {};
  if (wrongPassword) {
    errors.current = 'Incorrect password. Try Again or Reset the Password';
  }
  if (next && next.length < 12) {
    errors.strength = 'Too weak- add numbers, symbols and uppercase letters';
  }
  if (next && confirm && next !== confirm) {
    errors.confirm = "Passwords don't match";
  }
  return errors;
}

export function passwordStrengthSegments(password) {
  if (!password) return [false, false, false, false];
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return [score >= 1, score >= 2, score >= 3, score >= 4];
}
