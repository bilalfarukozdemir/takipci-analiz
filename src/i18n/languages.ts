/**
 * Desteklenen diller — tek kaynak. Yeni dil eklemek: buraya satır + aynı adla
 * `<kod>.json` + `src/i18n/index.ts` resources + `app.json` supportedLocales +
 * `plugins/withLocalizedAppName.js` adı + `index.ts`teki çoğul verisi.
 *
 * `native` dil seçicide gösterilen kendi dilindeki ad; çevrilmez.
 */
export const LANGUAGES = [
  { code: 'en', native: 'English', rtl: false },
  { code: 'tr', native: 'Türkçe', rtl: false },
  { code: 'es', native: 'Español', rtl: false },
  { code: 'pt', native: 'Português (Brasil)', rtl: false },
  { code: 'fr', native: 'Français', rtl: false },
  { code: 'de', native: 'Deutsch', rtl: false },
  { code: 'it', native: 'Italiano', rtl: false },
  { code: 'id', native: 'Bahasa Indonesia', rtl: false },
  { code: 'vi', native: 'Tiếng Việt', rtl: false },
  { code: 'hi', native: 'हिन्दी', rtl: false },
  { code: 'ar', native: 'العربية', rtl: true },
  { code: 'fa', native: 'فارسی', rtl: true },
  { code: 'ja', native: '日本語', rtl: false },
  { code: 'ko', native: '한국어', rtl: false },
] as const;

export type LangCode = (typeof LANGUAGES)[number]['code'];

export const LANG_CODES: readonly LangCode[] = LANGUAGES.map((l) => l.code);

export function isLangCode(value: unknown): value is LangCode {
  return typeof value === 'string' && (LANG_CODES as readonly string[]).includes(value);
}

export function isRtl(code: LangCode): boolean {
  return LANGUAGES.some((l) => l.code === code && l.rtl);
}
