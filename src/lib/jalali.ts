/**
 * Miladi → Hicri Şemsi (İran takvimi) dönüşümü. Farsça arayüzde tarihler bu
 * takvimle gösterilir. Bilinen 33 yıllık döngü algoritması; 1 Farvardin 1403 =
 * 20 Mart 2024.
 */
const GUN_ONCESI = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

/** ay 1–12; dönüş [yıl, ay (1–12), gün]. */
export function miladidenSemsiye(gy: number, gm: number, gd: number): [number, number, number] {
  const gy2 = gm > 2 ? gy + 1 : gy;
  let gun =
    355666 +
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd +
    GUN_ONCESI[gm - 1];
  let jy = -1595 + 33 * Math.floor(gun / 12053);
  gun %= 12053;
  jy += 4 * Math.floor(gun / 1461);
  gun %= 1461;
  if (gun > 365) {
    jy += Math.floor((gun - 1) / 365);
    gun = (gun - 1) % 365;
  }
  const jm = gun < 186 ? 1 + Math.floor(gun / 31) : 7 + Math.floor((gun - 186) / 30);
  const jd = 1 + (gun < 186 ? gun % 31 : (gun - 186) % 30);
  return [jy, jm, jd];
}
