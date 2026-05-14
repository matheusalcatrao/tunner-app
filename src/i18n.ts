import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import { Platform } from 'react-native';

import en from './locales/en.json';
import es from './locales/es.json';
import pt from './locales/pt.json';

export const supportedLanguages = ['en', 'pt', 'es'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

const resources = {
  en: { translation: en },
  pt: { translation: pt },
  es: { translation: es },
} as const;

function normalizeHtmlLang(lng: string): string {
  const base = lng.split('-')[0] ?? 'en';
  if (base === 'pt') {
    return 'pt-BR';
  }
  if (base === 'es') {
    return 'es';
  }
  return 'en';
}

function syncDocumentLang(lng: string): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    return;
  }
  document.documentElement.lang = normalizeHtmlLang(lng);
}

const detection =
  Platform.OS === 'web'
    ? {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
        lookupLocalStorage: 'i18nextLng',
      }
    : {
        order: ['navigator'],
        caches: [],
      };

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: [...supportedLanguages],
    load: 'languageOnly',
    nonExplicitSupportedLngs: true,
    interpolation: {
      escapeValue: false,
    },
    detection,
    react: {
      useSuspense: false,
    },
  })
  .then(() => {
    syncDocumentLang(i18n.resolvedLanguage ?? i18n.language);
  })
  .catch(() => {
    syncDocumentLang('en');
  });

i18n.on('languageChanged', (lng) => {
  syncDocumentLang(lng);
});

export default i18n;
