import assert from 'node:assert/strict';
import { createCalc } from '../src/calc.js';

export const near = (a, b, tol = 0.005) =>
  assert.ok(Math.abs(a - b) <= tol, `${a} is not within ${tol} of ${b}`);

export function num(c, v) {
  for (const ch of String(Math.abs(v))) c.press(ch === '.' ? 'dot' : ch);
  if (v < 0) c.press('chs');
}

// 'seq(c, "5 enter 3 add")': numeric tokens are typed digit by digit, others are key ids.
export function seq(c, str) {
  for (const k of str.trim().split(/\s+/)) {
    if (/^-?\d+(\.\d+)?$/.test(k)) num(c, Number(k));
    else c.press(k);
  }
}

export function run(str) {
  const c = createCalc();
  seq(c, str);
  return c.view();
}
