# Repository Guidelines

## Project Structure & Module Organization
- `index.html` defines the Porta CipherLab interface: five WAI-ARIA tabs, form controls, help disclosure buttons. Keep IDs stable; `test/html.test.js` checks that every ID used by `script.js` exists.
- `js/porta-core.js` holds all cipher logic with no DOM access (`globalThis.PortaCore`). Return message keys (`{ key, params }`), not UI text.
- `js/messages.js` holds every UI string (`globalThis.PortaMessages`). Add new strings here; `script.js` must not contain Japanese literals.
- `script.js` wires the DOM: event listeners, rendering with `textContent`/`createElement` only (no `innerHTML`).
- `style.css` keeps color tokens on `:root`; `test/contrast.test.js` checks text/background pairs at 4.5:1.
- `assets/` stores the original table image (public domain scan) and README screenshots.

## Build, Test, and Development Commands
- Local preview: open `index.html` directly, or `python -m http.server 4173`.
- Tests: `npm test` (Node 22+, `node --test`, no dependencies). CI runs it on push and pull_request.
- No bundler or package install step. Do not add npm dependencies or CDN scripts (the CSP blocks external sources).

## Coding Style & Naming Conventions
- Two-space indentation, `const`/`let`, lowerCamelCase, single quotes.
- Keep the meta CSP strict: no inline event handlers, no `style` attributes, no inline scripts.
- Lines ≤ 160 characters in JS/CSS/tests (≤ 250 in HTML).

## Testing Guidelines
- Logic changes need tests in `test/core.test.js`, including round trips and known answers computed independently.
- README examples and the directory tree are verified by `test/readme.test.js`; update them together.
- Browser checks: Chromium, Edge and Firefox at 320/390/1280 px, HTTP and file://, console free of CSP violations.

## Commit & Pull Request Guidelines
- Commit messages in Japanese, short subject.
- Summarize testing performed and include screenshots for UI changes.
