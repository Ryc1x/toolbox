# CLAUDE.md

## Project overview

Toolbox is a static website hosting simple, client-side browser tools. Deployed on GitHub Pages — no build step, no server.

## Architecture

- Pure HTML + CSS + vanilla JavaScript
- External libraries loaded via CDN (no npm, no bundler)
- Each tool lives in `tools/<tool-name>/` with its own `index.html`, `style.css`, and JS
- Shared design system in `css/style.css`
- Landing page at root `index.html` lists all tools as cards

## Key conventions

- All processing must happen client-side — never send user data to a server
- Design: minimalist, clean, system font stack, blue accent (#2563eb), white/near-white backgrounds
- Keep tools self-contained in their own folders
- When adding a new tool: create its folder under `tools/`, then add a card to root `index.html`

## Current tools

- **Passport Photo** (`tools/passport-photo/`) — Uses Cropper.js (CDN) for interactive cropping, Canvas API for tiling onto print paper at 300 DPI

## Deployment

Static files deployed via GitHub Pages from the `main` branch root. No build step needed.
