# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Porta CipherLab is an educational web tool for Giovanni Battista della Porta's DIGRAPHIC cipher (1563, *De Furtivis Literarum Notis*, Book II, ch. XIII): a 20×20 table where each pair of plaintext letters maps to one cell. The original cells hold symbols; this tool puts a unique 3-digit number in each cell. It is NOT the reciprocal polyalphabetic "Porta cipher".

## Technology Stack

- Plain HTML, CSS and JavaScript (classic scripts, no modules, no frameworks, no dependencies)
- Deployment: GitHub Pages from `main` (`/`), `.nojekyll`
- Tests: `node --test` (Node 22+), no packages

## Commands

- Run locally: open `index.html` directly (file:// works), or `python -m http.server 8000`
- Test: `npm test`
- CI: `.github/workflows/test.yml` runs `npm test` on push and pull_request

## Architecture

1. `index.html`: 5 tabs (置換表 / 暗号化 / 復号 / 通信シミュレーター / 座学), WAI-ARIA tabs, help disclosure buttons. Strict meta CSP (no `'unsafe-inline'`): no inline handlers, no style attributes.
2. `js/porta-core.js` (`globalThis.PortaCore`, no DOM): alphabets, `normalizeText`, `toPairs`, `encrypt`, `parseCiphertext`, `decrypt`, `simulate`, RNG (`cryptoUint32Source`, `cyrb128` + `seededUint32Source` = sfc32, `randomBelow`), keys (`parseReserved`, `makeKey`, `exportKey`, `importKey`, `displayRows`). Returns message keys `{ key, params }`, never UI text.
3. `js/messages.js` (`globalThis.PortaMessages`): all UI strings in Japanese and English with the same keys (`t(key, params)`, `tm(msg)`). Static text in `index.html` uses `data-i18n` / `data-i18n-attr`; the Japanese HTML text must equal the `ja` dictionary (tested).
4. `js/i18n.js` (`globalThis.PortaI18n`): initial language (`?lang=` → saved choice → browser language) and static text replacement. `script.js` keeps a render function per result element (`live`) and redraws everything on language change.
5. `script.js`: DOM only (tabs, rendering with `textContent`/`createElement`, events). No Japanese string literals (tested).
6. `style.css`: color tokens on `:root` (contrast tested), `:focus-visible` outline, 16px inputs, 44px buttons.

## Key Implementation Details

- 20-letter alphabet (original): `ABCDEFGHILMNOPQRSTVZ` (no J, K, U, W, X, Y). Option `handling20`: `replace` (J→I, U→V, W→VV; K/X/Y dropped) or `drop`.
- Orientation follows Porta: first letter = top heading (column), second letter = side heading (row). Data model is `matrix[first][second]` (same meaning as the old export format, which is still importable).
- Dummy (padding) must be a letter in the table. Defaults: X (26), Z (20).
- Non-letters are removed and reported with positions (no "keep" option: digits would collide with codes).
- Key file v2: `{ format: 'porta-cipherlab-key', version: 2, size, alphabet, order, reserved, matrix }`.
- Known answers in `test/core.test.js` come from an independent Python reference implementation (kept outside this repo).

- Original symbols: `assets/porta1563_symbols.png` (20×20 sprite cut from p. 90 of the 1563 first edition, Public Domain Mark 1.0; column = first letter, row = second letter). Porta's example (p. 91) gives 60 symbols in lines of 15/12/15/13/5. Do not edit the images; their SHA-256 is pinned in `test/symbols.test.js`.

## Code Style

- 2-space indent, `const`/`let`, lowerCamelCase, single quotes in JS
- Lines ≤ 160 chars (JS/CSS/tests), ≤ 250 (HTML) — tested
- README: no space between Japanese and ASCII, ≤ 2 bold per H2 section, every tree line has a description — tested
