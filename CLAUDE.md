# SONGSS Intelligence — CLAUDE.md
> Permanent context for Claude Code. Read before any action on this project.
>
> **Trimmed 2026-08-24** from 236k → this lean working doc. Full history of
> every RESOLVED / IMPLEMENTED / investigated item and every completed task
> lives verbatim in **`CLAUDE_ARCHIVE.md`** (not auto-loaded — grep it for
> any past decision, fix, lesson, or gotcha). Detailed write-ups are also
> indexed in `memory/MEMORY.md`. When an entry below says "see ARCHIVE", the
> full narrative is there.

---

## 1. WHO WE ARE

**Americascom, Inc.** — Delaware C-Corp, ~10 years in operation.
**Product:** SONGSS Intelligence — AI First music intelligence SaaS platform.
**Founder/CEO:** Gilberto Georg de Arruda (non-technical, 40+ years broadcast journalism).
**Philosophy:** Thinking First™ — quality before speed. No shortcuts.

---

## 2. STACK (DO NOT CHANGE WITHOUT CONFIRMATION)

| Layer | Technology | URL/Location |
|-------|-----------|-------------|
| Frontend App | React + Vite + TypeScript + Tailwind + shadcn/ui | app.songssintelligence.com (Vercel) |
| Landing Page | TanStack Start + Cloudflare Workers | www.songssintelligence.com |
| Backend/API | Supabase self-hosted (Docker, Hostinger VPS) | api.songssintelligence.com |
| Database | PostgreSQL via Supabase | VPS 76.13.27.182 |
| Automation | n8n self-hosted (Docker) | n8n.songssintelligence.com |
| Payments | Stripe via AmericasPay | buyer.americaspay.com |
| Security | Cloudflare WAF + Tunnels | songssintelligence.com |
| Auth | Supabase Auth (GoTrue) | api.songssintelligence.com/auth/v1 |
| GitHub | americascom/songss-intelligence (app) | americascom/songss-landing-page (landing) |

---

## 3. CRITICAL INFRASTRUCTURE (VPS)

/docker/n8n/          → n8n (docker-compose)
/docker/n8n/.n8n/     → n8n SQLite database + encryptionKey
/root/supabase/       → Supabase (docker-compose) — THE REAL, ACTIVE STACK
/docker/supabase/     → ORPHANED/STALE stack, do not use — confirmed 2026-07-06 during
                         auth debugging that its secrets no longer match; the live
                         supabase-auth container reads its .env from /root/supabase/

n8n containers:
- n8n_songss — n8n v2.32.7 (stable), port 5678
- n8n-tunnel-n8n-1 — Cloudflare tunnel. Its token is `CF_TUNNEL_TOKEN`,
  referenced as `${CF_TUNNEL_TOKEN}` in `docker-compose.yml`'s `command:`
  line — rotated 2026-07-23 (was hardcoded in plaintext before). Lives in
  `/docker/n8n/.env` (600 perms), NOT `/docker/n8n/secrets.env` — compose's
  `${VAR}` substitution inside the compose file itself only reads the
  project's `.env`, not `env_file:` entries (those only reach a container's
  own runtime env). Recreate with `docker compose up -d --force-recreate
  tunnel-n8n` after any token change — `restart` won't pick it up.

Docker networks:
- n8n is connected to supabase_default (to reach supabase-auth:9999)
- Without this connection, Supabase Auth calls fail with DNS error

Backups / cron (3 root cron entries):
- /docker/n8n/backup_n8n.sh   → hourly, local n8n backup (7-day retention) → /docker/n8n/backups/
- /docker/n8n/offsite_backup.sh → daily 03:00, encrypted off-site to Cloudflare R2
  (Supabase pg_dumpall + WAL-safe n8n .n8n → gzip → GPG AES-256 → rclone → R2,
  30-day lifecycle). GPG passphrase in secrets.env AND Gilberto's Google Drive.
