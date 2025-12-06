# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Porta CipherLab is an educational web tool for learning and experimenting with Giovanni Battista della Porta's digraphic cipher. The application is a single-page JavaScript application that runs entirely in the browser with no backend dependencies.

## Technology Stack

- **Frontend only**: Pure HTML, CSS, JavaScript (no frameworks)
- **Deployment**: GitHub Pages (static site)
- **No build process**: Files are served directly

## Commands

Since this is a static site with no build process:

- **Run locally**: Open `index.html` directly in a browser or use a local server:
  ```bash
  python -m http.server 8000
  # or
  npx http-server . --port 4173
  # or
  start index.html
  ```

- **Format check** (optional):
  ```bash
  npx prettier --check index.html script.js style.css
  npx prettier --write index.html script.js style.css  # auto-fix
  ```

- **Deploy**: Push to GitHub main branch (GitHub Pages auto-deploys from main)

## Architecture

The application consists of three main files:

1. **index.html**: Tab-based UI with 5 sections: key generation, encryption, decryption, communication simulator, and educational content (座学)
2. **script.js**: Core cipher logic including:
   - `SeededRandom` class for reproducible matrix generation via seed strings
   - `generateMatrix()` creates 20×20 or 26×26 matrices with unique 3-digit codes
   - `encryptText()` / `decryptText()` for cipher operations
   - `exportKey()` / `importKey()` for JSON key persistence
   - `simulateComm()` for end-to-end encryption demo
3. **style.css**: Responsive styling with CSS variables, flexbox/grid layouts

## Key Implementation Details

- **Alphabets**: Two modes supported
  - 20-char (classic): `"ABCDEFGHILMNOPQRSTVZ"` (excludes J,K,U,W,X,Z)
  - 26-char (extended): Full A-Z alphabet
- **Matrix**: 20×20 (400 cells) or 26×26 (676 cells) mapping character pairs to 3-digit codes
- **Reserved codes**: Configurable exclusion list (default: "000", "999")
- **Dummy character**: Padding for odd-length plaintext (default: "X")
- **Delimiter options**: Space-separated or concatenated 3-digit sequences

## Code Style

- JavaScript: 2-space indent, `const`/`let`, lowerCamelCase
- CSS: kebab-case class names, prefer existing flexbox/grid patterns
- Keep DOM IDs stable; inline event handlers are used throughout

## Testing Approach

Manual testing in browser - no automated test framework. Test scenarios:
1. Generate key and verify unique codes (400 for 20×20, 676 for 26×26)
2. Encrypt/decrypt round-trip verification
3. Key export/import functionality
4. Edge cases: odd-length text, invalid characters, excluded character handling
5. UI testing at narrow (<480px) and desktop widths