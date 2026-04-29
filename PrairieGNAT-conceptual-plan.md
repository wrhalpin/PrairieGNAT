# GNAT Reader PWA — Development Plan

## 1. Vision & Scope

**Product name (working):** Prairie GNAT

**One-line pitch:** A lightweight, installable, read-only STIX 2.1 reader that runs on any device with a modern browser, with optional GNAT-aware mode for analysts in your org.

**Core principle:** Triage and FSA on the go — *not* full investigation. The reader is a finished-intel consumer and bundle inspector, not a workbench.

### In scope (v1)

- Open and render STIX 2.1 bundles (file open, paste JSON, URL fetch)
- SDO/SRO/SCO-aware rendering with relationship resolution
- Search/filter within a bundle
- Bookmarks and read/unread state
- Offline-capable for previously opened bundles
- GNAT-aware mode: connect to a GNAT instance, browse disseminated reports
- Installable to home screen (iOS, Android, desktop)

### Out of scope (v1)

- Authoring, editing, or annotating STIX
- Pivoting/enrichment against external feeds (RF, CrowdStrike, etc.)
- Full investigation graph view (deferred to v2 or kept on workstation)
- Background sync (iOS limitation makes this unreliable)
- Multi-tenant / multi-org support

-----

## 2. Architecture

### High-level

```
┌─────────────────────────────────────────────────┐
│  GNAT Reader PWA (browser / home-screen app)    │
│  ┌──────────────┐  ┌──────────────┐             │
│  │ UI Layer     │  │ STIX Engine  │             │
│  │ (Svelte/etc) │  │ (parser, ORM)│             │
│  └──────┬───────┘  └──────┬───────┘             │
│         │                 │                     │
│  ┌──────┴─────────────────┴───────┐             │
│  │ Storage (IndexedDB)            │             │
│  │ - bundles, bookmarks, settings │             │
│  └────────────────────────────────┘             │
│  ┌────────────────────────────────┐             │
│  │ Service Worker (cache, offline)│             │
│  └────────────────────────────────┘             │
└──────────────┬──────────────────────────────────┘
               │ (optional, GNAT-aware mode only)
               ▼
        ┌──────────────────┐
        │ GNAT API         │
        │ (REST/GraphQL)   │
        └──────────────────┘
```

### Modes

The reader operates in one of two modes, determined at runtime by configuration in IndexedDB:

- **Standalone mode** — no backend. User opens local files or pastes JSON. Fully offline-capable. Distribution: hosted as static site, anyone can install.
- **GNAT mode** — configured with GNAT instance URL + auth token. Adds dissemination feed, deep links back to GNAT, FSA workflows. Requires network for live data; cached bundles still readable offline.

Same codebase, runtime branch on a single feature flag.

### Stack recommendation

|Layer               |Choice                                                         |Why                                                                                                      |
|--------------------|---------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
|Framework           |**Svelte/SvelteKit** or **Preact**                             |Small bundle, fast on cellular, low ceremony. React is fine but heavier than needed for a reader.        |
|Styling             |**Tailwind CSS**                                               |Utility classes scale well to small screens; easy to keep consistent.                                    |
|STIX parsing        |Custom TypeScript module                                       |No mature JS STIX 2.1 ORM exists; build a minimal one. Keep model layer pure and separate from transport.|
|Storage             |**IndexedDB** (via `idb` wrapper)                              |Bundles can be large; localStorage is too small.                                                         |
|Service Worker      |**Workbox**                                                    |Battle-tested, handles cache strategies, offline fallback.                                               |
|Build               |**Vite**                                                       |Fast, PWA plugin available, works well on iPad dev workflows.                                            |
|Hosting (standalone)|**Cloudflare Pages** or **GitHub Pages**                       |Free, HTTPS by default (PWAs require HTTPS).                                                             |
|Hosting (GNAT mode) |Internal — same network as GNAT or accessible via VPN/WireGuard|                                                                                                         |

### Key architectural decisions to make early

- **TypeScript yes/no** — strongly recommend yes; STIX 2.1 has a complex type system worth modeling in types
- **Monorepo or split** — a `gnat-reader-core` package (STIX engine) separate from the PWA UI, so the core is reusable and open-sourceable independently
- **License** — Apache 2.0 is a sensible default if open-sourcing the core; keep GNAT-specific bits proprietary

-----

## 3. STIX 2.1 Rendering Strategy

### Object type → UI treatment

