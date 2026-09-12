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
- **Any node-as-PID1 container without `init: true` leaks zombies from its own
  Docker `HEALTHCHECK`** — a `CMD-SHELL` healthcheck that spawns a subprocess
  every few seconds (e.g. `node -e "fetch(...)"`) never gets reaped if PID 1
  doesn't handle `SIGCHLD`. Found on `supabase-meta` 2026-09-11 (~3,800 zombies,
  slow CPU-load leak, easily mistaken for an unrelated container crash-looping —
  it was misreported as imgproxy/Kong at first, both of which were actually
  fine). Fix: add `init: true` to the service in `docker-compose.yml`, then
  `docker compose up -d --force-recreate <svc>` (compose-file changes need
  force-recreate, not `restart`). See `project_supabase_meta_zombie_fix_2026-09-11`.
  **Also**: after any `docker restart`/`stop`, verify `.State.Status`/
  `.State.Running` explicitly — a hung restart can leave a container stopped
  without `restart: unless-stopped` re-triggering.
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

### `/root/report-generator` — now the live model backend for the NIE pipeline (confirmed 2026-09-03)
A FastAPI service (`report-generator`, Docker container, port 8001→8000,
attached to the `n8n_n8n-net` docker network — declared in its own
`docker-compose.yml` as of 2026-09-05, so this attachment now survives
`--force-recreate`/`up -d`; before that it was a manual `docker network
connect` that silently dropped on recreate, see the network-gotcha entry
below) that generates all 3 of the NIE pipeline's LLM calls — see the
"3 LLM calls, not 1" breakdown below.
Originally found undocumented 2026-08-31 (see CLAUDE_ARCHIVE.md for that
discovery + the Golden Rule 4 service_role-key-exposure fix from that day).
As of 2026-09-03 it has been rebuilt, verified against the live model APIs,
wired into the production workflow, and confirmed working end-to-end via a
real synthetic purchase-flow test (execution #982) — this is no longer an
unverified/orphaned service. Full history in memory
`project_report_generator_luna_opus_routing`.

- **Model routing**: `gpt-5.6-luna` (OpenAI) for every tier except Opus
  Maximus; `claude-opus-4-8` (Anthropic) for Opus Maximus only. Both models
  are new enough that their API surfaces had real gotchas found only by
  testing live (no `temperature` support on either the OpenAI reasoning model
  or the installed Anthropic SDK 1.3.0; `gpt-5.6-luna` needs
  `max_completion_tokens` and `reasoning_effort="low"` or it can silently
  burn its whole token budget on reasoning and return empty). **Re-verify
  against the live APIs before trusting `main.py`'s handling if either model
  updates.**
- **No longer holds Supabase credentials at all** — the earlier Golden Rule 4
  service_role-key exposure was fixed by removing the write path entirely,
  not just relocating the key. n8n's existing `Insert Intelligence
  Report`/`HTTP Request` nodes remain the sole write path to
  `intelligence_reports`.
- **Endpoint**: `POST http://report-generator:8000/generate` with
  `{report_type: "nie_main"|"indie_coach"|"json_extract", ...}`, returns
  `{"output": "<string>"}`. Ported prompts verbatim from the Gemini nodes it
  replaced, so branding/formatting is unchanged.
- n8n's `NIE — Neural Intelligence Engine`, `NIE — Indie Coach`, and `AI
  Agent` nodes are now `httpRequest` nodes calling this service (were
  `@n8n/n8n-nodes-langchain.agent` on Gemini before 2026-09-03). The 2
  `Google Gemini Chat Model` sub-nodes are left in place but disconnected,
  not deleted, for cheap rollback.

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
- ~~Extraction step tier-blindness~~ — RESOLVED 2026-09-05 (see
  `project_tier_depth_ceiling_fix_2026-09-05` for full detail): the entire
  numeric/visual report (retention, LTV, growth trajectory, revenue charts)
  used to be identical across every tier; real depth differentiation now
  runs server-side in `Code in JavaScript` (new `TIER_DEPTH` ladder truncates
  `geo_hotspots`/`growth_trajectory` per tier before persisting, gates real
  `revenue_economics` to Enterprise+ only). Also added: `retention_rate`/
  `fan_loyalty_index` ceiling flags (100%-cap-and-flag, real math not a data
  bug); a new IF node so `GPT-4o — Financial Analysis`/`Gemini — Brand
  Intelligence` are only called for Enterprise+ instead of every tier.
  **LIVE and verified for Indie AND Enterprise** (real synthetic
  purchase-flow tests). Growth/Pro tiers still untested-live (same code
  path, only the `TIER_DEPTH` branch differs; unit-tested only). Frontend
  changes committed 2026-09-05 (`d332be6`), **not yet pushed**.
- ~~GPT-4o — Financial Analysis had an invalid OpenAI key~~ — RESOLVED
  2026-09-05: turned out to be three separate, independently-discovered
  bugs stacked on top of each other, not one. (1) The node's `Authorization`
  header was already `Bearer {{ $env.OPENAI_API_KEY }}`, never a hardcoded
  literal — no Rule-4 exposure, no rewiring needed (corrects this entry's
  earlier text). (2) n8n's own `OPENAI_API_KEY` (`/docker/n8n/secrets.env`)
  was genuinely invalid/revoked; Gilberto set a working key via
  `secrets_upsert.py`. (3) `/root/report-generator` has its own **separate**
  `secrets.env` (different file, untouched since 2026-09-03) with its own
  independently-stale key — `secrets_upsert.py` gained a `--path` flag
  (see `reference_secrets_upsert_path_flag`) so Gilberto could set it there
  too. (4) Force-recreating `report-generator` to load its new key then hit
  the network-attachment gotcha below. All fixed; confirmed via a real
  Enterprise-tier synthetic purchase-flow test end-to-end.
- ~~report-generator loses its n8n_n8n-net attachment on recreate~~ —
  RESOLVED 2026-09-05: its `n8n_n8n-net` link was only ever attached
  manually (`docker network connect`), not declared in its own
  `docker-compose.yml`, so any `--force-recreate`/`up -d` silently dropped
  it (surfaced as an `NIE — Neural Intelligence Engine` DNS error, easy to
  mistake for a credential problem). Fixed for good by adding a `networks:`
  block to `/root/report-generator/docker-compose.yml` declaring
  `n8n_n8n-net` as `external: true` — mirrors `/docker/n8n/docker-compose.yml`'s
  own pattern for the same network. No more manual reconnect needed.
- ~~Pipeline never differentiated models by tier~~ — RESOLVED 2026-09-03: the
  pipeline now routes through `/root/report-generator` (§4) with real
  per-tier model selection (`gpt-5.6-luna` default, `claude-opus-4-8` for
  Opus Maximus). §7's specific Haiku/Sonnet/Opus table text is still stale
  and needs rewriting to match — tracked in §11 — but the underlying
  "every tier is hardcoded to one model" gap itself is closed.
- **`apikey` header still hardcoded** on all 9 Supabase-writing nodes (the
  `Authorization` header is credential-backed; n8n's `httpHeaderAuth` injects
  only one header, so `apikey` stays raw — a known Golden Rule 4 structural
  gap). See `feedback_hardcoded_apikey_header_all_7_migrated_nodes`.
- ~~TikTok × DSP Correlation / NPV Projection were 100% fabricated~~ —
  RESOLVED 2026-09-05/06 (see `project_fabricated_data_audit_2026-09` for
  full detail): a systematic audit (triggered by finding the old Revenue
  Snapshot and TikTok×DSP fabrications) found `Report.tsx`'s `tiktokDSP`
  fell back to a fake `Math.sin()`-noise 12-week dataset on **every single
  report** (`em.tiktok_dsp`/`viral_correlation` never exist anywhere in the
  pipeline — confirmed against a real Enterprise sample row), and `npv`
  applied two undisclosed made-up constants (18%/yr growth, 10% discount)
  to the one real `ltv` number, marketed as "NPV financial modeling." Both
  now show an honest `PendingDataState` ("Pending Data", gray — distinct
  from the amber "⚠️ Limited" used for data-quality-guard suppression)
  instead of fabricating. New shared `PendingDataState` component in
  `shared.tsx`. Verified against real Supabase data (Enterprise sample row
  confirms both fields absent → Pending path fires), typechecked clean.
- ~~5 more fabricated-data findings from the same audit~~ — RESOLVED
  2026-09-06 (see `project_fabricated_data_audit_2026-09` for full detail):
  all 5 launch-blocking items fixed in both `Report.tsx` and
  `ArtistIndieReport.tsx`, zero exceptions per Gilberto's directive.
  1. **SNIE™ Score hardcoded fallback `72`** — replaced with null-preserving
     `digital_score == null ? null : Number(...)`.
  2. **Monthly Listeners hardcoded fallback** (`12500`/`28000`) — replaced
     with null-preserving logic so the Spotify identity-guard's zero no
     longer gets converted back into a fake listener count.
  3. **Fabricated fallback markets** (hardcoded US/Brazil/UK) — removed;
     empty `geo_hotspots` now renders the existing per-slot "Market Pending"
     placeholder honestly. Bonus fix found during verification: the old
     `normalize()` was also stamping a fake `[84,78,73]`-style score onto
     **real** markets whenever `geo_hotspots` had no `.score` field (true of
     every live row checked) — now shows "—" instead of a fabricated number.
  4. **Compounding fabricated recommendation text** — the boilerplate
     "Three Moves" fallback (which quoted finding 3's fake country) is
     gone; renders the new gray `PendingDataState` when fewer than 3 real
     recommendations exist.
  5. **Curator Pitch fallback text** — the identical hardcoded sentence is
     gone; renders `PendingDataState` only when no real per-artist text can
     be extracted from the model's markdown.
  Verified against the real Enterprise sample row (Billie Eilish,
  `cs_test_a15W...`): `digital_score`/`monthly_listeners` real → render as
  real; `geo_hotspots` real but scoreless → "—" per market; `em.recommendations`/
  `actions` both `null` → Pending branch fires; real `## Executive Summary`
  in `report_markdown` → `curatorPitch` still extracts genuine text (Pending
  path only fires when truly nothing real exists). Typechecked clean.
  Lower-priority items from the same audit (not launch-blocking per
  Gilberto, tracked in the memory not here, still open): `geo_hotspots[].value`
  AI-invented dollar estimates (persisted, not currently rendered), unused
  `engagement_metrics.engagement_score` AI passthrough, and the static
  "$100 Budget" illustrative badge.

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
- artist_metric_snapshots (added 2026-09-06, see `project_artist_traction_growth_2026-09-06`)
  — immutable per-source/metric historical observations, one row per
  (artist_key, source, metric_name, UTC day), powers real Observed Growth.
  No `artists` table exists, so `artist_key` is a text identity substitute
  (`spotify:<id>` when Spotify resolved, else `name:<normalized>`), not a
  UUID FK. Deny-all RLS (service_role only) — read only via the RPCs below.
  Populated by a trigger on intelligence_reports (`trg_capture_artist_
  metric_snapshots`), not by n8n — fires on the exact same insert/update n8n
  already performs, zero workflow changes. Only 7 real controlled-vocabulary
  metrics exist today (spotify_followers/monthly_listeners, youtube_
  subscribers/channel_views, tiktok_followers/engagement_rate, instagram_
  followers) — Last.fm/MusicBrainz/Deezer/SoundCloud/Shazam/Genius are
  fetched but only feed the LLM's prose, never persisted as numbers;
  Boomplay/Audiomack aren't in this pipeline at all.

RPC SECURITY DEFINER (never direct SELECT on intelligence_reports):
- get_report_by_session(p_session_id text)
- get_quota_status() — team-pooled quota {plan_name, used, monthly_limit}
- request_new_report(p_artist_name) — quota-checked new report row
- pool_owner_id / pool_member_ids — internal team-pooling helpers
- get_current_traction(p_session_id text) — added 2026-09-06. Real, weighted
  0-100 classification from whatever of the 7 real signals above resolved
  for this artist; weights re-normalize when a source is missing. Never
  called "growth" — replaces the old NPV Projection Pending Data state in
  `RevenueModelAdvanced.tsx` (Enterprise+ only).
- get_observed_growth(p_session_id text, p_metric_name text default
  'spotify_monthly_listeners') — added 2026-09-06. Real MoM delta between
  two snapshots 28-35 days apart for the same artist_key/metric; returns
  `collecting_history`/`insufficient_comparable_history` (never a fabricated
  percentage) until that real history exists — which for virtually every
  artist today means it stays in that state until they get re-analyzed a
  month+ later. Optional benchmark classification (Orphiq/Push Music growth
  bands) and IFPI macro market_context are narrative-only, tagged
  `not_artist_growth`, never blended into the real delta.

`src/lib/tractionNarrative.ts` (added 2026-09-06) — `generateTractionNarrative()`
turns the two RPCs above into executive-level prose ("Current Traction
Assessment" block in `RevenueModelAdvanced.tsx`). Deliberately a
**deterministic template function, not an LLM call** — it can only ever
state a number/source/category present in its typed input, never invent
one, which was the whole point given this feature exists specifically to
replace a fabricated NPV assumption. Structurally guarantees a growth
percentage is only ever printed when `observed_growth.status === "observed"`
(every other code path returns before touching `.value` at all — see the
function body comment). 7 scenario tests (no vitest/jest in this repo, so
plain-assertion + esbuild/node, same pattern as the SQL tests above) in
`src/lib/__tests__/tractionNarrative.test.ts`.

Public view:
- public_geo_hotspots (geo_hotspots, created_at) — for NeuralWorldMap component

RLS: enabled on all public tables including artist_metric_snapshots. Direct
reads on intelligence_reports blocked for anon. Always use RPC.

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
- Supabase `JWT_SECRET`/`ANON_KEY`/`SERVICE_ROLE_KEY`: rotated 5 times
  (2026-07-28, 08-11, 08-13, 09-08, 09-10 — #5 forced by a transcript
  exposure of #4's keys during a "Forgot password" incident investigation).
  See ARCHIVE for the full procedure. No JWKS/dual-key rotation is
  configured on this instance, so rotating `JWT_SECRET` always invalidates
  every logged-in session — no zero-downtime path exists. The n8n
  workflow's `versionId` (one of the 3 patch locations for the 9 hardcoded
  `apikey` headers) moves every time the workflow is edited — re-verify it
  live via `workflow_entity`/`workflow_history` before trusting any
  previously-recorded value, including this doc's.
- **The "Geo Activity — Last.fm Poller" workflow has its own separate
  hardcoded `apikey` header** (on its "Upsert to Supabase" node) — not one
  of the 9 NIE-workflow nodes, easy to forget. Rotation #5 (2026-09-10)
  found it, patched. Its `Authorization` header is credential-backed via
  the same shared "Supabase Service Role Auth" credential as the NIE
  workflow, so only the `apikey` field needs its own patch going forward.
  This node's history table has only 1 `workflow_history` row (no separate
  `activeVersionId`), so it's a 2-location patch, not 3.

---

## 7. PRICING (DEFINITIVE — Do not change without authorization)

Artist Indie: $9.90/mo | 4 queries | Haiku
Growth: $29/mo | 12 queries | Haiku
Pro/Team: $99/mo | 50 queries | Sonnet
Enterprise: $299/mo | 150 queries | Sonnet + GPT-4o
Opus Maximus: $1,500/mo or $12k/yr | 1,500 queries | Opus (Taylor Made — no self-service)
Opus + Compliance: $3,000/mo or $24k/yr | 1,500 queries | Opus + IBM watsonx

CAVEAT (open, tracked in §11): the per-tier model names above (Haiku/Sonnet/
GPT-4o/Opus/watsonx) do not reflect the pipeline. As of 2026-09-03 the NIE
workflow routes through `/root/report-generator` (§4) with a real but simpler
two-way split — `gpt-5.6-luna` for every tier except Opus Maximus,
`claude-opus-4-8` for Opus Maximus only — not the four-way Haiku/Sonnet/Opus
breakdown this table describes. Per-tier routing now genuinely exists (it
didn't before 2026-09-03), but this table's specific model names are stale
and still need rewriting to match. The IBM Granite initiative referenced in
older docs was CANCELLED 2026-08-15 (dead plumbing left in place; nothing
sets `granite_powered` true).

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
- [ ] **Artist Traction/Growth system — Phase 2 follow-ups** (built
      2026-09-06, see `project_artist_traction_growth_2026-09-06`): Phase 1
      (Current Traction, real signal snapshots, Observed Growth eligibility
      gating) is live and verified. Deliberately NOT built this session,
      each its own future piece: (1) a scheduled daily/weekly polling job
      to re-fetch metrics independently of report purchases, so history
      accumulates faster than "only when someone buys a re-analysis"; (2)
      persisting Last.fm/MusicBrainz (and any other already-fetched-but-
      discarded source) as real structured columns so they can join the
      controlled vocabulary — requires an n8n workflow change, Golden Rule
      1 confirmation needed first; (3) a real `artists` identity table if
      artist-identity resolution ever needs to be more robust than the
      current text `artist_key` substitute.
- [ ] **OpenAI Migration (HALTED)** — 2026-08-28 attempt to replace Gemini Brand Intelligence
      node with OpenAI via Code node + this.helpers.httpRequest() discovered pre-existing
      report-generation pipeline failure + database corruption across all backups. Halted.
      See `memory/openai_migration_2026_08_28.md` for full analysis. PLAN: Restore clean
      pre-2026-08-28 backup, verify original pipeline works, THEN retry OpenAI migration
      carefully with incremental testing. Prompts preserved in /tmp/ for tomorrow. DO NOT
      ATTEMPT RECOVERY TONIGHT.
- [ ] **Content Automation — Video Captioning** (`contentAutomationCaption01`)
      — inactive. Drive folder ID repointed to "ParaPostar Songss NIE"
      (`1NSQyPD8e8bYLJdFY2zxPg8RdZaUDSJfs`) 2026-08-23. Before go-live:
      (1) Gilberto connects Google Drive OAuth2 + Anthropic creds via n8n UI;
      (2) confirm that Drive account can access the new folder; (3) end-to-end
      test (upload video → caption .txt lands back) before activating. See §4.
- [ ] **Growth/Pro tiers untested-live** — spillover from the now-resolved
      tier-depth/ceiling fix (§4, `project_tier_depth_ceiling_fix_2026-09-05`).
      Same code path as Indie/Enterprise (only the `TIER_DEPTH` branch
      differs) and passed a standalone unit harness, but never fired
      through an actual n8n execution. Low priority; spot-check opportunistically.
- [ ] **§7 pricing table text is stale** — per-tier model routing now genuinely
      exists (`gpt-5.6-luna` default / `claude-opus-4-8` for Opus Maximus via
      `/root/report-generator`, done 2026-09-03, see §4), but §7's own
      Haiku/Sonnet/Opus/watsonx text was never updated to match and still
      describes the old four-way split. Just needs the table text rewritten.
- [ ] **Supabase pooler/realtime/functions/analytics crash loops** — non-blocking,
      not on the live customer path. pooler: Cloak/cipher key mismatch; realtime:
      Ecto migration error; edge-functions: no entrypoint (never deployed);
      analytics (Logflare): same category, `relation "oban_jobs"/"system_metrics"
      does not exist` — missing Ecto migrations, recurs after every
      `docker compose up -d --force-recreate` that touches the Supabase stack
      (confirmed again 2026-09-11, load avg ~50 on this 2-core VPS from the
      restart-crash churn alone). All authenticate to Postgres fine before
      failing. **2026-09-11 mitigation, session-scoped only**: `docker update
      --restart=no supabase-analytics` stopped the churn (load ~50→~30) but does
      NOT fix the underlying missing migrations — the next full-stack
      `docker compose up -d --force-recreate` (e.g. a future JWT rotation) will
      reset the restart policy back to whatever `docker-compose.yml` declares
      and the crash loop will resume. Needs its own session to actually run the
      missing migrations.
- [ ] **supabase-meta HEALTHCHECK exceeds its 5s timeout** — pre-existing,
      unrelated to the 2026-09-11 zombie-leak fix (§3). The healthcheck itself
      (`node -e "fetch('http://localhost:8080/health')..."`) spawns a full
      Node/V8 process every 5s and that spawn alone can exceed the 5s timeout,
      reporting `unhealthy` even though the server is confirmed up and logging
      normally. Not urgent/not blocking. Fix options: raise the timeout, or
      replace with a lighter check (no `wget`/`curl` in this image — would
      need a smaller probe). See `project_supabase_meta_zombie_fix_2026-09-11`.
- [ ] **IBM Granite dead plumbing cleanup** — initiative CANCELLED 2026-08-15.
      `granite_powered` column + Report.tsx badge/Terms §20 left as harmless
      dead plumbing (nothing sets the flag). §7 still has stale Granite language
      to drop. Low priority; same "leave the unused field" pattern.

### Frontend
- [ ] **URGENT, customer-facing: app.songssintelligence.com login + Forgot
      Password both fail with 401 Unauthorized** (2026-09-11, see
      `project_app_login_vercel_build_mystery_2026-09-11`). Root cause traced
      to Vercel deterministically serving a completely wrong, unrelated JS
      bundle — verified via direct alias-independent per-deployment URL, not
      a domain/DNS/Cloudflare/cache issue (all individually ruled out with
      hard evidence). Along the way found (and Gilberto immediately revoked)
      a **leaked Anthropic API key hardcoded in that wrong bundle** — that
      sub-thread is closed. Root Directory, Build Command override, and
      Git-repo connection were all checked and are correct, which is what
      makes this confusing — normally one of those three explains
      deterministic wrong output. **Next steps**: (1) disconnect/reconnect
      the Git repository in Vercel Project Settings → Git as a low-risk
      first try; (2) if that fails, consider migrating hosting to Cloudflare
      Pages. Once any fix produces a genuinely different bundle hash, still
      need to complete the one verification step never reached this
      session: hash-compare the frontend's embedded
      `VITE_SUPABASE_PUBLISHABLE_KEY` against Kong's live `ANON_KEY`.
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
- [ ] **SONGSS Security Agent — manual test PASSED 2026-09-11, activation
      still blocked** (see `project_security_agent_workflow_2026-09-11`):
      Schedule Trigger (`0 9 1 * *`) → SSH node → Code node → Telegram node,
      workflow id `Hf0imVxyBDY1bI5D`, credential `SONGSS Security Agent SSH`
      id `Lus50febsFVarx94` (forced-command-restricted key, live-verified it
      can only ever run `/root/security_agent_scan.sh` — an injected
      `cat /etc/shadow` test was confirmed ignored). Notify-only by design:
      runs `npm audit`/`pip-audit` read-only on the host, never applies fixes,
      never touches git/npm/pip credentials — Gilberto applies approved fixes
      manually via Claude Code afterward. Two real bugs found+fixed en route:
      SSH node missing `"authentication": "privateKey"` in its parameters
      (credential was wired right, just no explicit mode — patched via the
      standard DB method), and the SSH credential's Host field pointing at
      `127.0.0.1` (resolves to the n8n container itself on `n8n_n8n-net`, not
      the VPS host — Gilberto fixed via the UI, pointing it at the bridge
      gateway `172.18.0.1`). After both fixes, Gilberto's manual "Execute
      Workflow" test succeeded end-to-end and the Telegram message arrived on
      @songss_monitor_bot. **Still not activated**: the editor's Active
      toggle doesn't appear for this workflow, cause unidentified — ruled out
      trigger/connection integrity, `triggerCount` (confirmed via n8n's own
      source it's only set by activation itself, not a gate), Schedule
      Trigger `typeVersion` support, and project/sharing permissions (matches
      the known-active NIE workflow's row exactly). Paused, not urgent —
      manual execution is fully confirmed working. Next session: diff
      `workflow_entity` column-by-column against the NIE workflow, check the
      n8n frontend's own activation-eligibility logic, rule out a browser-side
      cause (cache/viewport) before assuming backend.
- [ ] **npm dependency audit** — 2026-09-06: ran `npm audit fix` (no
      `--force`), resolved 16 of 21 npm-audit findings via pure transitive
      bumps (`package.json` untouched, `package-lock.json` only);
      typechecked + built clean; committed (`83045e1`). Corrects the prior
      "browser-bundle vulns all CLOSED" claim below, which was **wrong** —
      2 real production-bundle issues were found; 1 is now resolved
      (item 1 below), 1 remains open:
      1. ~~`react-router-dom` 6.30.6 → 7.18.3~~ — RESOLVED 2026-09-08 (see
         `project_react_router_v7_migration_2026-09-08` for full detail):
         confirmed necessary (no 6.x patch exists or ever will — 6.30.6 was
         the last-ever 6.x release, both fixed advisories land only at
         `7.18.0+`); of the two, only GHSA-wrjc-x8rr-h8h6/CVE-2026-53669
         (open redirect via backslash in `<Link>`/`useNavigate`) applies to
         us — the SSR-hydration CVE is vendor-confirmed exempt since we're
         pure Declarative Mode (`BrowserRouter`/`Routes`/`Route`, no data
         router). Pinned exact `"react-router-dom": "7.18.3"` (matches the
         prior exact-pin convention for this package). Confirmed live:
         `react-router-dom@7.18.3`'s own shipped `dist/index.js` is a pure
         `require("react-router")` re-export — no API/import changes needed
         across all 17 files that touch it. `tsc -p tsconfig.app.json
         --noEmit` clean, `vite build` clean (only the pre-existing,
         unrelated Tailwind `@import`-order CSS warning). Dev-server route
         check (`curl` against `/`, `/dashboard`, `/settings`, `/pricing`,
         `/auth`, `/submit/test123`, `/report/test123`, `/nonexistent-route`)
         all 200, SPA fallback intact. **Caveat**: no real browser was
         available in that session (no Chrome extension connected, no
         headless browser installed) — the `navigate()`-after-async spots in
         `Auth.tsx`/`Dashboard.tsx`/`Settings.tsx`/`Submit.tsx` (the
         `v7_startTransition`-default behavior change) were verified by
         reading the code against the v7 API, not by clicking through in a
         live DOM with console-error checking. Low residual risk given the
         confirmed pure-re-export finding, but a real click-through is still
         worth doing opportunistically next time a browser is available.
      2. **`d3-color` ReDoS** — a *second*, separate vulnerable copy at
         v2.0.0 nested inside `d3-transition`/`d3-zoom`, pulled in by
         `react-simple-maps` (used in `NeuralWorldMap.tsx`, Home page
         globe) — distinct from the already-fixed top-level `d3-color@3.1.0`.
         No patched 2.x release exists upstream (checked the registry:
         only `2.0.0`/`2.0.0-rc.1` were ever published), so `npm audit fix`
         can't resolve it alone. Real fix needs an `overrides` pin to
         `d3-color@^3.1.0` (or a `d3-zoom`/`react-simple-maps` major bump),
         then a visual check that the globe still renders correctly.
      Remaining after the fix: `vite`/`esbuild` (dev-tooling only, build-time,
      not shipped — needs a `vite@8` major bump, not urgent). Dependabot's
      own alert tab (~40 as of 2026-09-05) still needs Gilberto's own
      GitHub access to review exactly — no `gh` CLI / `GITHUB_TOKEN` in this
      environment, so `npm audit` is used as a proxy and won't map 1:1.
      See `project_npm_audit_2026-09-06` + `project_npm_audit_2026-08-09` +
      §11 ARCHIVE.
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
