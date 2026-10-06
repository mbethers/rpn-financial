import test from 'node:test';
import assert from 'node:assert/strict';
import { createCalc } from '../src/calc.js';
import { createAlgebraic, evaluate } from '../src/algebraic.js';
import { seq } from './helpers.js';

const alg = str => {
  const c = createCalc();
  const a = createAlgebraic(c);
  for (const k of str.trim().split(/\s+/)) {
    if (/^\d+(\.\d+)?$/.test(k)) for (const ch of k) a.press(ch === '.' ? 'dot' : ch);
    else a.press(k);
  }
  return a;
};

test('evaluate respects precedence', () => assert.equal(evaluate([2, 3, 4], ['add', 'mul']), 14));
test('power is right associative', () => assert.equal(evaluate([2, 3, 2], ['yx', 'yx']), 512));
test('2 + 3 × 4 = 14', () => assert.equal(alg('2 add 3 mul 4 enter').view().x, 14));
test('10 ÷ 4 = 2.5', () => assert.equal(alg('10 div 4 enter').view().x, 2.5));
test('expression text', () => assert.equal(alg('5 add').view().expr, '5 +'));
test('changing the operator replaces it', () => assert.equal(alg('5 add mul').view().expr, '5 ×'));
test('divide by zero shows Error 0', () => assert.equal(alg('1 div 0 enter').view().display, 'Error 0'));
test('shifted keys still work (g + √x)', () => assert.equal(alg('9 g yx').view().x, 3));
test('financial keys pass through', () => {
  const v = alg('360 n 0.5 i 200000 pv pmt').view();
  assert.ok(Math.abs(v.x + 1199.1) < 0.01);
});
test('enter with no pending expression behaves like RPN ENTER', () => {
  const a = alg('7 enter');
  assert.equal(a.view().y, 7);
});
test('"on" clears the pending expression', () => assert.equal(alg('5 add on').view().expr, ''));
test('result can feed an RPN operation', () => {
  const a = alg('2 add 3 enter');
  a.press('recip');
  assert.equal(a.view().x, 0.2);
});
