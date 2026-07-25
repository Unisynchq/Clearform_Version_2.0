import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { isFirebaseConfigured } from '@/config/env';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let auth = null;
let googleProvider = null;
let microsoftProvider = null;

if (isFirebaseConfigured()) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();

  microsoftProvider = new OAuthProvider('microsoft.com');
  microsoftProvider.setCustomParameters({ prompt: 'login' });
  microsoftProvider.addScope('email');
  microsoftProvider.addScope('profile');
}

export { auth, googleProvider, microsoftProvider };

/** Canonical HTTPS origin for Firebase redirect (must match VITE_FIREBASE_AUTH_DOMAIN). */
export function getFirebaseAuthOrigin() {
  const raw = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  if (!raw || typeof raw !== 'string') return null;
  const host = raw.replace(/^https?:\/\//, '').replace(/\/$/, '');
  return host ? `https://${host}` : null;
}
