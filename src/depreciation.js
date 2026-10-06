import { CalcError } from './errors.js';

const check = ({ life }, year) => {
  if (!(year >= 1) || !(life >= 1) || year > Math.ceil(life)) throw new CalcError(5);
};

export function depSL(a, year) {
  check(a, year);
  const total = a.cost - a.salvage;
  const dep = total / a.life;
  return { dep, rdv: total - dep * year };
}

export function depSOYD(a, year) {
  check(a, year);
  const total = a.cost - a.salvage;
  const sum = a.life * (a.life + 1) / 2;
  let cum = 0;
  let dep = 0;
  for (let k = 1; k <= year; k++) {
    dep = total * (a.life - k + 1) / sum;
    cum += dep;
  }
  return { dep, rdv: total - cum };
}

export function depDB(a, year) {
  check(a, year);
  const rate = a.factorPct / 100 / a.life;
  let book = a.cost;
  let dep = 0;
  for (let k = 1; k <= year; k++) {
    dep = Math.max(0, Math.min(book * rate, book - a.salvage));
    book -= dep;
  }
  return { dep, rdv: book - a.salvage };
}
