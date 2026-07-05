# PrairieGNAT Execution Plan

**Status:** Ready for Phase 0 (Spike)  
**Total Duration:** ~12 weeks (or 6–8 weeks full-time)  
**Start Date:** April 30, 2026

---

## Pre-Phase 0 Setup (This Week)

### Decision Gate 1: Governance ✅ LOCKED

- [x] Separate repo (not merged with GNAT)
- [x] Apache 2.0 license
- [x] No open-source delay; integrate licensing from the start

### Decision Gate 2: GNAT API ✅ LOCKED

- [x] TAXII 2.1 server available (fetch bundles, objects, paginated)
- [x] REST API (`/api/reports`) for dissemination feed
- [x] Auth via `X-Api-Key` header (simple, no refresh loop needed)
- [x] **No blocking API gaps** — proceed to Phase 0

### Decision Gate 3: Tech Stack ✅ LOCKED

- [x] Vite + Svelte + TypeScript ✅
- [x] Tailwind CSS ✅
- [x] Workbox (service worker) ✅
- [x] IndexedDB (idb wrapper) ✅
- [x] Vitest (unit tests) ✅
- [x] Bundle size budget: ≤200KB gzip, fail build if exceeded

### Pre-Phase 0 Checklist

- [ ] LICENSE file added (Apache 2.0)
- [ ] CLAUDE.md created (done ✅)
- [ ] EXECUTION_PLAN.md created (this file)
- [ ] `.gitignore` set up (node_modules, dist, .env, etc.)
- [ ] GitHub project board created (milestones: Phase 0–4)

---

## Phase 0 — Spike (Week 1–2)

**Goal:** De-risk the stack and prove STIX 2.1 + TAXII 2.1 on real devices.

### Tasks

#### 1. Project Setup (Day 1)

- [ ] Init Vite + Svelte + TypeScript scaffold
  ```bash
  npm create vite@latest . -- --template svelte
  npm install
  ```
- [ ] Add dev dependencies: Tailwind, ESLint, Prettier, Vitest, Workbox
  ```bash
  npm install -D tailwindcss postcss autoprefixer \
    eslint prettier vitest @vitest/ui \
    workbox-webpack-plugin workbox-cli
  ```
- [ ] Configure TypeScript (`tsconfig.json`): `strict: true`
- [ ] Set up ESLint + Prettier config
- [ ] Create `.env.example` (for GNAT instance URL, API key)
- [ ] Git: commit scaffolding

**Time estimate:** 2–3 hours

#### 2. PWA Scaffold (Day 1–2)

- [ ] Generate `public/manifest.webmanifest` (from plan §5)
- [ ] Create PWA icons (192x192, 512x512, maskable 512x512)
- [ ] Add Workbox service worker configuration
  - App shell cache-first (index.html, JS, CSS, fonts)
  - No network-first routes yet; keep it simple
- [ ] Test on desktop Chrome (dev tools → Application → Service Workers)
- [ ] Verify "Add to Home Screen" prompt works on desktop

**Time estimate:** 3–4 hours

#### 3. STIX 2.1 Parser MVP (Day 2–3)

- [ ] Create `src/lib/stix/types.ts` — TypeScript interface stubs for:
  - Indicator, ThreatActor, Malware, Campaign, Intrusion Set, Attack Pattern, Report
  - Relationship, Sighting
  - File, IPv4Address, Domain, URL, Email (common SCOs)
  - Marking Definition, TLP colors
- [ ] Create `src/lib/stix/parser.ts` — bundle parser:
  - Validate JSON schema (basic structure check)
  - Build in-memory index: `Map<id, StixObject>`, `Map<id, Relationship[]>`
  - Error handling for malformed input
- [ ] Unit tests (Vitest): parse valid bundle, reject invalid, handle edge cases
- [ ] Create `src/lib/stix/rendering.ts` — rendering hints per object type (from plan §3)

**Time estimate:** 4–5 hours

#### 4. TAXII 2.1 Client Proof-of-Concept (Day 3)

- [ ] Create `src/lib/taxii/client.ts` — minimal TAXII 2.1 fetcher:
  - `GET /taxii/discovery` — list collections
  - `GET /taxii/collections/{id}/objects` — paginated fetch
  - `GET /taxii/objects/{id}` — single object fetch
  - Optional: `X-Api-Key` header for GNAT mode
