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

## Status

**Phases 0–3 complete; Phase 4 (v1.0 release) in progress**

### Phase Completion

- ✅ **Phase 0** — Spike complete, stack validated
- ✅ **Phase 1** — MVP complete, all core features implemented
- ✅ **Phase 2** — Bookmarks, read state, defanging, cross-bundle search, share target
- ✅ **Phase 3** — GNAT mode (auth, dissemination feed, deep links, TLP filtering)
- 🔄 **Phase 4** — v1.0 release, docs, open-source prep

## Phase 1 Features

✅ **STIX 2.1 Support**

- Parse all 18 SDOs, SROs, and common SCOs
- Type-specific rendering for each object class
- Relationship resolution and navigation

✅ **Data Input Methods**

- Load bundles from file (drag-drop, file picker)
- Paste raw JSON with validation
- Fetch from HTTP URL or TAXII 2.1 endpoints
- Test bundle included

✅ **Search & Filtering**

- Within-bundle search (name, description, ID, type)
- Cross-bundle search across all loaded bundles
- Real-time results with up to 100 matches

✅ **Offline Capability**

- Service worker with intelligent caching
- App shell caching for instant load
- API response caching (network-first with fallback)
- Fully functional without network after first load

✅ **UI/UX**

- Dark mode with system preference detection
- Mobile-first responsive design (Tailwind CSS)
- Touch targets ≥44pt (iOS HIG)
- Related objects navigation
- Bundle management (list, cache, delete)

✅ **Developer Experience**

- TypeScript strict mode
- ESLint + Prettier
- Vitest ready for unit tests
- GitHub Actions CI/CD
- ~25KB gzip core bundle (200KB budget)

## Project Structure

```
index.html             # App shell (Vite entry)
src/
├── main.ts            # Entry point (mounts App, registers SW)
├── App.svelte         # Routing, navigation, dark mode
├── sw.ts              # Service worker (built via vite-plugin-pwa)
├── lib/
│   ├── stix/          # STIX 2.1 parser, renderers, defanging, types
│   ├── storage/       # IndexedDB persistence
│   ├── taxii/         # TAXII 2.1 client
│   ├── pages/         # Screen components
│   └── components/    # Reusable UI components
└── styles/            # Global CSS (Tailwind)

public/
├── manifest.webmanifest
├── icons/             # PWA icons (generated: npm run icons)
└── test-bundle-small.json

scripts/               # Icon generation
docs/                  # GitHub Pages site
```

Tests live next to the code they cover (`src/**/*.test.ts`).

## Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

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
