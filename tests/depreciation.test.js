import test from 'node:test';
import assert from 'node:assert/strict';
import { depSL, depSOYD, depDB } from '../src/depreciation.js';
import { run, near } from './helpers.js';

const asset = { cost: 10000, salvage: 1000, life: 5, factorPct: 200 };

test('SL year 2', () => {
  const r = depSL(asset, 2);
  assert.deepEqual([r.dep, r.rdv], [1800, 5400]);
});
test('SOYD year 2', () => {
  const r = depSOYD(asset, 2);
  near(r.dep, 2400, 1e-9);
  near(r.rdv, 3600, 1e-9);
});
test('DB year 2 (200%)', () => {
  const r = depDB(asset, 2);
  near(r.dep, 2400, 1e-9);
  near(r.rdv, 2600, 1e-9);
});
test('DB never goes below salvage', () => near(depDB(asset, 5).rdv, 0, 1e-9));
test('year beyond life is Error 5', () => assert.throws(() => depSL(asset, 6), e => e.code === 5));

test('keys: SL', () => {
  const v = run('5 n 10000 pv 1000 fv 2 f pct_t');
  assert.deepEqual([v.x, v.y], [1800, 5400]);
});
test('keys: SOYD', () => near(run('5 n 10000 pv 1000 fv 2 f dpct').x, 2400, 1e-9));
test('keys: DB', () => near(run('5 n 10000 pv 1000 fv 200 i 2 f pct').x, 2400, 1e-9));