- [ ] Create `src/lib/source/index.ts` — abstraction layer:
  - "Sources" can be File, Paste JSON, URL (HTTP), TAXII (GNAT)
  - Each source type implements `load(): Promise<Bundle>`
- [ ] Test: fetch a test bundle from a public TAXII server

**Time estimate:** 2–3 hours

#### 5. Minimal UI (Day 2–3)

- [ ] Create single page: `src/routes/+page.svelte`
  - Input: STIX bundle (drag-drop file, paste JSON, or TAXII URL)
  - Render: list of objects grouped by type
  - Render: one Indicator card with pattern, valid_from, kill_chain_phases
  - Dark mode toggle (system preference default)
- [ ] Tailwind + dark mode config
- [ ] No routing yet; just one page

**Time estimate:** 2–3 hours

#### 6. Device Testing (Day 4)

- [ ] Build production bundle: `npm run build`
- [ ] Deploy to Vercel or Netlify (free tier, temporary)
- [ ] Test on real devices:
  - **iPad (iOS 17+, Safari):** Open PWA, "Add to Home Screen", load test bundle
  - **Android phone (Chrome):** Install PWA, load bundle
  - **Desktop (Chrome/Firefox/Safari):** Verify no console errors
- [ ] Document findings: any iOS/Android quirks, performance notes, stack concerns

**Time estimate:** 2–3 hours

#### 7. Spike Report (Day 5)

- [ ] Write summary:
  - ✅ What worked (Vite + Svelte speed, Workbox setup, STIX parser structure)
  - ⚠️ What was tricky (iOS quirks, if any)
  - ❌ Any blockers or surprises
  - 📊 Bundle size at this stage (target: <100KB gzip)
  - 🎯 Go/no-go recommendation for Phase 1
- [ ] Commit: "Phase 0 spike: STIX parser + TAXII client + PWA validation"

**Time estimate:** 1–2 hours

### Phase 0 Exit Criteria

✅ Can install PWA on iPad (iOS 16.4+) and Android (Chrome)  
✅ Can fetch a STIX bundle via TAXII 2.1 and render it offline  
✅ Indicator card displays pattern, valid_from, kill_chain_phases  
✅ Service worker caches app shell; works without network  
✅ TypeScript strict mode passes, ESLint clean  
✅ Bundle size <100KB gzipped  
✅ Spike report filed with go/no-go

---

## Phase 1 — Standalone Reader MVP (Weeks 3–6, ~4 weeks)

**Goal:** Full-featured offline-capable STIX reader.

### Work Streams

#### 1A. STIX 2.1 ORM Expansion (Week 3, parallel with 1B)

- [ ] Expand TypeScript model to cover **all 18 SDOs**:
  - Already: Indicator, ThreatActor, Malware, Campaign, Intrusion Set, Attack Pattern, Report
  - Add: Identity, Vulnerability, Course of Action, Observed Data, Bundle, Marking Definition, Note, Opinion
- [ ] Expand **SROs**: Relationship, Sighting (custom properties support)
- [ ] Expand **SCOs**: File, IPv4Address, IPv6Address, Domain, URL, Email, PhoneNumber, Mutex, Process, WindowsRegistryKey, X509Certificate
- [ ] Add **custom properties** support (x\_\* fields)
- [ ] Relationship resolution: given a source ref, find all target objects
- [ ] Unit tests: >80% coverage on parser, edge cases (malformed, missing fields, unknown object types)

**Estimated effort:** 1 week  
**Files created/modified:** `src/lib/stix/*` (types, parser, renderer hints)

#### 1B. UI Framework & Navigation (Week 3, parallel with 1A)

- [ ] Set up SvelteKit routing (`src/routes/`)
- [ ] Create layout structure: bottom tab bar (Library / Search / Settings)
- [ ] Implement 4 main screens:
  1. **Library** — list of opened/cached bundles (sortable, filterable)
  2. **Bundle View** — bundle metadata + object list grouped by type
  3. **Object Detail** — type-specific rendering with relationships
  4. **Settings** — cache clear, dark mode, (placeholder for GNAT config)
- [ ] Navigation patterns: tab stack, back gesture support
- [ ] Mobile-first responsive design

**Estimated effort:** 1 week  
**Files created:** `src/routes/(app)/` directory with layout, pages

#### 1C. File I/O & Data Entry (Week 3, overlaps 1A/1B)