- /docker/n8n/synthetic_test/watch_n8n_restart.sh → every minute; detects any
  n8n restart, fires a real full purchase-flow synthetic test, alerts Telegram
  (@songss_monitor_bot) only on failure. See ARCHIVE + memory
  `project_synthetic_monitoring_system_2026-08-20`.

Secrets: /docker/n8n/secrets.env (600, git-ignored) holds all n8n API keys +
`N8N_ENCRYPTION_KEY` (see §6), `STRIPE_WEBHOOK_SECRET`, R2 + GPG backup creds,
`TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID`. Set values via
`/root/secrets_upsert.py` (hidden-prompt getpass) so they never hit a transcript.

### Standing operational lessons (full detail in ARCHIVE / memory)
- **`docker compose restart` does NOT reload env/env_file changes** — use
  `docker compose up -d --force-recreate <svc>`. (`restart` is fine only when
  no env var changed, e.g. an image-less code patch to the n8n DB.)
- `--force-recreate` on a named service can also recreate an *unlisted* one
  that shares a `${VAR}` (e.g. `db` recreates when `POSTGRES_PASSWORD` changes).
- **After force-recreating any service Kong proxies to**, if requests hang/502
  though the service reports healthy, `docker compose restart kong` too (stale
  upstream connection, not the service's fault).
- **n8n DB patches use the 3-DB-location method**: `workflow_entity.nodes`
  (what runs) + BOTH `workflow_history` rows (`versionId c8a04b97-…` /
  `activeVersionId a09c4898-…`, unchanged since 2026-07-18). Patching
  `workflow_entity.nodes` alone is NOT enough on 2.32.7.
- **Backups**: use `sqlite3 <db> ".backup <copy>"` (WAL-safe), NOT a plain
  `cp` (misses the -wal sidecar → stale snapshot). Golden Rule 6: back up
  before ANY DB write, no size exception.
- **VPS `node`/`npx` in PATH is v12** (too old for `??`/`?.`). Use
  `/snap/bin/node node_modules/.bin/tsc` / `.../vite/bin/vite.js`.
- **PostgREST schema cache**: new tables/functions 404 (PGRST205/202) via REST
  until `NOTIFY pgrst, 'reload schema';` — send it as part of the migration.
- **New public Postgres functions auto-grant EXECUTE to anon/authenticated** —
  `REVOKE ALL FROM PUBLIC` isn't enough; also `REVOKE EXECUTE FROM anon,
  authenticated`.
- **Adding a field to the PATCH body** to Supabase: the `HTTP Request` node has
  a hardcoded, hand-enumerated field list — new fields are silently dropped
  unless added there too, not just in `Code in JavaScript`.
- **root tsconfig.json is `files:[]`** (solution-style) — a bare `tsc --noEmit`
  falsely passes; always `tsc -p tsconfig.app.json --noEmit`.
- **Verify CLI semantics before running** an unfamiliar subcommand for a
  read-only question (`n8n user-management:reset` once wiped the owner account).
- **Never `SELECT *` on credential/token tables** (once printed 3 live tokens).
- **`git push` shows the live Dependabot summary** in its output.

---

## 4. NIE FLOW (DO NOT BREAK)

Stripe Webhook (checkout.session.completed)
  → Filter → Extract Metadata (customer_email, session_id, plan_name)
  → Create Supabase User → Generate Welcome Link → Send Welcome Email
  → Insert Intelligence Report → Check Duplicate Session → If
    → Plan Router → Config Haiku or Config Opus
      → [10 data sources: Spotify, Deezer, Last.fm, SoundCloud, MusicBrainz,
         Shazam, TikTok, Genius, Jamendo, Perplexity]
        → NIE Engine (Gemini 2.5 Flash) → Merge → Format HTML
        → Save to Supabase → Send Report Email → Save Processed Session

Submit Trigger (POST /webhook/submit-analysis)
  → Validate session_id → Update Artist Name → Fetch Session → continue NIE flow

Active workflow: Songss | NIE V4.2 SEQUENTIAL (05-05) — Published
ID: 8SRNZDEpZKu88qFz (corrected 2026-07-06 — the previously recorded ID
    QH6GH3i8TQD75Glp is stale/wrong, confirmed via `docker exec n8n_songss
    n8n list:workflow`; verify against that command if it drifts again)

Note: this same workflow also has a second webhook trigger, "Submit Trigger"
at POST /webhook/submit-analysis, used by the app's /submit page after checkout
to kick off the actual NIE report generation (Update Artist Name → Fetch
Session Data → Submit Context → Plan Router → NIE engine).

Other separate n8n workflows (NOT the NIE pipeline): "SONGSS Lead Magnet",
"Opus Maximus Lead Capture" (webhook /webhook/opus-lead, email-only),
"Geo Activity — Last.fm Poller" (every 20min → geo_activity table),
"Content Automation — Video Captioning" (`contentAutomationCaption01`,
inactive, see §11). Deploy brand-new workflows via `n8n import:workflow`;
edit the *existing* NIE workflow via the 3-DB-location SQL method (§3).

KNOWN DOC GAP: the "Insert Intelligence Report → Check Duplicate Session → If"
step above does not reflect live wiring. The "Check Duplicate Session" node
exists in the workflow but has zero inbound connections — confirmed disconnected
in every backup on file, including the earliest one predating all remediation
work (2026-07-07 14:05, before any Claude Code session touched this workflow).
Its original purpose is unknown (Gilberto doesn't recall it either); by its
query shape (filters processed_sessions by Extract Metadata's session_id, on
the Stripe-webhook Phase 1 path) it looks like it was meant to catch duplicate
Stripe webhook deliveries, but this is inferred, not confirmed. As of
2026-07-09 its hardcoded Supabase JWT was migrated to the shared
"Supabase Service Role Auth" credential for security, but it was deliberately
left disconnected rather than rewired. Live duplicate-Stripe-webhook
protection may not currently exist at all; worth deciding whether that's a
real gap to fix or dead code to remove.

### Real, computed metrics (all deterministic from real `structured_data`, NOT AI-guessed)
These were reworked one at a time (Jul–Aug 2026) to replace AI "estimate by
tone" free-text with code-computed formulas anchored on real fetched data.
Full formulas/derivations in ARCHIVE + the named memory files. All null
(never a fabricated constant) when their real source is missing.
- `retention_rate` — Multi-Platform Loyalty Index (Spotify follow-conversion
  0.50 + Last.fm repeat-depth 0.30 + TikTok engagement 0.20, renormalized).
  See `project_retention_rate_real_formula_2026-07-23`.
- `ltv_projection` — `round(monthly_listeners × 0.012 × 24 × (0.5 +
  retention_rate/100))`. `project_ltv_projection_real_formula_2026-07-25`.
- `growth_trajectory` — 6-mo compounding off monthly_listeners × bounded
  retention multiplier. `project_growth_trajectory_real_formula_2026-07-26`.
- `social_engagement_index` — `min(100, round(tiktok engagement_rate × 100 /
  20))`, null if TikTok unresolved. `project_social_engagement_index_2026-07-18`.
- `fan_loyalty_index` — `round(0.6×SEI + 0.4×retention_core)` (TED excluded to
  avoid double-count). `project_fan_loyalty_index_2026-08-01`.
- `digital_score` (SNIE™) — AI-extracted but code-clamped 0–100.
- `monthly_streams` — REMOVED (was AI-fabricated); UI shows real
  `spotify_data.monthly_listeners` instead.
- **Spotify identity guard** — whole-word name compare vs `spotify_data.name`;
  on mismatch zeroes listeners/followers so downstream nulls out (fixes the
  MaLu→Maluma collision). `project_spotify_identity_guard_verified_2026-08-18`.

### Still-open / not-fixed items in the NIE pipeline
- **`execution_entity` finalization bug** (2026-07-17, unresolved): n8n
  sometimes never writes final `status`/`stoppedAt` even though every node
  succeeded and real Postgres writes happened. Real work persists; only n8n's
  own execution history is wrong. Likely delayed, not lost. See ARCHIVE +
  `project_execution_entity_finalization_investigation_2026-07-17`.
- **Extraction step tier-blindness** (open): `Edit Fields` always reads the
  premium `NIE — Neural Intelligence Engine` report regardless of tier — now
  only affects `digital_score` + `geo_hotspots` (the metrics above are
  code-computed and no longer read from it). Tracked in §11.
- **Pipeline never differentiated models by tier** — every tier runs the same
  hardcoded `gemini-2.5-flash`; §7's Haiku/Sonnet/Opus claims were never true.
  Tracked in §11.
- **`apikey` header still hardcoded** on all 9 Supabase-writing nodes (the
  `Authorization` header is credential-backed; n8n's `httpHeaderAuth` injects
  only one header, so `apikey` stays raw — a known Golden Rule 4 structural
  gap). See `feedback_hardcoded_apikey_header_all_7_migrated_nodes`.

RESOLVED history (Stripe signature gate + its $binary regression, all the
metric reworks, Industry Buzz Tracker, Spotify Artist Link, and every bug
fix): see ARCHIVE §4.

---

## 5. SUPABASE DATABASE

Tables:
- intelligence_reports (session_id, customer_email, artist_name, plan_name,
  report_html, report_markdown, geo_hotspots, engagement_metrics, user_id)
- teams (owner_user_id, member_user_id) — seats for Growth+ plans
- geo_activity (region PK, city, lat, lng, track_count, total_listeners,
  top_track, updated_at) — real Last.fm data for the Home page Predictive
  Globe, polled every 20min by the "Geo Activity — Last.fm Poller" n8n
  workflow; anon/authenticated SELECT-only, service_role writes
- plan_limits (per-plan_key quota values) — anon/authenticated SELECT

RPC SECURITY DEFINER (never direct SELECT on intelligence_reports):
- get_report_by_session(p_session_id text)
- get_quota_status() — team-pooled quota {plan_name, used, monthly_limit}
- request_new_report(p_artist_name) — quota-checked new report row
- pool_owner_id / pool_member_ids — internal team-pooling helpers

Public view:
- public_geo_hotspots (geo_hotspots, created_at) — for NeuralWorldMap component

RLS: enabled on all 5 public tables. Direct reads on intelligence_reports
blocked for anon. Always use RPC.

---

## 6. AUTHENTICATION

- Supabase Auth at supabase-auth:9999 (internal Docker)
- Users created by n8n after Stripe payment
- Initial password = Stripe session_id
- GoTrue SMTP: fixed 2026-08-22 (was pointing at a non-existent container) —
  now uses n8n's real Zoho app-password; "Forgot password?" delivers. See
  ARCHIVE + `project_gotrue_smtp_fix_plan_2026-08-22`.
- n8n encryptionKey: rotated 2026-07-30 (was exposed 2026-07-09) — see ARCHIVE
  for the full procedure. Do not change again without following it (dry run on
  a scratch container first, export-decrypted → swap key in config+secrets.env
  together → import to re-encrypt → live-verify).
- Now stored as `N8N_ENCRYPTION_KEY` in /docker/n8n/secrets.env (promoted
  from config-file-only on 2026-07-30) — config file at /docker/n8n/.n8n/config
  must always match it exactly, or n8n refuses to start (hard validation).
  Key value: never commit or print either location.

---

## 7. PRICING (DEFINITIVE — Do not change without authorization)

Artist Indie: $9.90/mo | 4 queries | Haiku
Growth: $29/mo | 12 queries | Haiku
Pro/Team: $99/mo | 50 queries | Sonnet
Enterprise: $299/mo | 150 queries | Sonnet + GPT-4o
Opus Maximus: $1,500/mo or $12k/yr | 1,500 queries | Opus (Taylor Made — no self-service)
Opus + Compliance: $3,000/mo or $24k/yr | 1,500 queries | Opus + IBM watsonx

CAVEAT (open, tracked in §11): the per-tier model claims above have never
reflected the pipeline — every tier runs the same hardcoded `gemini-2.5-flash`.
Either build real per-tier routing or rewrite this table. The IBM Granite
initiative referenced in older docs was CANCELLED 2026-08-15 (dead plumbing
left in place; nothing sets `granite_powered` true).

---

## 8. CLOUDFLARE WAF (5 active rules)

1. Block datacenter bots — ASNs {396982,16509,14618,15169,8075} except /webhook/stripe-webhook
2. Block high-risk countries — CN, RU, KP, IR
3. Block suspicious user agents — python-requests
4. Protect submit endpoint — Managed Challenge without correct Referer
   (scoped to POST only as of 2026-08-16 — OPTIONS preflights pass, see ARCHIVE
   "Douglas" for why blocking OPTIONS broke all submissions)
5. Protect n8n Webhook Endpoint

---

## 9. DEPLOY

App (Vercel): push to main → automatic deploy
Landing page: MANUAL via terminal only:
  export CLOUDFLARE_API_TOKEN=<create on the spot, revoke after use>
  cd /root/songss-landing-page && npm run build
  cd dist/server && npx wrangler deploy
  (npm run build now auto-copies wrangler.json into dist/server via
   scripts/ensure-wrangler.mjs — the old manual `cp` step is no longer needed)

WARNING: no_bundle was removed from wrangler.json — do NOT add it back
WARNING: Cloudflare CI is disconnected — always deploy manually
WARNING: `wrangler.json`'s `assets.html_handling: "none"` is intentional —
  do NOT remove it. Cloudflare's default assets handling 307-redirects any
  request for a literal `*.html` path to its extensionless equivalent, which
  broke Google Search Console domain-ownership verification (its verifier
  fetches the exact `.html` URL and doesn't follow the redirect). The site is
  fully SSR'd through the Worker, so disabling it has no effect on normal
  behavior. Fixed+committed 2026-08-15 (`eca540f`), incl. the verification
  file `public/google5b3546be51c87f40.html`.

---

## 10. GOLDEN RULES (NEVER VIOLATE)

1. Do not modify n8n workflow without confirmation
2. Do not change n8n encryptionKey without following the documented
   rotation procedure (§3/§6) — dry run on a scratch container first
3. Do not use docker pull n8n:latest — always use n8nio/n8n:stable
4. Do not expose Supabase service_role key — use n8n Credentials
5. Do not add no_bundle to wrangler.json
6. Always backup before touching the database:
   cp /docker/n8n/.n8n/database.sqlite /docker/n8n/backups/manual_$(date +%Y%m%d_%H%M%S).sqlite
   (prefer `sqlite3 … ".backup"` for WAL-safety — see §3)
7. Cloudflare tokens: create → use → revoke immediately
8. RLS: never use USING(true) on intelligence_reports SELECT policies

---

## 11. ACTIVE TASKS (open only — completed items are in CLAUDE_ARCHIVE.md §11)

### Uncommitted git state to be aware of (flagged in prior sessions, verify)
- Artist Identity MVP (Submit.tsx + backend patch), "Limited" badge for null
  metrics, Opus lead-capture (Opus.tsx), and possibly others were marked "not
  committed to git" when written up. Check `git status` / `git log` before
  assuming they're live; commit if confirmed good.

### n8n / backend
- [ ] **Content Automation — Video Captioning** (`contentAutomationCaption01`)
      — inactive. Drive folder ID repointed to "ParaPostar Songss NIE"
      (`1NSQyPD8e8bYLJdFY2zxPg8RdZaUDSJfs`) 2026-08-23. Before go-live:
      (1) Gilberto connects Google Drive OAuth2 + Anthropic creds via n8n UI;
      (2) confirm that Drive account can access the new folder; (3) end-to-end
      test (upload video → caption .txt lands back) before activating. See §4.
- [ ] **Extraction step tier-blindness** — `Edit Fields` always reads the
      premium NIE report regardless of tier (now only affects `digital_score`
      + `geo_hotspots`). Part of the LTV/predictive-metrics rework; the three
      metric formulas themselves are DONE.
- [ ] **Pricing table model differentiation never existed** — Haiku/Sonnet/Opus
      per-tier claims are false; all tiers run hardcoded `gemini-2.5-flash`.
      Either build real per-tier routing or rewrite §7. Its own session.
- [ ] **Supabase pooler/realtime/functions crash loops** — non-blocking, not on
      the live customer path. pooler: Cloak/cipher key mismatch; realtime: Ecto
      migration error; edge-functions: no entrypoint (never deployed). All
      authenticate to Postgres fine before failing. Needs its own session.
- [ ] **IBM Granite dead plumbing cleanup** — initiative CANCELLED 2026-08-15.
      `granite_powered` column + Report.tsx badge/Terms §20 left as harmless
      dead plumbing (nothing sets the flag). §7 still has stale Granite language
      to drop. Low priority; same "leave the unused field" pattern.

### Frontend
- [ ] **Fan Loyalty Index — frontend display** — backend formula live+populated
      (2026-08-01); no KPI tile/section yet. Placement/design deferred by
      Gilberto to a fresh-eyes session.
- [ ] **Artist Radar/Funnel polish** (from 2026-07-27 visual QA): Revenue
      Snapshot bar-label rendering issue; PDF export theme/styling check for the
      new Engagement Pyramid/Radar sections.
- [ ] **AI First strategy** — update positioning on app + landing pages.
- [ ] **RTK (Redux Toolkit)** — incremental adoption: auth, report, artist, ui slices.
- [ ] **graphify syntax-error flags** (2026-08-10): `src/pages/Pricing.tsx`
      (line ~109) and `src/pages/Privacy.tsx` (line ~892) partially parsed —
      confirm real bug vs tree-sitter artifact (neither reported broken live).

### Security / deps / infra
- [ ] **npm dependency audit** — browser-bundle vulns all CLOSED (react-router-dom
      6.30.6, d3-color 3.1.0, js-yaml). Remaining: dev-tooling batch (vite,
      rollup, esbuild, postcss, lodash, etc. — build-time only, not shipped);
      do a careful isolated diff-check, not a blind `npm audit fix`. Dependabot
      alerts (34: 15 high / 17 mod / 2 low) — Gilberto reviews the tab directly
      (needs his GitHub access). See `project_npm_audit_2026-08-09` + §11 ARCHIVE.
- [ ] **MFA on Supabase Studio** (also Kong port rebind — see
      `project_supabase_studio_hardening_2026-07-08`).
- [ ] **Team quota pooling** — logic DONE + live-verified; no invite/team-mgmt UI
      exists yet (`teams` rows seeded by hand). Real invite flow is future work.
- [ ] **USPTO** — trademark SONGSS Intelligence (Class 42) and NIE.
- [ ] **n8n workflow visual layout** — reorganize for readability.

### Known accepted tradeoffs (do NOT "fix" without checking Gilberto first)
- **Globe marker-label overlap** near front-center during rotation. The
  occlusion fix (`occlude`/`zIndexRange` on `<Html>`) was tried 2026-08-19 and
  explicitly REVERTED — it changed the felt "aliveness" (labels popping in/out)
  Gilberto prefers. Overlap is an accepted tradeoff. See
  `feedback_globe_occlusion_reverted_2026-08-19`.
- **Revenue card on Home** stays permanently empty — Last.fm has no monetary
  data; "no number" is correct, not a gap. (`project_geo_activity_globe_2026-08-19`)
- **TikTok/Instagram no auto-lookup** — product decision, not a bug; Submit form
  has "Recommended" nudges instead.

---

## 12. CONTACTS

Email: hello@songssintelligence.com
Company: Americascom, Inc. — 651 N Broad St, Ste 206, Middletown, DE 19709, USA
Stripe Portal: https://buyer.americaspay.com/p/login/bJe4gz9tjbuTfSa1zL3cc00
Supabase Studio: https://studio.songssintelligence.com
n8n: https://n8n.songssintelligence.com (admin@songssintelligence.com)

---

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
