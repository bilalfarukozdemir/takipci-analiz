import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import {
  getLanguagePreference,
  type LanguagePreference,
  setLanguagePreference,
} from '../lib/storage';
import en from './en.json';
import tr from './tr.json';

export type { LanguagePreference };

/** Cihazın sistem dili tr değilse en'e düşülür (plan: A-2.4). */
function deviceLanguage(): 'tr' | 'en' {
  const locales = Localization.getLocales();
  return locales[0]?.languageCode === 'tr' ? 'tr' : 'en';
}

/** 'system' tercihini gerçek bir dile ('tr' | 'en') çevirir. */
export function resolveLanguage(pref: LanguagePreference): 'tr' | 'en' {
  if (pref === 'tr' || pref === 'en') return pref;
  return deviceLanguage();
}

let started = false;

/** Uygulama açılışında bir kez çağrılır; kayıtlı tercihi okuyup i18next'i başlatır. */
export async function initI18n(): Promise<void> {
  const pref = await getLanguagePreference();
  const lng = resolveLanguage(pref);

  if (!started) {
    await i18n.use(initReactI18next).init({
      resources: {
        tr: { translation: tr },
        en: { translation: en },
      },
      lng,
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
      returnObjects: true,
    });
    started = true;
  } else {
    await i18n.changeLanguage(lng);
  }
}

/** Dil seçiciden çağrılır: tercihi kalıcı depoya yazar ve anlık dili değiştirir. */
export async function changeLanguagePreference(pref: LanguagePreference): Promise<void> {
  await setLanguagePreference(pref);
  await i18n.changeLanguage(resolveLanguage(pref));
}

export { getLanguagePreference };
export default i18n;