|STIX type                           |Category|Mobile rendering                                                            |
|------------------------------------|--------|----------------------------------------------------------------------------|
|Indicator                           |SDO     |Card with pattern, valid_from/until, kill_chain_phases as chips, score badge|
|Threat Actor                        |SDO     |Profile-style: name, aliases, sophistication, motivation, resource_level    |
|Malware                             |SDO     |Family card with capabilities, types as chips, is_family flag               |
|Campaign                            |SDO     |Timeline card with first_seen/last_seen, objective                          |
|Intrusion Set                       |SDO     |Similar to Threat Actor; cross-link to related TAs                          |
|Attack Pattern                      |SDO     |MITRE ATT&CK-style: technique ID, tactic phase, link to ATT&CK              |
|Report                              |SDO     |Hero treatment — title, published date, labels, embedded objects list       |
|Identity                            |SDO     |Compact card; usually referenced, not browsed                               |
|Vulnerability                       |SDO     |CVE badge, name, description                                                |
|Course of Action                    |SDO     |Action card                                                                 |
|Observed Data                       |SDO     |Expandable, defers to embedded SCOs                                         |
|Relationship                        |SRO     |Rendered as edges/links on object detail screens, not standalone            |
|Sighting                            |SRO     |Inline on the sighted object                                                |
|SCOs (file, ipv4, domain, url, etc.)|SCO     |Compact value chips, copy-to-clipboard, defang toggle                       |
|Marking Definition                  |meta    |Banner/badge on objects (TLP colors prominent)                              |
|Note / Opinion                      |meta    |Inline expandable on referenced object                                      |

### Relationship resolution

- On bundle load, build an in-memory index: `Map<id, object>` and `Map<id, relationships[]>`
- On object detail screen, resolve `source_ref` / `target_ref` to render related objects as cards
- For large bundles (1000+ objects), lazy-render relationships on tap to avoid jank

### TLP / marking handling

- TLP markings rendered as colored banners at the top of object cards (TLP:RED / AMBER+STRICT / AMBER / GREEN / CLEAR)
- Confidence values shown as bar or numeric badge
- `granular_markings` respected — fields can be individually marked

### Defanging

- SCOs containing URLs, IPs, domains rendered defanged by default (`hxxp://`, `1.1.1[.]1`)
- Tap to reveal real value; copy-to-clipboard offers both fanged and defanged

-----

## 4. UI / UX

### Primary screens

1. **Library** — list of opened/cached bundles, sortable by date, filterable by source
1. **Bundle view** — bundle metadata + object list grouped by type, with search
1. **Object detail** — type-specific rendering with relationships
1. **Search** — across all cached bundles
1. **Settings** — mode selector, GNAT connection, cache management, theme
1. **(GNAT mode) Dissemination feed** — list of recent reports/disseminations

### Navigation pattern

- Bottom tab bar (mobile-friendly) with: Library / Search / Feed (GNAT mode only) / Settings
- Stack navigation within each tab
- Deep-linkable URLs for every object: `/bundle/{bundle_id}/object/{stix_id}`

### Key UX considerations

- **Phone-first sizing** — touch targets ≥44pt (iOS HIG)
- **Dark mode** — default to system; many analysts prefer dark
- **One-handed reachability** — keep primary actions in lower half of screen
- **No modal traps** — back gesture / hardware back must always work
- **Copy-friendly** — every IoC, hash, ID has a tap-to-copy affordance

-----

## 5. PWA-Specific Implementation

### Manifest (`manifest.webmanifest`)

```json
{
  "name": "GNAT Reader",
  "short_name": "GNAT",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0b0d10",
  "theme_color": "#0b0d10",
  "icons": [
    { "src": "/icons/192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "share_target": {
    "action": "/share",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": { "files": [{ "name": "bundle", "accept": ["application/json", ".json"] }] }
  },
  "file_handlers": [
    { "action": "/open", "accept": { "application/json": [".json", ".stix"] } }
  ]
}
```

### Service worker strategy

- **App shell** — precache UI assets (cache-first, versioned)
- **Bundles fetched from GNAT** — stale-while-revalidate, max age 24h
- **STIX object lookups** — cache-first
- **Manifest icons / static** — cache-first, long expiry

### Offline behavior

- App shell always works offline
- Previously opened bundles fully readable offline
- GNAT mode: feed shows last cached snapshot with “offline” indicator and last-sync timestamp
- File open still works offline (just reads from device)

### iOS gotchas to handle explicitly

- **Storage eviction (~7 days inactive)** — on app open, check IndexedDB integrity; if evicted, refetch from GNAT (if configured) or show empty library with a friendly message
- **Push notifications** — iOS 16.4+, requires home-screen install; gate the feature on `Notification.permission` and explain the install requirement
- **Web Share Target on iOS** — incomplete; offer file open as primary, share target as secondary
- **No `beforeinstallprompt` on iOS** — show manual “Add to Home Screen” instructions on first visit from iOS Safari

### Auth (GNAT mode)

- Token stored in IndexedDB, never localStorage
- Optional WebAuthn (Face ID / Touch ID) gate on app open
- Token refresh on app foreground; force re-auth after N days inactive
- All API calls over HTTPS only; reject mixed content

-----

## 6. Development Roadmap

### Phase 0 — Spike (1 week)

- Validate Vite + Svelte + Workbox stack on iPad dev environment (Working Copy)
- Build a single throwaway page that opens a STIX bundle and renders an Indicator
- Confirm IndexedDB works for ~10MB bundles
- Confirm “Add to Home Screen” works on iOS and Android

**Exit criteria:** can install a hello-world PWA on iPad and load a bundle from a file.

### Phase 1 — Standalone reader MVP (3–4 weeks)

