# Repository Guidelines

## Project Structure & Module Organization
- `index.html` wires the Porta CipherLab interface: tabbed panels, form controls, and localized copy. Keep markup semantic and update IDs/data attributes only when JavaScript selectors are adjusted.
- `script.js` contains plain-browser ES code for matrix generation, encryption, and UI handling. Organize new logic as small helpers and attach event listeners in the existing tab bootstrap block.
- `style.css` hosts global styles and responsive rules. Reuse declared utility classes, and place component-specific rules near related selectors.
- `assets/` stores static media (screenshots, icons). Add new assets under descriptive filenames and reference them with relative paths.
- `.claude/` holds prompt workflows used by project maintainers; leave its structure intact unless explicitly updating automation.

## Build, Test, and Development Commands
- Local preview: `npx http-server . --port 4173` or `python -m http.server 4173` to serve the static site for browser testing.
- Optional format check: `npx prettier --check index.html script.js style.css`. Run with `--write` before committing to normalize whitespace and quoting.
- No bundler or package install step is required; changes should run in any evergreen browser once the static files reload.

## Coding Style & Naming Conventions
- JavaScript uses two-space indentation, `const`/`let`, and lowerCamelCase for variables and functions. Keep DOM IDs stable and prefer descriptive names (`matrixDisplay`, `keyStatus`).
- CSS selectors follow kebab-case class names. Group related declarations together, and favor Flexbox or CSS Grid already used in the file.
- When editing copy, preserve the bilingual JA/EN tone. Inline strings should remain in template literals for easy localization tweaks.

## Testing Guidelines
- Manual regression testing is expected: generate matrices in both 20×20 and 26×26 modes, encrypt and decrypt sample text, and verify delimiter handling.
- Check the browser console for warnings or uncaught errors after changes. Validate that imported JSON keys load successfully and display status messages.
- UI tweaks should be reviewed at narrow (<480px) and desktop widths to ensure layout stability.

## Commit & Pull Request Guidelines
- Use present-tense, imperative commit subjects under 72 characters (e.g., `Adjust matrix rendering spacing`). Squash minor fixups before opening a PR.
- Reference linked issues in the body, summarize testing performed, and include before/after screenshots or GIFs for UI-affecting updates.
- PRs should highlight any accessibility considerations (focus order, ARIA usage) and call out translations or content changes for reviewer awareness.
