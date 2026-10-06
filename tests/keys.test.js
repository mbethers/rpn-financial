import test from 'node:test';
import assert from 'node:assert/strict';
import { KEYS } from '../src/keys.js';
import { createCalc } from '../src/calc.js';

const IDS = 'n i pv pmt fv chs 0 1 2 3 4 5 6 7 8 9 dot div yx recip pct_t dpct pct eex mul rs sst rdown xy clx enter sub on f g sto rcl sigma add'.split(' ');

test('keypad has the 39 keys, each once', () => {
  assert.equal(KEYS.length, 39);
  assert.deepEqual([...KEYS.map(k => k.id)].sort(), [...IDS].sort());
});
test('every key has a face and three help strings', () => {
  for (const k of KEYS) {
    assert.ok(k.face, k.id);
    assert.equal(k.help.length, 3, k.id);
  }
});
test('every key id is accepted by the engine without throwing', () => {
  for (const k of KEYS) {
    const c = createCalc();
    c.press(k.id);
    c.press('f'); c.press(k.id);
    c.press('g'); c.press(k.id);
  }
});