- [ ] **File open:** drag-drop handler, file picker
- [ ] **Paste JSON:** modal with validation
- [ ] **URL fetch:** modal with input (HTTP or TAXII endpoint)
- [ ] Validation & error handling: show friendly messages for malformed input
- [ ] Load sources in parallel with 1A/1B as you go

**Estimated effort:** 2–3 days  
**Files created:** `src/lib/components/FileInput.svelte`, `src/lib/source/*`

#### 1D. Storage & Offline (Week 4, depends on 1A/1B)

- [ ] IndexedDB schema:
  - `bundles` — raw STIX JSON
  - `parsed` — parsed STIX objects (indexed by type)
  - `metadata` — bundle source, opened date, etc.
  - `bookmarks` — starred objects
  - `readState` — read/unread per object
  - `settings` — app mode (standalone/gnat), theme, cache TTL
- [ ] Persistence layer (`src/lib/storage/db.ts`):
  - `saveBundleAsync()`, `loadBundlesAsync()`, `deleteBundleAsync()`
  - Use `idb` library (small wrapper, ~2KB)
- [ ] Service worker: cache strategy for bundles (cache-first)
- [ ] Recovery on eviction: detect if IndexedDB cleared, show friendly prompt
- [ ] Unit tests: save/load cycles, eviction recovery

**Estimated effort:** 1 week  
**Files created:** `src/lib/storage/*`, service worker update

#### 1E. Search (Week 4, depends on 1B/1D)

- [ ] In-bundle search: filter objects by name, description, type
- [ ] UI: search input in Bundle View, real-time filtering
- [ ] No server-side indexing; simple substring match (acceptable for <1000 objects)

**Estimated effort:** 2–3 days  
**Files created/modified:** `src/lib/components/SearchInput.svelte`, routing

#### 1F. Dark Mode & Accessibility (Week 4, parallel with 1E)

- [ ] Dark mode: respect system preference, manual override in Settings
- [ ] Tailwind dark mode classes throughout
- [ ] Accessibility audit:
  - Touch targets ≥44pt (iOS HIG)
  - Semantic HTML (button, link, nav)
  - Color contrast ≥4.5:1
  - VoiceOver: test on iPad (basics—focus management, labels)
  - Keyboard navigation: tab order, focus visible
- [ ] Lighthouse audit: target PWA 100, Performance ≥90, Accessibility ≥90

**Estimated effort:** 1 week  
**Files modified:** all components

#### 1G. Testing & QA (Week 5, ongoing)

- [ ] Vitest: unit tests for STIX parser, storage layer (>80% coverage)
- [ ] Integration tests: bundle load → index → parse → render
- [ ] Manual testing matrix:
  - iPhone 14/15 + iOS 17 (Safari)
  - iPad 7th gen + iPadOS 17 (Safari)
  - Android 13/14 (Chrome)
  - Desktop (Chrome, Firefox, Safari)
- [ ] Test bundles: small (10 obj), medium (100), large (1000+), malformed edge cases
- [ ] Performance testing: Lighthouse audit in CI

**Estimated effort:** 1 week (ongoing)

#### 1H. CI/CD Setup (Week 5, parallel with 1G)

- [ ] GitHub Actions workflow:
  - Lint (ESLint, Prettier check)
  - Type-check (`tsc --noEmit`)
  - Test (Vitest)
  - Build + bundle size check (fail if >200KB gzip)
  - Deploy to staging (Vercel or Netlify)
- [ ] `.github/workflows/ci.yml`

**Estimated effort:** 1 day  
**Files created:** `.github/workflows/ci.yml`

### Phase 1 Exit Criteria

✅ Can open any STIX 2.1 bundle (file, paste, URL) on iPhone, iPad, Android, desktop  
✅ All 18 SDOs + SROs + common SCOs render with type-specific UI  
✅ Offline: previously opened bundles fully readable without network  
✅ Search works within a bundle  
✅ Dark mode + system preference support  
✅ Lighthouse: PWA 100, Perf/A11y ≥90  
✅ Bundle size ≤200KB gzipped  
✅ Tests: >80% coverage on STIX parser and storage  
✅ No regressions on device testing matrix

---

## Phase 2 — Polish (Weeks 7–8, ~2 weeks)

**Goal:** Ready for beta distribution.

### Tasks

