import { CalcError } from './errors.js';

const get = r => ({ n: r[1], sx: r[2], sxx: r[3], sy: r[4], syy: r[5], sxy: r[6] });

export function add(r, x, y, sign = 1) {
  r[1] += sign;
  r[2] += sign * x;
  r[3] += sign * x * x;
  r[4] += sign * y;
  r[5] += sign * y * y;
  r[6] += sign * x * y;
}

export function mean(r) {
  const { n, sx, sy } = get(r);
  if (n === 0) throw new CalcError(2);
  return { x: sx / n, y: sy / n };
}

export function stdev(r) {
  const { n, sx, sxx, sy, syy } = get(r);
  if (n < 2) throw new CalcError(2);
  const sd = (s2, s1) => Math.sqrt(Math.max(0, (s2 - s1 * s1 / n) / (n - 1)));
  return { x: sd(sxx, sx), y: sd(syy, sy) };
}

export function weightedMean(r) {
  const { sy, sxy } = get(r);
  if (sy === 0) throw new CalcError(2);
  return sxy / sy;
}

function fit(r) {
  const { n, sx, sxx, sy, syy, sxy } = get(r);
  if (n < 2) throw new CalcError(2);
  const dx = n * sxx - sx * sx;
  const dy = n * syy - sy * sy;
  if (dx === 0 || dy === 0) throw new CalcError(2);
  const b = (n * sxy - sx * sy) / dx;
  return { a: (sy - b * sx) / n, b, r: (n * sxy - sx * sy) / Math.sqrt(dx * dy) };
}

export function estimateY(r, x) {
  const f = fit(r);
  return { est: f.a + f.b * x, r: f.r };
}

export function estimateX(r, y) {
  const f = fit(r);
  if (f.b === 0) throw new CalcError(2);
  return { est: (y - f.a) / f.b, r: f.r };
}
