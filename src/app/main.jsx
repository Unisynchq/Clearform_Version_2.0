import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { onIdTokenChanged } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { initSentry, Sentry } from '@/config/sentry';
import { signOutUser } from '@/features/auth/services/firebaseAuthService';
import { logout } from '@/store/slices/authSlice';
import SentryErrorFallback from '@/components/feedback/SentryErrorFallback';
import '@/styles/index.css';
import App from './App.jsx';

const sentryEnabled = initSentry();

// Keep sessionStorage token in sync with Firebase's silent refresh cycle (~1 h)
onIdTokenChanged(auth, async (user) => {
  if (user) {
    const token = await user.getIdToken();
    sessionStorage.setItem('clearform:auth-token', token);
  } else {
    sessionStorage.removeItem('clearform:auth-token');
  }
});

// Sign out and clear Redux state when any API call returns 401
window.addEventListener('clearform:auth-expired', () => {
  store.dispatch(logout());
  signOutUser();
});

const appTree = (
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);

createRoot(document.getElementById('root')).render(
  sentryEnabled ? (
    <Sentry.ErrorBoundary fallback={<SentryErrorFallback />}>
      {appTree}
    </Sentry.ErrorBoundary>
  ) : (
    appTree
  ),
);
