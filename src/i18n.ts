import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation resources
import translationTR from './locales/tr/translation.json';
import translationEN from './locales/en/translation.json';
import translationDE from './locales/de/translation.json';

const resources = {
    tr: {
        translation: translationTR
    },
    en: {
        translation: translationEN
    },
    de: {
        translation: translationDE
    }
};

i18n
    // detect user language
    .use(LanguageDetector)
    // pass the i18n instance to react-i18next.
    .use(initReactI18next)
    // init i18next
    .init({
        resources,
        fallbackLng: 'tr', // Default to Turkish
        debug: false,
        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
        }
    });

// function to inject dynamic resources from Firestore
export const addDynamicResources = (lng: string, translations: object) => {
    i18n.addResourceBundle(lng, 'translation', translations, true, true);
};

export default i18n;
