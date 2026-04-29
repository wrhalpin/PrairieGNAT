# PrairieGNAT — GNAT Reader PWA

A lightweight, installable STIX 2.1 reader for iOS, Android, and desktop. Read cyber threat intelligence bundles offline, triage in the field, and optionally connect to a GNAT instance for dissemination feeds.

## Features

- 📂 **Open STIX bundles** — file, paste JSON, or fetch from URL
- 🔍 **Search & filter** — find objects within bundles
- 📚 **Library** — manage cached bundles
- 🌙 **Dark mode** — system preference support
- 📱 **PWA installable** — "Add to Home Screen" on iOS/Android
- 🔗 **Offline-capable** — read previously opened bundles without network
- 🤖 **GNAT-aware** — (optional) connect to GNAT instance, browse dissemination feeds

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm run test

# Build for production
npm run build

# Preview production build
npm run preview
```

### Linting & Formatting

```bash
# Check code
npm run check

# Fix formatting
npm run format

# Fix linting
npm run lint:fix
```

## Phases

See `EXECUTION_PLAN.md` for detailed roadmap:

- **Phase 0** (spike) — Validate stack, STIX parser MVP, device testing
- **Phase 1** (MVP) — Full STIX 2.1 reader, offline support
- **Phase 2** (polish) — Bookmarks, search, defanging, share target
- **Phase 3** (GNAT mode) — Auth, dissemination feed, deep links
- **Phase 4** (release) — v1.0 documentation, release

## Project Structure

```
src/
├── app.html           # HTML shell
├── routes/            # SvelteKit pages
├── lib/
│   ├── stix/          # STIX 2.1 parser & types
│   ├── storage/       # IndexedDB persistence
│   ├── taxii/         # TAXII 2.1 client
│   └── components/    # Reusable UI components
└── styles/            # Global CSS (Tailwind)

public/
├── manifest.webmanifest
└── icons/             # PWA icons

tests/                 # Vitest unit tests
```

## Configuration

See `.env.example` for available environment variables.

## Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run with UI
npm run test:ui
```

Target coverage: >80% on STIX parser and storage layers.

## License

Apache 2.0 — See `LICENSE` file.

## Documentation

- `CLAUDE.md` — Project context for developers
- `EXECUTION_PLAN.md` — Phased delivery roadmap
- `PrairieGNAT-conceptual-plan.md` — Full design specification