- [ ] **Bookmarks & read state** (2 days)
  - UI: bookmark toggle, read/unread toggle
  - Persist to IndexedDB
  - Filter library by read/unread
- [ ] **Cross-bundle search** (3 days)
  - Index all cached bundles on load
  - Full-text search modal
  - Results show: object name, snippet, bundle source
- [ ] **Defanging & copy-to-clipboard** (2 days)
  - Render URLs as `hxxp://`, IPs as `1.1.1[.]1` by default
  - Tap-to-reveal real value
  - Copy button: offer both fanged and defanged
- [ ] **Share target & file handlers** (2 days)
  - Manifest `share_target` (POST multipart JSON)
  - Manifest `file_handlers` (.json, .stix)
  - Test: share STIX from email/Files on iOS, open file on Android
- [ ] **End-user documentation** (2 days)
  - `README.md` — install instructions (web link, QR code, iOS shortcut, Android)
  - Screenshots of each main screen
  - Troubleshooting: iOS storage eviction, share target quirks
  - Quick-start guide

### Phase 2 Exit Criteria

✅ Bookmarks and read/unread state working  
✅ Cross-bundle search functional  
✅ Defanging toggle, copy-to-clipboard working  
✅ Share target and file handlers integrated (iOS/Android tested)  
✅ README and troubleshooting docs complete  
✅ No regressions from Phase 1

---

## Phase 3 — GNAT Mode (Weeks 9–11, ~2–3 weeks)

**Goal:** Analysts can triage GNAT outputs in the field.

### Prerequisites

- [ ] GNAT instance deployed with TAXII 2.1 server and REST API (`/api/reports`)
- [ ] GNAT API key and instance URL documented

### Tasks

#### 3A. Auth & Config (2 days)

- [ ] Settings screen expansion: GNAT instance URL + API key input
- [ ] Validation: test connection before saving
- [ ] Token stored in IndexedDB (never localStorage)
- [ ] Mode selector (Standalone / GNAT) in Settings
- [ ] Feature flag: only show GNAT-specific UI in GNAT mode

#### 3B. Dissemination Feed (3 days)

- [ ] New "Feed" tab (GNAT mode only)
- [ ] Poll `/api/reports` endpoint every 30 minutes (or on manual refresh)
- [ ] List view: recent reports with title, published date, summary
- [ ] Tap to open: fetch bundle via TAXII 2.1, render in Object Detail
- [ ] Cache feed snapshot in IndexedDB; show "last synced" timestamp

#### 3C. Deep Links & GNAT Integration (2 days)

- [ ] "View in GNAT" button on Object Detail screens
- [ ] Deep link format: `/gnat/object/{id}` → GNAT web UI
- [ ] Workspace/multi-tenant awareness (TBD with GNAT team)

#### 3D. Offline Snapshot (1 day)

- [ ] Feed shows last cached snapshot when offline
- [ ] Bundles remain fully readable offline
- [ ] UI indicator: "offline" badge, last-sync timestamp

#### 3E. FSA Workflows (TBD with analysts, 2 days)

- [ ] Gather feedback from GNAT analysts on Phase 2 beta
- [ ] Implement quick wins (e.g., bulk bookmark, quick-filter by TLP)
- [ ] Post-v1 enhancements documented for v1.1

### Phase 3 Exit Criteria

✅ GNAT analysts can log in and view dissemination feed  
✅ Can fetch and read GNAT bundles via TAXII  
✅ Token refresh and session handling working  
✅ Offline snapshot works for 24h+ without network  
✅ No regressions to Standalone mode

---

## Phase 4 — Release & Open-Source (Week 12, ~1 week)

**Goal:** Ship v1.0 and document.

### Tasks

- [ ] **Build & deploy finalization** (1 day)
  - GitHub Actions: test all platforms, build, deploy to Cloudflare Pages (standalone)
  - Internal infra deploy for GNAT mode (coordinate with GNAT team)
  - Domain setup + HTTPS

- [ ] **Documentation** (2 days)
  - `docs/consuming-gnat-outputs.md` — survey of STIX readers (OpenCTI, MISP, stix2-viewer, PrairieGNAT) with tradeoffs
  - `docs/stix-portability.md` — what STIX portability does/doesn't get you
  - `docs/contributing.md` — dev setup, PR process
  - License boilerplate in all source files

- [ ] **Open-source prep** (1 day)
  - Apache 2.0 LICENSE file (already in repo)
  - Remove any GNAT-specific proprietary code (if merged; this is separate repo, so clean)
  - Create GitHub release page

