import { CalcError } from './errors.js';

const annuityFactor = (r, n, begin) =>
  r === 0 ? n : (1 + (begin ? r : 0)) * (Math.pow(1 + r, n) - 1) / r;

const residual = ({ n, i, pv, pmt, fv, begin }) => {
  const r = i / 100;
  return pv * Math.pow(1 + r, n) + pmt * annuityFactor(r, n, begin) + fv;
};

function solveRate(p) {
  const f = r => residual({ ...p, i: r * 100 });
  const scale = Math.max(Math.abs(p.pv), Math.abs(p.fv), Math.abs(p.pmt * p.n), 1);
  if (Math.abs(f(0)) < 1e-9 * scale) return 0;
  for (const start of [0.01, 0.1, 0.001, -0.01, 0.5, 0.0001]) {
    let r = start;
    for (let k = 0; k < 100; k++) {
      const h = 1e-7;
      const d = (f(r + h) - f(r - h)) / (2 * h);
      if (!Number.isFinite(d) || d === 0) break;
      let next = r - f(r) / d;
      if (!Number.isFinite(next)) break;
      if (next <= -0.99) next = (r - 0.99) / 2;
      if (Math.abs(next - r) < 1e-13 && Math.abs(f(next)) < 1e-9 * scale) return next * 100;
      r = next;
    }
    if (r > -0.99 && Math.abs(f(r)) < 1e-9 * scale) return r * 100;
  }
  throw new CalcError(5);
}

const positive = n => {
  if (!(n > 0)) throw new CalcError(5);
  return n;
};

export function solveTvm(target, p) {
  const r = p.i / 100;
  const g = Math.pow(1 + r, p.n);
  const k = annuityFactor(r, p.n, p.begin);
  const ok = v => {
    if (!Number.isFinite(v)) throw new CalcError(5);
    return v;
  };
  switch (target) {
    case 'fv': return ok(-(p.pv * g + p.pmt * k));
    case 'pv': return ok(-(p.pmt * k + p.fv) / g);
    case 'pmt':
      if (k === 0) throw new CalcError(5);
      return ok(-(p.pv * g + p.fv) / k);
    case 'n': {
      if (r === 0) {
        if (p.pmt === 0) throw new CalcError(5);
        return positive(Math.ceil(-(p.pv + p.fv) / p.pmt - 1e-9));
      }
      const a = (1 + (p.begin ? r : 0)) * p.pmt / r;
      const ratio = (a - p.fv) / (a + p.pv);
      if (!(ratio > 0) || r <= -1) throw new CalcError(5);
      return positive(Math.ceil(Math.log(ratio) / Math.log(1 + r) - 1e-9));
    }
    case 'i': return solveRate(p);
    default: throw new CalcError(5);
  }
}

export const simpleInterest = ({ n, i, pv }) => -pv * n * i / 36000;
export const simpleInterest365 = ({ n, i, pv }) => -pv * n * i / 36500;
