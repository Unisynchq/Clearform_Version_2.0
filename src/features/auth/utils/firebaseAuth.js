import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

const FIREBASE_ERROR_MESSAGES = {
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/wrong-password': 'Incorrect password.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/email-already-in-use': 'An account already exists with this email.',
  'auth/weak-password': 'Password must be at least 8 characters.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/too-many-requests': 'Too many attempts. Try again later.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/cancelled-popup-request': 'Sign-in was cancelled.',
  'auth/account-exists-with-different-credential':
    'An account already exists with a different sign-in method.',
};

export function mapFirebaseAuthError(error) {
  const code = error?.code ?? '';
  return FIREBASE_ERROR_MESSAGES[code] ?? error?.message ?? 'Something went wrong. Please try again.';
}

export function profileFromFirebaseUser(user) {
  const displayName = (user?.displayName ?? '').trim();
  const parts = displayName ? displayName.split(/\s+/) : [];
  return {
    email: user?.email ?? '',
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  };
}

export async function signInWithEmail(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function signUpWithEmail(email, password, displayName) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName?.trim()) {
    await updateProfile(credential.user, { displayName: displayName.trim() });
  }
  return credential.user;
}

export async function signInWithGoogle() {
  const credential = await signInWithPopup(auth, googleProvider);
  return credential.user;
}

export async function signOutFirebase() {
  await signOut(auth);
}
