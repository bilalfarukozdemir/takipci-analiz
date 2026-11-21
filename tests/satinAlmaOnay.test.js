// Satın alma onayı: PURCHASED + onaysız alım onaylanır, PENDING onaylanmaz/sahiplik vermez, hata yutulmaz.
const test = require('node:test');
const assert = require('node:assert/strict');

const yukle = () => import('../src/lib/satinAlmaOnay.ts');
const A = (o) => ({ productId: 'remove_ads', purchaseState: 'purchased', isAcknowledgedAndroid: false, ...o });

test('sahiplik yalnız purchased alımdan gelir', async () => {
  const { sahiplikVarMi } = await yukle();
  assert.equal(sahiplikVarMi([A({ purchaseState: 'pending' })], 'remove_ads'), false);
  assert.equal(sahiplikVarMi([A({ productId: 'x' })], 'remove_ads'), false);
  assert.equal(sahiplikVarMi([A()], 'remove_ads'), true);
});

test('onaysız purchased alım onaylanır; onaylı ve pending atlanır', async () => {
  const { onaylanmamislariOnayla } = await yukle();
  const cagri = [];
  const liste = [A({ id: 1 }), A({ id: 2, isAcknowledgedAndroid: true }), A({ id: 3, purchaseState: 'pending' })];
  const n = await onaylanmamislariOnayla(liste, 'remove_ads', async (s) => void cagri.push(s.id));
  assert.deepEqual(cagri, [1]);
  assert.equal(n, 1);
});

test('onay hatası loglanır, atlanmaz; sonraki geçişte tekrar denenir', async () => {
  const { onaylanmamislariOnayla } = await yukle();
  const loglar = [];
  let deneme = 0;
  const onayla = async () => {
    if (++deneme === 1) throw new Error('ag');
  };
  const liste = [A()];
  assert.equal(await onaylanmamislariOnayla(liste, 'remove_ads', onayla, (h) => loglar.push(h)), 0);
  assert.equal(loglar.length, 1);
  assert.equal(await onaylanmamislariOnayla(liste, 'remove_ads', onayla, (h) => loglar.push(h)), 1);
  assert.equal(deneme, 2);
});

test('ön plan taraması en çok dakikada bir', async () => {
  const { taramaZamaniGeldiMi } = await yukle();
  assert.equal(taramaZamaniGeldiMi(1000, 0), true);
  assert.equal(taramaZamaniGeldiMi(30_000, 1000), false);
  assert.equal(taramaZamaniGeldiMi(61_000, 1000), true);
});
