export class CalcError extends Error {
  constructor(code) {
    super(`Error ${code}`);
    this.code = code;
  }
}
