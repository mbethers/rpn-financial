# RPN Financial Calculator

An ad-free, offline, installable RPN financial calculator modelled on the HP 12C (everything except programming mode).

## Run locally

```bash
python3 -m http.server 8080   # then open http://localhost:8080
node --test                   # run the engine tests
```

## Install on iPhone

1. Host the folder on any static host (GitHub Pages, Netlify, Cloudflare Pages — all free).
2. Open the https URL in Safari → Share → **Add to Home Screen**.
3. Launch from the home-screen icon; it runs full screen and works offline.

## Tips

- Long-press any key to see what its primary, gold (f) and blue (g) functions do.
- **Registers** shows the stack, financial registers, storage registers, cash flows and the last amortization table.
- **Entry: RPN / ALG** switches to normal algebraic entry (ENTER acts as "="); financial keys work in both modes.
- On n / i / PV / PMT / FV: type a number and press the key to store it. Pressing a TVM key right after another TVM key (e.g. after storing PV) solves for it; after anything else it stores X.
- Releasing changes: bump `CACHE` in `sw.js` whenever you ship, so installed copies pick up the new files.
- Dates: `g 4` = day.monthyear, `g 5` = month.dayyear (e.g. `4.152025` = April 15, 2025).
- Not included: programming mode (PRGM, SST, BST, GTO, R/S, PSE).
