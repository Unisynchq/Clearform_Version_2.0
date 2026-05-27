import React, { createContext, useContext, useEffect, useState } from 'react';
import { onIdTokenChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';

const AuthContext = createContext({
  user: null,
  loading: true,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          sessionStorage.setItem('clearform:auth-token', token);
        } catch (err) {
          console.error('Error fetching Firebase ID token:', err);
          sessionStorage.removeItem('clearform:auth-token');
        }
      } else {
        sessionStorage.removeItem('clearform:auth-token');
      }
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
