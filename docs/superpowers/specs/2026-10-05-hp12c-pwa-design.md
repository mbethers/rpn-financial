# HP 12C PWA — Design

## Goal
An ad-free, full-screen, installable web app that reproduces the HP 12C financial calculator (RPN) and improves on the existing iPhone emulator: clean portrait layout, visible stack/registers, optional algebraic entry, and tap-for-help on shifted functions.

## Out of scope
- Programming mode (PRGM, SST, BST, GTO, R/S, PSE, program memory). Keys remain on the keypad but are inert/hidden-labelled "n/a".
- Accounts, backend, App Store packaging.

## Architecture
Static PWA, no build step.
- `index.html` — keypad, LCD, side panel, styles.
- `src/calc.js` — pure engine core (no DOM). Exposes `createCalc()` returning `{ press(key), view(), inject, fail, snapshot, restore }`. Testable in Node. Financial math lives in small modules beside it: `tvm.js`, `cashflow.js`, `bonds.js`, `depreciation.js`, `stats.js`, `dates.js`, `format.js`.
- `src/algebraic.js` — optional infix-entry wrapper around the engine.
- `src/ui.js`, `src/keys.js` — render state, handle taps/haptics, help popovers, panel, mode toggle.
- `manifest.webmanifest`, `sw.js` — installable, offline.
- `test/calc.test.js` — Node test runner, checks engine against HP 12C manual examples.

## Engine
- 4-level RPN stack (X, Y, Z, T) with LSTx; digit-entry state machine; CHS, EEX, CLx, x<>y, R↓, ENTER stack lift rules.
- Prefix handling: f, g, STO, RCL (with register indices 0-9, .0-.9), display formatting `f` + digit (fixed decimals), RND, FRAC, INTG.
- 20 storage registers (R0–R9, R.0–R.9) plus financial registers (n, i, PV, PMT, FV).
- TVM: n, i, PV, PMT, FV with BEG/END; closed forms plus Newton iteration for i; 12× / 12÷.
- Cash flows: CF0, CFj, Nj; NPV, IRR.
- Amortization (f AMORT), interest, bonds (PRICE, YTM), depreciation (SL, SOYD, DB).
- Dates: D.MY / M.DY, DATE, ΔDYS.
- Percent: %, Δ%, %T. Math: 1/x, √x, y^x, e^x, LN, n!. Statistics: Σ+, Σ−, x̄, s, x̂,r / ŷ,r, x̄w, linear regression.
- CLEAR: Σ, PRGM (no-op), FIN, REG, PREFIX.
- Errors: Error 0–9 display like the original (divide by zero, no solution, etc.).

## UI
- Portrait 4×10 keypad matching the 12C legends (orange f, blue g), seven-segment LCD with status annunciators (f, g, STO, RCL, BEG, D.MY). Portrait 5×8 key grid (ENTER spans two rows) instead of the original 10×4.
- Large tap targets, haptic feedback via `navigator.vibrate` where supported.
- Collapsible side/bottom panel: stack X/Y/Z/T, registers, last amortization table.
- Optional algebraic-entry toggle layered over the engine (translates infix to RPN keystrokes).
- Long-press any key to see its primary/f/g function description.
- Dark theme default, respects safe areas, no ads or external network requests.

## Testing
- Node unit tests of the engine using the HP 12C manual's worked examples (mortgage payment, savings FV, bond price/yield, IRR, depreciation, date difference, statistics).
- Browser verification of keypad, shifts, panel, installability.

## Delivery
Served as static files; install to iPhone home screen via Safari "Add to Home Screen".
