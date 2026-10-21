// Hicri Şemsi dönüşümü — bilinen tarihler (Nevruz ve ay başları).
const test = require('node:test');
const assert = require('node:assert/strict');
const { miladidenSemsiye } = require('../.testbuild/lib/jalali.js');

test('bilinen Miladi tarihler doğru Şemsi tarihe dönüşüyor', () => {
  assert.deepEqual(miladidenSemsiye(2024, 3, 20), [1403, 1, 1]); // Nevruz 1403
  assert.deepEqual(miladidenSemsiye(2025, 3, 21), [1404, 1, 1]); // Nevruz 1404
  assert.deepEqual(miladidenSemsiye(2024, 3, 19), [1402, 12, 29]);
  assert.deepEqual(miladidenSemsiye(2024, 9, 22), [1403, 7, 1]); // 1 Mehr
  assert.deepEqual(miladidenSemsiye(2026, 10, 22), [1405, 7, 30]);
  assert.deepEqual(miladidenSemsiye(2000, 1, 1), [1378, 10, 11]);
});
