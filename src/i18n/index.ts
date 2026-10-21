import { reloadAppAsync } from 'expo';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';

import {
  getLanguagePreference,
  getRtlReloadAt,
  type LanguagePreference,
  setLanguagePreference,
  setRtlReloadAt,
} from '../lib/storage';
import ar from './ar.json';
import de from './de.json';
import en from './en.json';
import es from './es.json';
import fa from './fa.json';
import fr from './fr.json';
import hi from './hi.json';
import id from './id.json';
import it from './it.json';
import ja from './ja.json';
import ko from './ko.json';
import { isLangCode, isRtl, type LangCode } from './languages';
import pt from './pt.json';
import tr from './tr.json';
import vi from './vi.json';

export type { LanguagePreference };

const RESOURCES: Record<LangCode, object> = { en, tr, es, pt, fr, de, it, id, vi, hi, ar, fa, ja, ko };

/** Telefonun tercih ettiği dillerden desteklenen ilki; hiçbiri yoksa en. */
function deviceLanguage(): LangCode {
  for (const l of Localization.getLocales()) {
    if (isLangCode(l.languageCode)) return l.languageCode;
  }
  return 'en';
}

/** 'system' tercihini gerçek bir dile çevirir. */
export function resolveLanguage(pref: LanguagePreference): LangCode {
  return pref === 'system' ? deviceLanguage() : pref;
}

/**
 * Arayüz yönünü dile uydurur. React Native yönü yalnız açılışta okur; değişmesi
 * gerekiyorsa tercih yazılır ve uygulama yeniden yüklenir.
 */
async function yonuEsitle(lng: LangCode): Promise<void> {
  const rtl = isRtl(lng);
  if (I18nManager.isRTL === rtl) return;
  I18nManager.allowRTL(rtl);
  I18nManager.forceRTL(rtl);
  // yön tutmazsa sonsuz yeniden yükleme olmasın: 20 sn içinde ikinci kez yükleme yok
  if (Date.now() - (await getRtlReloadAt()) < 20_000) return;
  await setRtlReloadAt(Date.now());
  await reloadAppAsync('layout direction changed').catch(() => undefined);
}

let started = false;

/** Uygulama açılışında bir kez çağrılır; kayıtlı tercihi okuyup i18next'i başlatır. */
export async function initI18n(): Promise<void> {
  const pref = await getLanguagePreference();
  const lng = resolveLanguage(pref);

  if (!started) {
    await i18n.use(initReactI18next).init({
      resources: Object.fromEntries(
        Object.entries(RESOURCES).map(([k, v]) => [k, { translation: v }])
      ),
      lng,
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
      returnObjects: true,
    });
    started = true;
  } else {
    await i18n.changeLanguage(lng);
  }
  await yonuEsitle(lng);
}

/** Dil seçiciden çağrılır: tercihi kalıcı depoya yazar ve anlık dili değiştirir. */
export async function changeLanguagePreference(pref: LanguagePreference): Promise<void> {
  await setLanguagePreference(pref);
  const lng = resolveLanguage(pref);
  await i18n.changeLanguage(lng);
  await yonuEsitle(lng);
}

/** Uygulama öne gelince: 'system' tercihinde telefonun dili değişmiş olabilir. */
export async function syncSystemLanguage(): Promise<void> {
  if (!started || (await getLanguagePreference()) !== 'system') return;
  const lng = deviceLanguage();
  if (i18n.language !== lng) await i18n.changeLanguage(lng);
  await yonuEsitle(lng);
}

export { getLanguagePreference };
export default i18n;
