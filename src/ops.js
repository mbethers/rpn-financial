import { CalcError } from './errors.js';

export const OPS = {
  add: (y, x) => y + x,
  sub: (y, x) => y - x,
  mul: (y, x) => y * x,
  div: (y, x) => {
    if (x === 0) throw new CalcError(0);
    return y / x;
  },
  yx: (y, x) => {
    const v = Math.pow(y, x);
    if (!Number.isFinite(v)) throw new CalcError(0);
    return v;
  },
};