- [ ] **Release announcement** (0.5 day)
  - Internal comms to analysts
  - Link from GNAT docs to PrairieGNAT reader
  - Changelog (commits from Phase 0–3)

- [ ] **v1.0 tag & publish** (0.5 day)
  - `git tag v1.0.0`
  - GitHub release with install links, screenshots, changelog

### Phase 4 Exit Criteria

✅ v1.0 released and installable on iOS, Android, desktop  
✅ Documented and linked from GNAT site  
✅ Changelog published  
✅ Open-source (Apache 2.0 license visible)

---

## Timeline Overview

| Phase       | Week(s) | Duration | Cumulative | Status                    |
| ----------- | ------- | -------- | ---------- | ------------------------- |
| Pre-Phase 0 | —       | 1 day    | 1 day      | Ready ✅                  |
| **Phase 0** | 1–2     | 1 week   | 2 weeks    | **NEXT**                  |
| **Phase 1** | 3–6     | 4 weeks  | 6 weeks    | Starts after Phase 0 gate |
| **Phase 2** | 7–8     | 2 weeks  | 8 weeks    | Starts after Phase 1 gate |
| **Phase 3** | 9–11    | 3 weeks  | 11 weeks   | Starts after Phase 2 gate |
| **Phase 4** | 12      | 1 week   | 12 weeks   | **SHIP v1.0**             |

**Part-time estimate:** ~12 weeks (10–15 hrs/week)  
**Full-time estimate:** 6–8 weeks

---

## Go/No-Go Gates

Each phase has an explicit gate before moving to the next:

### Gate 0→1 (After Phase 0 Spike)

- ✅ PWA installs on iOS + Android
- ✅ Bundle loads + renders offline
- ✅ <100KB gzip
- ✅ No deal-breaker iOS Safari issues
- **Owner:** Primary developer + 1 peer review
- **Approval:** Spike report filed + recommendation signed off

### Gate 1→2 (After Phase 1 MVP)

- ✅ All STIX types render
- ✅ Works offline on all device types
- ✅ Lighthouse PWA 100, Perf/A11y ≥90
- ✅ <200KB gzip
- ✅ >80% test coverage on core modules
- **Owner:** Primary developer + QA sign-off on device matrix
- **Approval:** CI passes, device testing matrix complete

### Gate 2→3 (After Phase 2 Polish)

- ✅ Ready for internal beta
- ✅ Documentation complete
- ✅ All Phase 2 features working
- **Owner:** Primary developer + 1 analyst tester
- **Approval:** Analyst feedback collected (prefer/prefer-not)

### Gate 3→4 (After Phase 3 GNAT Mode)

- ✅ GNAT analysts can triage in field
- ✅ No regressions to standalone
- **Owner:** Primary developer + GNAT team
- **Approval:** Analyst feedback positive, prod-ready for GNAT instance

### Gate 4 (Release)

- ✅ v1.0 documented, tagged, announced
- ✅ Installable via web + app stores (or instructions)
- **Owner:** Primary developer + release coordinator
- **Approval:** Release checklist signed off

---

## Known Risks & Mitigations

| Risk                                    | Likelihood | Impact | Mitigation                                                              |
| --------------------------------------- | ---------- | ------ | ----------------------------------------------------------------------- |
| iOS storage eviction (7d inactive)      | High       | Medium | Phase 0 spike validates; Phase 1 includes re-fetch + friendly UX        |
| MDM policy blocks PWA                   | Medium     | High   | Capacitor wrapper as fallback; check early with org                     |
| Large bundles (>50MB) slow parser       | Medium     | Medium | Phase 0 tests on 1000-obj bundle; Phase 2 adds virtualization if needed |
| GNAT API gaps (unlikely given analysis) | Low        | Medium | Gate 2 already validated; GNAT team on standby                          |
| Scope creep (authoring/editing)         | High       | High   | Explicitly read-only; v2 conversation only                              |
| iOS Safari quirks delay launch          | Medium     | Medium | Phase 0 spike on real iPad; test iOS 16.4+, 17, 18                      |

---

## Definition of Done

A phase is done when:

1. All tasks in that phase are completed
2. Exit criteria are met
3. No known regressions
4. Gate checklist signed off
5. Commit message references phase completion and any blockers resolved
