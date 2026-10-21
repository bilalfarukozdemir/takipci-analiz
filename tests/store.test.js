// Play mağaza metinleri — Play Console sınırları (ad 30, kısa 80, tam 4000, sürüm notu 500).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const DIR = path.join(__dirname, '..', 'store', 'listings');
const SINIR = { title: 30, short: 80, full: 4000, notes: 500 };

test('her dilde dört alan var ve Play sınırlarını aşmıyor', () => {
  const dosyalar = fs.readdirSync(DIR).filter((f) => f.endsWith('.json'));
  assert.ok(dosyalar.length >= 14);
  for (const f of dosyalar) {
    const d = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
    for (const [alan, sinir] of Object.entries(SINIR)) {
      assert.equal(typeof d[alan], 'string', `${f}: ${alan}`);
      assert.ok(d[alan].trim().length > 0, `${f}: ${alan} boş`);
      assert.ok([...d[alan]].length <= sinir, `${f}: ${alan} ${[...d[alan]].length}/${sinir}`);
    }
    // marka adı başlıkta ret sebebi (Play meta veri politikası)
    assert.ok(!/instagram/i.test(d.title), `${f}: başlıkta Instagram var`);
  }
});
