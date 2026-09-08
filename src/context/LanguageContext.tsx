import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Language, getTranslation } from '../translations/translations';

const STORAGE_KEY = 'movie_finder_lang';

interface LanguageContextValue {
  language: Language;
  langParam: string;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const getStoredLanguage = (): Language => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'uk' || saved === 'en') {
      return saved;
    }
  } catch {
    // localStorage might be unavailable
  }
  return 'en';
};

export const getActiveLangParam = (): string => {
  return getStoredLanguage() === 'uk' ? 'uk-UA' : 'en-US';
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => getStoredLanguage());

  const isSwitchingRef = useRef<boolean>(false);
  const switchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setLanguage = useCallback(
    (newLang: Language) => {
      if (newLang === language || isSwitchingRef.current) return;
      isSwitchingRef.current = true;

      try {
        localStorage.setItem(STORAGE_KEY, newLang);
      } catch {
        // Ignore storage errors
      }

      if (switchTimeoutRef.current) clearTimeout(switchTimeoutRef.current);

      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReducedMotion) {
        setLanguageState(newLang);
        window.dispatchEvent(new CustomEvent('language_change', { detail: { language: newLang } }));
        isSwitchingRef.current = false;
        return;
      }

      // Phase 1: Soft dissolve and gentle lift of current text
      document.body.classList.remove('lang-switching-in');
      document.body.classList.add('lang-switching-out');

      switchTimeoutRef.current = setTimeout(() => {
        // Phase 2: Switch language state and land new text into crisp focus
        document.body.classList.remove('lang-switching-out');
        document.body.classList.add('lang-switching-in');

        setLanguageState(newLang);
        window.dispatchEvent(new CustomEvent('language_change', { detail: { language: newLang } }));

        switchTimeoutRef.current = setTimeout(() => {
          document.body.classList.remove('lang-switching-in');
          isSwitchingRef.current = false;
        }, 270);
      }, 110);
    },
    [language]
  );

  useEffect(() => {
    return () => {
      if (switchTimeoutRef.current) clearTimeout(switchTimeoutRef.current);
      document.body.classList.remove('lang-switching-out', 'lang-switching-in');
    };
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'uk' : 'en');
  }, [language, setLanguage]);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      return getTranslation(key, language, fallback);
    },
    [language]
  );

  const langParam = language === 'uk' ? 'uk-UA' : 'en-US';

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value: LanguageContextValue = {
    language,
    langParam,
    toggleLanguage,
    setLanguage,
    t,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextValue => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
