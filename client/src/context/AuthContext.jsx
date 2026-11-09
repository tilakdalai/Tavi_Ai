import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [mongoUser, setMongoUser] = useState(null);
  const [idToken, setIdToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Sync user profile from backend
  const syncProfile = async (token) => {
    try {
      const { user } = await api.getUserProfile(token);
      setMongoUser(user);
      return user;
    } catch (err) {
      console.warn('[AuthContext] Backend profile sync postponed:', err.message);
      return null;
    }
  };

  useEffect(() => {
    // Restore or auto-provision local session
    const savedUserStr = localStorage.getItem('tavi_user') || localStorage.getItem('tavi_guest_user');
    let user = null;

    if (savedUserStr) {
      try {
        user = JSON.parse(savedUserStr);
      } catch {
        localStorage.removeItem('tavi_user');
        localStorage.removeItem('tavi_guest_user');
      }
    }

    // If no existing session, auto-initialize Explorer session so chat works seamlessly
    if (!user) {
      const guestUid = 'guest_' + Math.random().toString(36).substring(2, 9);
      user = {
        uid: guestUid,
        email: `${guestUid}@tavi.local`,
        displayName: 'Guest Explorer',
        photoURL: '',
        isGuest: true,
      };
      localStorage.setItem('tavi_user', JSON.stringify(user));
    }

    const token = 'tavi_token_' + user.uid;
    setCurrentUser(user);
    setIdToken(token);
    syncProfile(token).finally(() => setLoading(false));
  }, []);

  // Quick 1-Click Explorer / Direct Sign-In
  const signInWithGoogle = async () => {
    return loginAsGuest('Guest Explorer');
  };

  // Email / Name Login
  const loginWithEmail = async (email, password) => {
    setAuthError(null);
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const uid = 'usr_' + btoa(cleanEmail).replace(/=/g, '').substring(0, 16);
      const user = {
        uid,
        email: cleanEmail,
        displayName: cleanEmail.split('@')[0],
        photoURL: '',
        isGuest: false,
      };
      const token = 'tavi_token_' + uid;

      localStorage.setItem('tavi_user', JSON.stringify(user));
      setCurrentUser(user);
      setIdToken(token);
      await syncProfile(token);
    } catch (err) {
      setAuthError(err.message || 'Login failed.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Registration
  const registerWithEmail = async (email, password, displayName) => {
    setAuthError(null);
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const uid = 'usr_' + btoa(cleanEmail).replace(/=/g, '').substring(0, 16);
      const user = {
        uid,
        email: cleanEmail,
        displayName: displayName?.trim() || cleanEmail.split('@')[0],
        photoURL: '',
        isGuest: false,
      };
      const token = 'tavi_token_' + uid;

      localStorage.setItem('tavi_user', JSON.stringify(user));
      setCurrentUser(user);
      setIdToken(token);
      await syncProfile(token);
    } catch (err) {
      setAuthError(err.message || 'Registration failed.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Guest / Explorer Mode
  const loginAsGuest = async (customName = 'Guest Explorer') => {
    setLoading(true);
    setAuthError(null);
    const guestUid = 'guest_' + Math.random().toString(36).substring(2, 9);
    const guestUser = {
      uid: guestUid,
      email: `${guestUid}@tavi.local`,
      displayName: customName,
      photoURL: '',
      isGuest: true,
    };
    const token = 'tavi_token_' + guestUid;

    localStorage.setItem('tavi_user', JSON.stringify(guestUser));
    setCurrentUser(guestUser);
    setIdToken(token);
    await syncProfile(token);
    setLoading(false);
  };

  // Logout / Switch User
  const logout = async () => {
    localStorage.removeItem('tavi_user');
    localStorage.removeItem('tavi_guest_user');
    setCurrentUser(null);
    setIdToken(null);
    setMongoUser(null);
  };

  // Update Mongo User State in Context
  const updateMongoUser = (updates) => {
    setMongoUser((prev) => ({ ...prev, ...updates }));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        mongoUser,
        idToken,
        loading,
        authError,
        isConfigured: true,
        signInWithGoogle,
        loginWithEmail,
        registerWithEmail,
        loginAsGuest,
        logout,
        syncProfile,
        updateMongoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
