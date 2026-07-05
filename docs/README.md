# PrairieGNAT Documentation Site

This folder contains the GitHub Pages website for PrairieGNAT.

## Structure

- `index.html` — Home page with features, roadmap, and installation guide
- `getting-started.html` — Step-by-step getting started guide
- `styles.css` — Shared CSS for both pages
- `logo.png`, `favicon.png` — Generated from `../PrairieGNAT-logo.png`
- `.nojekyll` — Disables Jekyll processing so the HTML is served as-is

## Deployment

Served by GitHub Pages from the `/docs` folder on the default branch:

```
Repository: wrhalpin/PrairieGNAT
Source: /docs folder
Docs URL: https://wrhalpin.github.io/PrairieGNAT/
App URL:  https://prairiegnat.pages.dev (Cloudflare Pages — the PWA itself)
```

The docs site and the app are hosted separately: GitHub Pages serves this
static documentation, Cloudflare Pages serves the installable app.

## Design

The site follows the GNAT product ecosystem theme:

- **Color scheme**: Dark green (`#1a4d1a`, `#2d5a2d`) with GNAT green
  (`#22c55e`) and lime/yellow accents (`#bef264`, `#84cc16`), matching the
  PrairieGNAT logo
- **Branding**: "A GNAT Home Companion" positioning, gnat mascot logo
- **Typography**: System fonts for performance
- **Layout**: Responsive grids, mobile-first

## Editing Pages

1. Edit the HTML files directly; shared styles live in `styles.css`
2. Commit and push to trigger deployment
3. Changes appear at the docs URL within a couple of minutes
