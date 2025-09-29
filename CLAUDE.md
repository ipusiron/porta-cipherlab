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
  start index.html
  ```

- **Deploy**: Push to GitHub main branch (GitHub Pages auto-deploys from main)

## Architecture

The application consists of three main files:

1. **index.html**: Tab-based UI structure with sections for encryption/decryption, key generation, matrix display, communication simulator, and educational content
2. **script.js**: Core cipher logic including:
   - 20×20 matrix generation with unique 3-digit codes (000-999)
   - Encryption: plaintext pairs → 3-digit codes
   - Decryption: 3-digit codes → plaintext pairs
   - Key import/export as JSON
3. **style.css**: Simple styling for the tabbed interface

## Key Implementation Details

- **Alphabet**: Uses 20 characters (excludes J,K,U,W,X,Z) stored in `const alphabet = "ABCDEFGHILMNOPQRSTVZ"`
- **Matrix**: 20×20 array mapping character pairs to 3-digit codes
- **Reserved codes**: Configurable list of codes to exclude (default: "000","999")
- **Dummy character**: Padding for odd-length plaintext (default: "X")
- **Delimiter options**: Space-separated or concatenated 3-digit sequences

## Testing Approach

Manual testing in browser - no automated test framework. Test scenarios:
1. Generate key and verify 400 unique codes
2. Encrypt/decrypt round-trip verification
3. Key export/import functionality
4. Edge cases: odd-length text, invalid characters