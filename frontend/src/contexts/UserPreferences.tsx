import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface UserPreferences {
  reducedMotion: boolean;
  theme: 'light' | 'dark' | 'high-contrast';
  cardFlipBackDelay: number; // milliseconds: 1000, 2000, 3000, or 5000
}

interface UserPreferencesContextType {
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  toggleReducedMotion: () => void;
  setCardFlipBackDelay: (delay: number) => void;
}

const defaultPreferences: UserPreferences = {
  reducedMotion: false,
  theme: 'light',
  cardFlipBackDelay: 2000 // Default 2 seconds - longer than original 1 second
};

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
};

interface UserPreferencesProviderProps {
  children: ReactNode;
}

export const UserPreferencesProvider: React.FC<UserPreferencesProviderProps> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('memory-game-preferences');
    if (saved) {
      try {
        const parsedPreferences = JSON.parse(saved);
        setPreferences({ ...defaultPreferences, ...parsedPreferences });
      } catch (error) {
        console.error('Failed to parse saved preferences:', error);
      }
    }

    // Check system preference for reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches && !saved) {
      setPreferences(prev => ({ ...prev, reducedMotion: true }));
    }
  }, []);

  // Save preferences to localStorage and apply CSS variables
  useEffect(() => {
    localStorage.setItem('memory-game-preferences', JSON.stringify(preferences));
    
    // Apply CSS custom property for reduced motion
    document.documentElement.style.setProperty('--user-reduced-motion', preferences.reducedMotion ? '1' : '0');
    document.documentElement.setAttribute('data-reduced-motion', preferences.reducedMotion ? 'true' : 'false');
  }, [preferences]);

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  };

  const toggleReducedMotion = () => {
    setPreferences(prev => ({ ...prev, reducedMotion: !prev.reducedMotion }));
  };

  const setCardFlipBackDelay = (delay: number) => {
    setPreferences(prev => ({ ...prev, cardFlipBackDelay: delay }));
  };

  const value: UserPreferencesContextType = {
    preferences,
    updatePreferences,
    toggleReducedMotion,
    setCardFlipBackDelay
  };

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
};