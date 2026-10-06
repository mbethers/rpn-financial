import test from 'node:test';
import assert from 'node:assert/strict';
import { bondPrice, bondYield } from '../src/bonds.js';
import { run, near } from './helpers.js';

const settle = { year: 2008, month: 2, day: 15 };
const mat = { year: 2017, month: 11, day: 15 };

test('bond price (reference value 94.63436162)', () => {
  const r = bondPrice({ settle, mat, yieldPct: 6.5, couponPct: 5.75 });
  near(r.price, 94.63436162, 1e-5);
  near(r.accrued, 1.4375, 1e-9);
});
test('bond yield inverts price', () =>
  near(bondYield({ settle, mat, couponPct: 5.75, price: 94.63436162 }), 6.5, 1e-4));
test('settlement after maturity is Error 8', () =>
  assert.throws(() => bondPrice({ settle: mat, mat: settle, yieldPct: 6, couponPct: 5 }), e => e.code === 8));

test('keys: PRICE', () => {
  const v = run('5.75 pmt 6.5 i 2.152008 enter 11.152017 f yx');
  near(v.x, 94.63436162, 1e-4);
  near(v.y, 1.4375, 1e-6);
});
test('keys: YTM', () => near(run('5.75 pmt 94.63436162 pv 2.152008 enter 11.152017 f recip').x, 6.5, 1e-4));
test('keys: invalid date is Error 8', () =>
  assert.equal(run('5.75 pmt 6.5 i 2.302008 enter 11.152017 f yx').display, 'Error 8'));