- STIX 2.1 parser/ORM (TypeScript), covering all 18 SDOs, all SROs, common SCOs
- Library / Bundle / Object screens
- File open, paste JSON, URL fetch
- Search within a bundle
- IndexedDB persistence
- Service worker app shell, offline support
- Dark mode, basic theming

**Exit criteria:** can open any well-formed STIX 2.1 bundle on iPhone/iPad, navigate it offline.

### Phase 2 — Polish (2 weeks)

- Bookmarks, read/unread state
- Cross-bundle search
- Defanging toggle, copy-to-clipboard everywhere
- Share target / file handler integration
- Empty states, error handling, malformed bundle recovery
- Accessibility pass (VoiceOver, contrast, focus)

**Exit criteria:** ready for internal beta as a generic STIX reader.

### Phase 3 — GNAT mode (2–3 weeks)

- Settings: configure GNAT instance URL + auth
- Dissemination feed view
- Deep links back to GNAT web UI
- Token refresh, biometric gate
- FSA-specific workflows (TBD with GNAT analyst feedback)

**Exit criteria:** internal analysts can use it for triage of GNAT outputs in the field.

### Phase 4 — v1 release (1 week)

- Documentation site
- “Consuming GNAT Outputs” doc cross-links to the reader
- Release announcement, install instructions per platform
- (Optional) Open-source the core as `gnat-reader-core` under Apache 2.0

**Total estimate:** ~10 weeks of part-time work, less if focused.

-----

## 7. Testing Strategy

- **Unit tests** — STIX parser/ORM (Vitest)
- **Integration tests** — bundle loading, IndexedDB persistence, service worker caching
- **Device testing matrix:**
  - iPhone (Safari) — iOS 16.4+, 17, 18
  - iPad (Safari) — iPadOS 17, 18
  - Android phone (Chrome)
  - Android tablet (Chrome)
  - Desktop Chrome, Firefox, Safari
- **Sample bundles** — curate a test set: small (10 objects), medium (100), large (1000+), edge cases (malformed, all SDO types, deep relationship chains)
- **Lighthouse PWA audit** — target 100 on PWA, ≥90 on Performance/Accessibility

-----

## 8. CI/CD

Mirror the GNAT toolchain where applicable:

- **Linting** — ESLint, Prettier
- **Type checking** — `tsc --noEmit`
- **Security** — `npm audit`, CodeQL on the repo, Dependabot
- **Tests** — Vitest in CI
- **Build & deploy** — GitHub Actions → Cloudflare Pages (standalone) or internal infra (GNAT mode)
- **Bundle size budget** — fail the build if main bundle exceeds (e.g.) 200KB gzipped

-----

## 9. Open Questions / Decisions Needed

1. **MDM constraint check** — does your org’s mobile policy require apps to be in an MDM catalog? If yes, plan a Capacitor wrapper for internal distribution.
1. **Open-source scope** — open-source the standalone reader, keep GNAT mode proprietary? Or all-proprietary for v1, open-source later?
1. **Naming** — `gnat-reader`, `stixread`, `gnatview`, something else?
1. **GNAT API surface** — does GNAT expose the endpoints needed (dissemination feed, bundle fetch by ID, auth)? If not, plan that work into GNAT.
1. **Auth model in GNAT mode** — API tokens? OIDC? Re-use existing GNAT auth?
1. **Hosting** — Cloudflare Pages for standalone is easy; where does GNAT-mode build live?
1. **Logo / branding** — gnat (the insect) is a fun mark; commit to it or pick something else?

-----

## 10. Risks

|Risk                                     |Likelihood|Impact|Mitigation                                                        |
|-----------------------------------------|----------|------|------------------------------------------------------------------|
|iOS storage eviction kills cached bundles|High      |Medium|Re-fetch on open; treat cache as transient; clear “last synced” UX|
|MDM policy blocks PWA distribution       |Medium    |High  |Capacitor wrapper as fallback; check policy early                 |
|Large bundles (>50MB) cause perf issues  |Medium    |Medium|Streaming parser; virtualized lists; bundle size warnings         |
|GNAT API doesn’t yet support reader needs|Medium    |Medium|API additions are part of GNAT plan, not blocked on reader        |
|Scope creep into authoring/editing       |High      |High  |Hold the line on read-only; v2 conversation only after v1 ships   |
|iOS Safari quirks delay launch           |Medium    |Medium|Test on iOS early and often; Phase 0 spike validates this         |

-----

## 11. Documentation Deliverables

Independent of the build, produce these now:

- **`docs/consuming-gnat-outputs.md`** — survey of existing options (OpenCTI, MISP, stix2-viewer, raw JSON viewers) with tradeoffs, plus a forward reference to GNAT Reader once it exists
- **`docs/stix-portability.md`** — short note on what STIX portability does and doesn’t get you across device classes
- **`README.md` for gnat-reader repo** — install, usage, screenshots
- **`CLAUDE.md` for gnat-reader repo** — once development starts, define the project context for Claude Code (mirroring the GNAT pattern)