import test from 'node:test';
import assert from 'node:assert/strict';
import { run, near } from './helpers.js';

test('DATE adds days', () => {
  const v = run('1.012024 enter 60 g chs');
  near(v.x, 3.012024, 1e-9);
  assert.equal(v.dow, 5);
});
test('ΔDYS gives actual days in X and 30/360 days in Y', () => {
  const v = run('1.012024 enter 3.012024 g eex');
  assert.deepEqual([v.x, v.y], [60, 60]);
});
test('D.MY entry (1 Mar 2024 + 60 days = 30 Apr 2024)', () =>
  near(run('g 4 1.032024 enter 60 g chs').x, 30.042024, 1e-9));
test('M.DY restores default', () => near(run('g 4 g 5 1.012024 enter 60 g chs').x, 3.012024, 1e-9));
test('invalid date is Error 8', () => assert.equal(run('2.302024 enter 5 g chs').display, 'Error 8'));
test('day-of-week is shown after DATE and cleared by the next key', () => {
  const v = run('1.012024 enter 60 g chs');
  assert.equal(v.dow, 5);
  assert.equal(run('1.012024 enter 60 g chs 5 add').dow, null);
});
