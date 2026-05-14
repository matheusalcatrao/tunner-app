import i18next from 'https://esm.sh/i18next@25.7.3';
import LanguageDetector from 'https://esm.sh/i18next-browser-languagedetector@8.2.0';

const supportedLngs = ['en', 'pt', 'es'];

function normalizeHtmlLang(lng) {
  const base = (lng || 'en').split('-')[0] || 'en';
  if (base === 'pt') {
    return 'pt-BR';
  }
  if (base === 'es') {
    return 'es';
  }
  return 'en';
}

function syncDocumentLang(lng) {
  document.documentElement.lang = normalizeHtmlLang(lng);
}

async function loadResources() {
  const base = new URL('.', import.meta.url);
  const load = async (lng) => {
    const res = await fetch(new URL(`locales/${lng}.json`, base));
    if (!res.ok) {
      throw new Error(`Failed to load locale: ${lng}`);
    }
    return res.json();
  };

  const [en, pt, es] = await Promise.all([load('en'), load('pt'), load('es')]);

  return {
    en: { translation: en },
    pt: { translation: pt },
    es: { translation: es },
  };
}

function applyTranslations() {
  const t = i18next.t.bind(i18next);

  syncDocumentLang(i18next.resolvedLanguage || i18next.language);

  const titleEl = document.querySelector('title');
  if (titleEl) {
    titleEl.textContent = t('meta.title');
  }

  const descEl = document.querySelector('meta[name="description"]');
  if (descEl) {
    descEl.setAttribute('content', t('meta.description'));
  }

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (!key) {
      return;
    }
    el.textContent = t(key);
  });

  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    const key = el.getAttribute('data-i18n-html');
    if (!key) {
      return;
    }
    el.innerHTML = t(key);
  });

  const radiogroup = document.getElementById('lang-radiogroup');
  if (radiogroup) {
    radiogroup.setAttribute('aria-label', t('language.label'));
  }

  const resolved = (i18next.resolvedLanguage || i18next.language || 'en').split('-')[0];
  document.querySelectorAll('[data-set-lang]').forEach((btn) => {
    const code = btn.getAttribute('data-set-lang') || '';
    const active = code === resolved;
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

const resources = await loadResources();

await i18next
  .use(LanguageDetector)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs,
    load: 'languageOnly',
    nonExplicitSupportedLngs: true,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  });

i18next.on('languageChanged', applyTranslations);
applyTranslations();

document.querySelectorAll('[data-set-lang]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const lng = btn.getAttribute('data-set-lang');
    if (lng && supportedLngs.includes(lng)) {
      void i18next.changeLanguage(lng);
    }
  });
});
