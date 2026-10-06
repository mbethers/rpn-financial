import { CalcError } from './errors.js';

export function npv(rate, cf0, groups) {
  let total = cf0;
  let k = 1;
  for (const g of groups) {
    for (let j = 0; j < g.n; j++, k++) total += g.amt / Math.pow(1 + rate, k);
  }
  return total;
}

export function irr(cf0, groups) {
  const f = r => npv(r, cf0, groups);
  let lo = -0.99;
  let flo = f(lo);
  for (let r = -0.98; r <= 100; r += r < 1 ? 0.01 : 0.5) {
    const fr = f(r);
    if (!Number.isFinite(fr)) continue;
    if (fr === 0) return r * 100;
    if (Number.isFinite(flo) && flo !== 0 && Math.sign(fr) !== Math.sign(flo)) {
      let a = lo;
      let b = r;
      let fa = flo;
      for (let k = 0; k < 200; k++) {
        const m = (a + b) / 2;
        const fm = f(m);
        if (Math.sign(fm) === Math.sign(fa)) { a = m; fa = fm; } else { b = m; }
      }
      return (a + b) / 2 * 100;
    }
    lo = r;
    flo = fr;
  }
  throw new CalcError(7);
}

export function amortize({ pv, pmt, i, begin, n }, count, decimals) {
  const r = i / 100;
  const m = 10 ** decimals;
  const rnd = v => Math.sign(v) * Math.round(Math.abs(v) * m) / m;
  let balance = pv;
  let interestTotal = 0;
  let principalTotal = 0;
  const rows = [];
  for (let k = 0; k < count; k++) {
    const interest = begin && n === 0 && k === 0 ? 0 : rnd(-balance * r);
    const principal = pmt - interest;
    balance += principal;
    interestTotal += interest;
    principalTotal += principal;
    rows.push({ k: k + 1, interest, principal, balance });
  }
  return { interest: interestTotal, principal: principalTotal, pv: balance, n: n + count, rows };
}
