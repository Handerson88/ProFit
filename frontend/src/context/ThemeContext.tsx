import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextType {
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth() || {};
  const [preference, setPreferenceState] = useState<ThemePreference>(() => {
    return (localStorage.getItem('theme_preference') as ThemePreference) || 'system';
  });

  // Sync with user profile when it loads
  useEffect(() => {
    if (user?.theme_preference && user.theme_preference !== preference) {
      setPreferenceState(user.theme_preference);
      localStorage.setItem('theme_preference', user.theme_preference);
    }
  }, [user?.theme_preference]);

  const setPreference = async (pref: ThemePreference) => {
    setPreferenceState(pref);
    localStorage.setItem('theme_preference', pref);
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await api.user.update({ theme_preference: pref });
      }
    } catch (err) {
      console.error('Failed to save theme preference to server', err);
    }
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    const applyTheme = (pref: ThemePreference) => {
      if (pref === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.add(systemTheme);
      } else {
        root.classList.add(pref);
      }
    };

    applyTheme(preference);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (preference === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [preference]);

  return (
    <ThemeContext.Provider value={{ preference, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
