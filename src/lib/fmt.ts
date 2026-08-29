import i18n from '../i18n';

const pad = (n: number) => (n < 10 ? `0${n}` : String(n));

function aylar(): string[] {
  // returnObjects:true ile i18next diziyi olduğu gibi döndürür
  return i18n.t('fmt.months', { returnObjects: true }) as string[];
}

/** 1699999999 (saniye) -> "12 Ağu 2024" */
export function tarih(unixSeconds?: number): string {
  if (!unixSeconds) return '';
  const d = new Date(unixSeconds * 1000);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getDate()} ${aylar()[d.getMonth()]} ${d.getFullYear()}`;
}

/** ms -> "12 Ağu 2024 · 14:05" */
export function tarihSaat(unixMs: number): string {
  const d = new Date(unixMs);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getDate()} ${aylar()[d.getMonth()]} ${d.getFullYear()} · ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

/** "3 gün önce" */
export function goreceli(unixMs: number): string {
  const fark = Date.now() - unixMs;
  const dk = Math.floor(fark / 60000);
  if (dk < 1) return i18n.t('fmt.justNow');
  if (dk < 60) return i18n.t('fmt.minutesAgo', { count: dk });
  const sa = Math.floor(dk / 60);
  if (sa < 24) return i18n.t('fmt.hoursAgo', { count: sa });
  const gun = Math.floor(sa / 24);
  if (gun < 30) return i18n.t('fmt.daysAgo', { count: gun });
  const ay = Math.floor(gun / 30);
  if (ay < 12) return i18n.t('fmt.monthsAgo', { count: ay });
  return i18n.t('fmt.yearsAgo', { count: Math.floor(ay / 12) });
}

/** 12345 -> "12.345" */
export function sayi(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
