import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

type ThemeMode = 'light' | 'dark' | 'auto';

interface AdminThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const AdminThemeContext = createContext<AdminThemeContextType | undefined>(undefined);

export const AdminThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use localStorage for faster initial load (default to light)
  const [themeMode, setThemeModeState] = useState<ThemeMode>(
    (localStorage.getItem('theme_mode') as ThemeMode) || 'light'
  );

  // Sync with DB on mount
  useEffect(() => {
    const loadPreference = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      try {
        const { theme_mode } = await api.admin.getPreferences();
        if (theme_mode) {
          setThemeModeState(theme_mode);
          localStorage.setItem('theme_mode', theme_mode);
        }
      } catch (err) {
        console.error('Failed to load admin theme preference', err);
      }
    };
    loadPreference();
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem('theme_mode', mode);
    
    // Save to DB in background
    try {
      await api.admin.updatePreferences(mode);
    } catch (err) {
      console.error('Failed to save admin theme preference', err);
    }
  };

  useEffect(() => {
    const body = window.document.body;
    
    // Always add admin-mode when this provider is active
    body.classList.add('admin-mode');
    
    // Remove classes first to avoid duplication
    body.classList.remove('light-mode', 'dark-mode', 'dark');

    const applyTheme = (mode: ThemeMode) => {
      let activeTheme = mode;
      
      if (mode === 'auto') {
        activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }

      const root = window.document.documentElement;

      if (activeTheme === 'dark') {
        body.classList.add('dark-mode', 'dark');
        root.classList.add('dark'); // Also add to html for some tailwind plugins
      } else {
        body.classList.add('light-mode');
        root.classList.remove('dark');
      }
    };

    applyTheme(themeMode);

    // Watch for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (themeMode === 'auto') {
        applyTheme('auto');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      body.classList.remove('admin-mode', 'light-mode', 'dark-mode', 'dark');
      window.document.documentElement.classList.remove('dark');
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [themeMode]);

  return (
    <AdminThemeContext.Provider value={{ themeMode, setThemeMode }}>
      <div className="admin-theme-root h-full">
        {children}
      </div>
    </AdminThemeContext.Provider>
  );
};

export const useAdminTheme = () => {
  const context = useContext(AdminThemeContext);
  if (context === undefined) {
    throw new Error('useAdminTheme must be used within an AdminThemeProvider');
  }
  return context;
};
