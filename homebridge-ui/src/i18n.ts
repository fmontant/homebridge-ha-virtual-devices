import { createI18n } from 'vue-i18n';

import de from './locales/de.json';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';

type MessageSchema = typeof en;
type SupportedLocale =
  | 'de'
  | 'en'
  | 'es'
  | 'fr';

const browserLocale =
  navigator.language.split('-')[0];

const locale: SupportedLocale =
  ['de', 'en', 'es', 'fr'].includes(
    browserLocale,
  )
    ? (browserLocale as SupportedLocale)
    : 'en';

const i18n = createI18n<
  [MessageSchema],
  SupportedLocale
>({
  legacy: false,
  locale,
  fallbackLocale: 'fr',
  messages: {
    de,
    en,
    es,
    fr,
  },
});

export default i18n;