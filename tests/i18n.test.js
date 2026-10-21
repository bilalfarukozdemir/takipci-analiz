// Dil dosyaları tutarlılık testi — bağımlılıksız Node (node --test).
// Her dil en.json ile aynı anahtarları, aynı {{değişkenleri}} ve aynı dizi
// uzunluklarını taşımalı; çoğul anahtarlarında o dilin CLDR kategorilerinin
// (uygulamadaki @formatjs polyfill'iyle aynı veri) hepsi ve yalnızca onlar olmalı.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const DIR = path.join(__dirname, '..', 'src', 'i18n');
const LANGS_TS = fs.readFileSync(path.join(DIR, 'languages.ts'), 'utf8');
const KODLAR = [...LANGS_TS.matchAll(/code: '([a-z]{2})'/g)].map((m) => m[1]);
const PLURAL = /_(zero|one|two|few|many|other)$/;
// Cümle parçaları: sözcük sırası dile göre değiştiği için bazı dillerde boş kalabilir.
const BOS_OLABILIR = new Set([
  'home.compareWith',
  'home.compareWithSuffix',
  'home.needSecondUploadPre',
  'home.needSecondUploadPost',
  'history.howItWorks.pre',
  'history.howItWorks.mid',
  'history.howItWorks.post',
]);

const oku = (kod) => JSON.parse(fs.readFileSync(path.join(DIR, `${kod}.json`), 'utf8'));

/** { 'a.b.c': değer } — diziler tek yaprak sayılır. */
function duzlestir(o, onek = '', out = {}) {
  for (const [k, v] of Object.entries(o)) {
    const yol = onek ? `${onek}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) duzlestir(v, yol, out);
    else out[yol] = v;
  }
  return out;
}

const degiskenler = (s) => [...String(s).matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).sort();

/** Dizilerde de her metnin değişkenleri; nesne dizisi (adımlar, SSS) alan alan. */
function metinler(v) {
  if (Array.isArray(v)) return v.flatMap((x) => (x && typeof x === 'object' ? Object.values(x) : [x]));
  return [v];
}

async function kategoriler() {
  await import('@formatjs/intl-pluralrules/polyfill-force.js');
  const out = {};
  for (const kod of KODLAR) {
    await import(`@formatjs/intl-pluralrules/locale-data/${kod}.js`);
    out[kod] = new Intl.PluralRules(kod).resolvedOptions().pluralCategories.slice().sort();
  }
  return out;
}

const en = duzlestir(oku('en'));
const tabanlar = (duz) => new Set(Object.keys(duz).map((k) => k.replace(PLURAL, '')));
const EN_TABAN = tabanlar(en);
const COGUL_TABAN = new Set(Object.keys(en).filter((k) => PLURAL.test(k)).map((k) => k.replace(PLURAL, '')));

test('languages.ts 14 dil listeliyor ve hepsinin dosyası var', () => {
  assert.equal(KODLAR.length, 14);
  for (const kod of KODLAR) assert.ok(fs.existsSync(path.join(DIR, `${kod}.json`)), kod);
});

test('her dil aynı anahtarları, değişkenleri, dizi uzunluklarını ve çoğul biçimlerini taşıyor', async () => {
  const kat = await kategoriler();
  for (const kod of KODLAR) {
    const duz = duzlestir(oku(kod));
    const taban = tabanlar(duz);
    const eksik = [...EN_TABAN].filter((k) => !taban.has(k));
    const fazla = [...taban].filter((k) => !EN_TABAN.has(k));
    assert.deepEqual(eksik, [], `${kod}: eksik anahtar`);
    assert.deepEqual(fazla, [], `${kod}: fazla anahtar`);

    for (const [k, v] of Object.entries(duz)) {
      const t = k.replace(PLURAL, '');
      const enDeger = COGUL_TABAN.has(t) ? en[`${t}_other`] : en[k];
      if (Array.isArray(enDeger)) {
        assert.ok(Array.isArray(v), `${kod}: ${k} dizi olmalı`);
        assert.equal(v.length, enDeger.length, `${kod}: ${k} uzunluğu`);
        metinler(v).forEach((m, i) =>
          assert.deepEqual(degiskenler(m), degiskenler(metinler(enDeger)[i]), `${kod}: ${k}[${i}] değişken`)
        );
      } else {
        assert.equal(typeof v, 'string', `${kod}: ${k} metin olmalı`);
        if (!BOS_OLABILIR.has(k)) assert.ok(v.length > 0, `${kod}: ${k} boş`);
        // _one biçimi sayıyı yazmayabilir (ör. "1 hesap" yerine "bir hesap"); count dışındakiler tam olmalı
        const beklenen = degiskenler(enDeger);
        const gercek = degiskenler(v);
        if (COGUL_TABAN.has(t)) {
          assert.deepEqual(
            gercek.filter((x) => x !== 'count' && x !== 'n'),
            beklenen.filter((x) => x !== 'count' && x !== 'n'),
            `${kod}: ${k} değişken`
          );
        } else {
          assert.deepEqual(gercek, beklenen, `${kod}: ${k} değişken`);
        }
      }
    }

    for (const t of COGUL_TABAN) {
      const var_ = Object.keys(duz)
        .filter((k) => k.replace(PLURAL, '') === t && PLURAL.test(k))
        .map((k) => k.match(PLURAL)[1])
        .sort();
      assert.deepEqual(var_, kat[kod], `${kod}: ${t} çoğul biçimleri`);
    }
  }
});

test('çoğul _other biçimi sayıyı gösteriyor', () => {
  for (const kod of KODLAR) {
    const duz = duzlestir(oku(kod));
    for (const t of COGUL_TABAN) {
      const v = duz[`${t}_other`];
      assert.ok(/\{\{(count|n)\}\}/.test(v), `${kod}: ${t}_other sayıyı içermeli`);
    }
  }
});
