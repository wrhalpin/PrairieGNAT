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

**Phase 1 MVP — COMPLETE** ✅

### Phase Completion
- ✅ **Phase 0** — Spike complete, stack validated
- ✅ **Phase 1** — MVP complete, all core features implemented
- ⏳ **Phase 2** — Planned (bookmarks, defanging, share target)
- ⏳ **Phase 3** — Planned (GNAT mode)
- ⏳ **Phase 4** — Planned (v1.0 release)

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
- Real-time results with up to 50 matches

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
- <16KB gzip bundle size

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
