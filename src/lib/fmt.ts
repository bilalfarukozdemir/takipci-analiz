const AYLAR = [
  'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
  'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara',
];

const pad = (n: number) => (n < 10 ? `0${n}` : String(n));

/** 1699999999 (saniye) -> "12 Ağu 2024" */
export function tarih(unixSeconds?: number): string {
  if (!unixSeconds) return '';
  const d = new Date(unixSeconds * 1000);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getDate()} ${AYLAR[d.getMonth()]} ${d.getFullYear()}`;
}

/** ms -> "12 Ağu 2024 · 14:05" */
export function tarihSaat(unixMs: number): string {
  const d = new Date(unixMs);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getDate()} ${AYLAR[d.getMonth()]} ${d.getFullYear()} · ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

/** "3 gün önce" */
export function goreceli(unixMs: number): string {
  const fark = Date.now() - unixMs;
  const dk = Math.floor(fark / 60000);
  if (dk < 1) return 'az önce';
  if (dk < 60) return `${dk} dakika önce`;
  const sa = Math.floor(dk / 60);
  if (sa < 24) return `${sa} saat önce`;
  const gun = Math.floor(sa / 24);
  if (gun < 30) return `${gun} gün önce`;
  const ay = Math.floor(gun / 30);
  if (ay < 12) return `${ay} ay önce`;
  return `${Math.floor(ay / 12)} yıl önce`;
}

/** 12345 -> "12.345" */
export function sayi(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
