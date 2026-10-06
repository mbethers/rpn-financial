import { CalcError } from './errors.js';
import { toSerial, days360, addMonths } from './dates.js';

function schedule(settle, mat) {
  if (toSerial(settle) >= toSerial(mat)) throw new CalcError(8);
  let k = 0;
  while (toSerial(addMonths(mat, -6 * k)) > toSerial(settle)) k++;
  return { prev: addMonths(mat, -6 * k), next: addMonths(mat, -6 * (k - 1)), n: k };
}

export function bondPrice({ settle, mat, yieldPct, couponPct }) {
  const { prev, next, n } = schedule(settle, mat);
  const a = days360(prev, settle);
  const e = days360(prev, next);
  const t = (e - a) / e;
  const y = yieldPct / 200;
  const c = couponPct / 2;
  let pv = 100 / Math.pow(1 + y, n - 1 + t);
  for (let k = 1; k <= n; k++) pv += c / Math.pow(1 + y, k - 1 + t);
  const accrued = c * a / e;
  return { price: pv - accrued, accrued };
}

export function bondYield({ settle, mat, couponPct, price }) {
  const f = y => bondPrice({ settle, mat, yieldPct: y, couponPct }).price - price;
  let lo = -50;
  let hi = 500;
  if (!(f(lo) >= 0) || !(f(hi) <= 0)) throw new CalcError(5);
  for (let k = 0; k < 200; k++) {
    const m = (lo + hi) / 2;
    if (f(m) > 0) lo = m; else hi = m;
  }
  return (lo + hi) / 2;
}
