'use client';
import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import en from '@/locales/en.json';
import tr from '@/locales/tr.json';

type Locale = 'en' | 'tr';

const translations = { en, tr };

// Helper function to get nested keys
const getNestedValue = (obj: any, keys: string[]) => {
  return keys.reduce((acc, key) => (acc && acc[key] !== 'undefined' ? acc[key] : undefined), obj);
}

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, values?: Record<string, any>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocale] = useState<Locale>('tr'); // Default to Turkish

   useEffect(() => {
    if (typeof window !== 'undefined') {
        const storedLocale = localStorage.getItem('locale') as Locale;
        if (storedLocale && (storedLocale === 'en' || storedLocale === 'tr')) {
            setLocale(storedLocale);
        } else {
             // If no locale is stored, detect browser language
            const browserLang = navigator.language.split('-')[0] as Locale;
            if (browserLang === 'tr') {
                setLocale('tr');
            } else {
                // Default to English for any other language
                setLocale('en');
            }
        }
    }
  }, []);

  const handleSetLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    if (typeof window !== 'undefined') {
        localStorage.setItem('locale', newLocale);
        document.documentElement.lang = newLocale;
    }
  };


  const t = useCallback((key: string, values?: Record<string, any>): string => {
    const keys = key.split('.');
    
    let result = getNestedValue(translations[locale], keys);

    if (result === undefined) {
      // Fallback to English if translation is missing in the current locale
      result = getNestedValue(translations.en, keys);
    }
    
    if (result === undefined) {
      console.warn(`Translation not found for key: ${key}`);
      return key; // Return the key itself as a last resort
    }

    if (typeof result === 'string' && values) {
      return Object.entries(values).reduce(
        (str, [valKey, val]) => str.replace(`{${valKey}}`, val),
        result
      );
    }

    return result || key;
  }, [locale]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale]);


  return (
    <LanguageContext.Provider value={{ locale, setLocale: handleSetLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
