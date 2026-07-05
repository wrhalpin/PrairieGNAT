# PrairieGNAT — Project Context

**Project:** GNAT Reader PWA — lightweight, installable STIX 2.1 reader for mobile and desktop.

**One-line pitch:** Triage and FSA on the go. A read-only bundle inspector that runs offline, with optional GNAT-aware mode for analysts.

## Key Facts

- **Tech stack:** Vite + Svelte + TypeScript + Tailwind + Workbox + IndexedDB
- **Modes:** Standalone (file/paste/URL) or GNAT-aware (connect to GNAT instance, browse disseminated reports)
- **License:** Apache 2.0
- **Repo structure:** Monorepo (single repo, unified build)
- **GNAT API:** Uses TAXII 2.1 server + REST API (`/api/reports`)
- **Auth (GNAT mode):** API key via `X-Api-Key` header
- **Hosting:** Cloudflare Pages (standalone), internal infra (GNAT mode)

## Decisions Locked

✅ Separate repo (not merged with GNAT)  
✅ Apache 2.0 license  
✅ Tech stack approved  
✅ GNAT API surface validated (no gaps)

## Development Phases

| Phase         | Duration  | Scope                                                               | Exit Criteria                               |
| ------------- | --------- | ------------------------------------------------------------------- | ------------------------------------------- |
| 0 (Spike)     | 1 week    | Validate stack, STIX parser MVP, TAXII client, device test          | Install PWA on iPad/Android, load bundle    |
| 1 (MVP)       | 3–4 weeks | Full STIX 2.1 ORM, Library/Bundle/Object screens, file I/O, offline | Standalone reader works iOS/Android/desktop |
| 2 (Polish)    | 2 weeks   | Bookmarks, cross-bundle search, defanging, share target, docs       | Ready for beta                              |
| 3 (GNAT mode) | 2–3 weeks | Auth, dissemination feed, deep links, offline snapshot              | Analysts can triage in field                |
| 4 (Release)   | 1 week    | CI/CD, open-source prep, v1.0 release                               | v1 shipped & documented                     |

## Critical Files

- `PrairieGNAT-conceptual-plan.md` — full design spec (vision, architecture, UX, testing, risks)
- `EXECUTION_PLAN.md` — phased delivery plan with tasks and go/no-go gates
- `src/` — TypeScript source (framework, STIX engine, UI)
- `public/` — PWA manifest, icons, static assets
- `src/**/*.test.ts` — Vitest unit tests (colocated with source)
- `docs/` — end-user & developer documentation

## Quick Start (Phase 0)

```bash
npm install
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run test         # Run tests
npm run preview      # Preview production build
```

## Useful Conventions

- **Standalone vs GNAT:** Runtime feature flag in settings (IndexedDB key `mode: 'standalone' | 'gnat'`)
- **STIX objects:** Custom TypeScript STIX 2.1 ORM in `src/lib/stix/`
- **UI:** Svelte components in `src/lib/components/`
- **Storage:** IndexedDB schema in `src/lib/storage/`
- **Auth:** GNAT token in IndexedDB (never localStorage)
- **Offline:** Service worker manages cache strategies (Workbox)

## Known Risks

- iOS storage eviction (handled: re-fetch + friendly UX)
- MDM policy blocks PWA (fallback: Capacitor wrapper if needed)
- Large bundles (1000+ objects) cause perf issues (handled: virtualization, streaming parser)

## Context for AI

When helping with code:

- Prioritize read-only, offline-first design
- Keep STIX parser pure (no side effects)
- Ensure accessibility (touch targets ≥44pt, VoiceOver support, dark mode)
- Security: auth tokens in IndexedDB, HTTPS only, no inline scripts
- Performance: target Lighthouse PWA 100, Perf/A11y ≥90, bundle ≤200KB gzip
- Test coverage: focus on STIX parser correctness and edge cases
