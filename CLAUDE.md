# SONGSS Intelligence — CLAUDE.md
> Permanent context for Claude Code. Read before any action on this project.

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
- n8n_songss — n8n v2.28.3 (stable), port 5678
- n8n-tunnel-n8n-1 — Cloudflare tunnel

Docker networks:
- n8n is connected to supabase_default (to reach supabase-auth:9999)
- Without this connection, Supabase Auth calls fail with DNS error

Automated n8n backup:
/docker/n8n/backup_n8n.sh  → runs every hour via cron
/docker/n8n/backups/        → backup destination (7-day retention)

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
left disconnected rather than rewired — not confident enough in intent to
reconnect without risking a behavior change. Live duplicate-Stripe-webhook
protection may not currently exist at all; worth deciding whether that's a
real gap to fix or dead code to remove.

KNOWN SECURITY GAP (found 2026-07-09, not yet fixed): the "Stripe Webhook"
node has no signature verification. The "Filter" node immediately downstream
only checks `body.type === "checkout.session.completed"` — a plain string
match on the JSON body, not an HMAC/signature check. No `stripeApi` credential
exists anywhere in this n8n instance and no `STRIPE_WEBHOOK_SECRET` env var is
set. Practical effect: anything that can reach POST /webhook/stripe-webhook
with the right JSON shape triggers the full chain (real Supabase Auth user
creation, real welcome email, real intelligence_reports row) — Stripe's own
signature is not required or checked. Not fixed yet; flagged for a future
dedicated session, same category as the Check Duplicate Session gap above.

RESOLVED BUG (found and fixed 2026-07-14): the "Spotify Search" node
(`httpRequest` → Apify `automation-lab~spotify-scraper`, `mode:"search"`) read
its search term as bare `{{ $json.artist_name }}` — i.e. from its immediate
predecessor node's output only. That predecessor is "YouTube" (an
`httpRequest` call to yt-api.p.rapidapi.com), which replaces `$json` entirely
with the RapidAPI response and carries no `artist_name` field. So the actual
search term sent to Apify was always empty/undefined, Apify correctly
returned zero matches, and `alwaysOutputData: true` silently emitted `{}`
instead of erroring — meaning Spotify data (and everything downstream that
depends on it, including the Peer Benchmark feature added the same day) had
never worked, for any artist, including historically-"successful" runs.
Confirmed via an isolated Apify call outside n8n (same URL/params, real data
returned) that Apify itself was never the problem. Every sibling data-source
node (Deezer, Last.fm, MusicBrainz, Shazam, Genius, Jamendo, SoundCloud)
already used the correct pattern — a fallback chain reading
`$('Extract Metadata').first().json.artist_name` then
`$('Submit Context').first().json.artist_name` — "Spotify Search" was the
only node using the bare, wrong reference. Fixed by applying the same
fallback-chain expression, deployed across all 3 DB locations
(`workflow_entity.nodes` + both `workflow_history` rows), restarted, and
export-diff confirmed only this node's `jsonBody` changed. Live-tested via
an isolated Submit Trigger run (artist "Clairo"): real Spotify data and a
real, non-empty Peer Benchmark peer list both confirmed working end-to-end.
The 4 public landing-page sample reports (see `src/lib/sampleReports.ts`)
predated this fix and had empty/zero Spotify data and `NULL`
`peer_benchmark_data`; all 4 were regenerated in place the same day and now
show real data.

RESOLVED (verified 2026-07-17): the TikTok/Instagram username-resolution
fallback fix from 2026-07-07 (try/catch chain reading Config Haiku then
Config Opus for `tiktok_username`/`instagram_username`) is confirmed live and
working — real Instagram data (real follower counts) now flows through end
to end via an isolated Submit Trigger test.

KNOWN BUG (found 2026-07-17, not fixed): n8n intermittently fails to write
the final `execution_entity.status`/`stoppedAt` for this workflow, even when
every node — including the last one — records `executionStatus: success` and
real downstream Postgres writes (the `intelligence_reports` row,
`processed_sessions` row) demonstrably happened. Reproduced twice in one
session, once with no client response ever arriving and once with a normal
fast `{"status":"ok"}` response — the finalization gap happens either way.
This is very likely the true nature of the older "hanging execution" bug
tracked during the 2026-07-07 to 2026-07-09 JWT credential migration (see
memory `project_n8n_hanging_execution_bug` / `EXECUTIONS_TIMEOUT=300` and
`EXECUTIONS_DATA_SAVE_ON_PROGRESS=true`, both still deployed in
docker-compose.yml but confirmed not to fix this): those incidents were only
ever checked at the `execution_entity` level, never cross-checked against
actual Postgres state, so it's unknown whether they were true stalls or the
same finalization bug. Practical impact so far: real work completes and
persists correctly; only n8n's own execution history/status tracking is
wrong.

TIME-BOXED INVESTIGATION (2026-07-17, inconclusive, stopped early — see
memory `project_execution_entity_finalization_investigation_2026-07-17`):
(1) Can't test workflow-specificity — "SONGSS Lead Magnet" is active but has
zero executions ever recorded, so no comparison data exists. (2) As of this
session the bug is NOT reproducible: every retained `execution_entity` row
(ids 10-76, none missing/deleted) is fully finalized, and n8n's own event log
(`n8n.workflow.success`) timestamps match `stoppedAt` to the millisecond for
every case checked, including the two runs from the prior session that were
directly observed stuck at the time — meaning finalization is most likely
**delayed**, not permanently lost, and self-resolves after the observation
window. (3) No matching n8n GitHub issue found for this exact symptom (real
completion + real side effects, only `execution_entity` lagging); closest
are #22281 (different mechanism — no node executes at all) and #22380 (a
`"crashed"`-row boot loop, confirms `execution.repository.ts` is the right
area to search further). (4) DEAD END, ruled out: the "Custom data value
over 512 characters long. Truncating..." log line is unrelated to
`EXECUTIONS_DATA_SAVE_ON_PROGRESS` — traced to source; it's from n8n's
separate Execution Custom Data feature (`$execution.customData.set()`), and
its timing near the hang is coincidental, not a shared code path. Root cause
still unresolved. Flagged for a future dedicated session; next attempt
should poll `execution_entity` in a tight loop right after firing a test
rather than checking once, to catch the transient window before it
self-resolves.

RESOLVED BUG (found and fixed 2026-07-18): the "Predictive Elements" audit
(LTV Projection, Neural Trajectory, Revenue Model Advanced / 5-Year NPV)
found these three report sections had never shown a real, artist-specific
number to any customer, on any tier, in the product's history — despite the
NIE Engine (Gemini) genuinely computing distinct per-artist values. Root
cause was a field-path mismatch in the frontend, not fabrication by the AI:
(1) the NIE prompt schema only ever writes `ltv_projection` and
`growth_trajectory` nested inside `engagement_metrics` — it never produces a
top-level `revenue_economics` object, so the Save-to-Supabase node's
`revenue_economics: aiData.revenue_economics || {}` has written an empty
`{}` for every report ever generated; (2) `src/pages/Report.tsx` and
`src/components/ArtistIndieReport.tsx` computed `ltv` from
`re.ltv ?? re.ltv_projection ?? em.ltv` — checking the always-empty
`revenue_economics` object and a field name (`em.ltv`) the AI never writes,
never the real `em.ltv_projection` — so `ltv` always fell through to a
hardcoded constant ($8,400 in `Report.tsx` for Growth/Pro/Enterprise, $4,200
in `ArtistIndieReport.tsx` for Indie) regardless of the real value (confirmed
range across live reports: $85 for Dua Lipa up to $1,000,000,000 for
Chappell Roan); (3) the "Neural Trajectory" chart read
`em.trajectory ?? em.neural_trajectory`, never the real `em.growth_trajectory`,
so it always fell back to a client-synthesized curve
(`monthlyStreams * (0.55 + i*0.12)`) instead of the real AI-computed
trajectory; (4) "Revenue Model Advanced" (and its "5-Year NPV" badge) checked
`re.streams`/`re.npv` — permanently unreachable dead code since
`revenue_economics` is always `{}` — so it always rendered a fixed
percentage-split template, only ever scaled by the broken constant `ltv`
above. Fixed by reading `em.ltv_projection` and `em.growth_trajectory`
directly in both components, removing the dead `revenue_economics`
read/write from both `ReportRow` interfaces, and simplifying the
Revenue-Model/NPV/revenue-snapshot memos to drop their unreachable
`re`-based branches (they still use the same percentage-split template, now
correctly scaled by the real `ltv`). Live-verified by calling the real
`get_report_by_session` RPC for Dua Lipa (Artist Indie) and Chappell Roan
(Artist Growth) and running the fixed logic against the actual response:
LTV now correctly renders $85 vs. $1,000,000,000 (previously both showed the
identical $8,400 fallback), and the trajectory/revenue tables scale
accordingly. The n8n workflow's dead `revenue_economics: aiData.revenue_economics
|| {}` write and the `revenue_economics` column itself were deliberately left
in place — untouched per the "no n8n workflow changes without confirmation"
rule — so this is a frontend-only fix; the column is now simply unread.
Separately noted, not fixed: Dua Lipa's own real `ltv_projection` of $85 is
itself an implausible AI output for a global superstar, suggesting the NIE
prompt's LTV computation may need its own review in a future session — this
is a distinct issue from the display bug fixed here.

KNOWN ISSUE (found 2026-07-18, not fixed, scoped as its own dedicated future
session — bigger than a field-path bug): `ltv_projection` (and by extension
`growth_trajectory`, `digital_score`, `geo_hotspots`) is not computed from
any formula — it's free-text AI estimation, same root-cause family as the
2026-07-14 Peer Benchmark bug, but one layer more removed from real data.
Two distinct findings from this investigation:

1. **No formula, explicit license to invent.** The pipeline is two sequential
   LLM calls, both Gemini 2.5 Flash. First, `NIE — Neural Intelligence Engine`
   writes the premium markdown report, including a
   `## Revenue Economics & Break-Even Analysis` section with zero
   methodology instructions (no formula, no reference to `monthly_streams`,
   no per-stream rate — just "use markdown tables"). Second, a separate node
   (`AI Agent`, fed by the `Edit Fields` node's "STRATEGIC DATA EXTRACTION
   PROTOCOL" prompt) re-reads that already-generated prose and extracts
   `ltv_projection` as JSON, with this exact instruction for anything not
   explicitly stated: *"If a specific numeric value is not mentioned,
   provide a professional estimate based on the report's tone."* So the
   number isn't computed from streams/retention/anything — it's a
   second-order guess about a figure that was itself never grounded in the
   first pass, with explicit permission to invent by "tone."

   Cross-artist evidence (10 real reports pulled from `intelligence_reports`,
   2026-07-18): implied $/stream (`ltv_projection` ÷ `monthly_streams`)
   spans **~7 orders of magnitude** with no correlation to tier, fame, or
   genre:

   | Artist | Tier | `monthly_streams` | `ltv_projection` | Implied $/stream |
   |---|---|---|---|---|
   | Dua Lipa | Indie | 833,000,000 | $85 | 0.0000001 |
   | Billie Eilish | Enterprise | 2,500,000,000 | $300,000,000 | 0.12 |
   | Billie Eilish | Growth | 1,200,000,000 | $750,000,000 | 0.625 |
   | grentperez | Indie | 15,000,000 | $6,000,000 | 0.40 |
   | (unnamed) | Growth | 500,000,000 | $150,000,000 | 0.30 |
   | Billie Eilish | Indie | 392,000,000 | $120,000,000 | 0.306 |
   | Luan Carbonari | Indie | 7,000,000 | $5,000,000 | 0.714 |
   | Billie Eilish | Pro | 1,000,000,000 | $2,000,000,000 | 2.0 |
   | Fred again.. | Pro | 18,441,820 | $80,000,000 | 4.34 |
   | Chappell Roan | Growth | 215,000,000 | $1,000,000,000 | 4.65 |

   Most damning: Billie Eilish (the same real artist) appears 4 times across
   different tier-tests within a single day (2026-06-12 to 2026-06-13) and
   gets four unrelated `monthly_streams` values (392M–2.5B) and four
   unrelated LTVs ($120M–$2B) with no consistent ratio between them —
   confirming these are independent per-session guesses, not reproducible
   computed values, even for the identical artist.

2. **The extraction step always reads the premium report, regardless of
   tier.** The `Edit Fields` prompt's "Input Material" is hardcoded to
   `$node["NIE — Neural Intelligence Engine"].json["output"]` only — it
   never references `NIE — Indie Coach`. Tracing the workflow: both
   report-writer nodes (`NIE — Neural Intelligence Engine` and
   `NIE — Indie Coach`) actually run in parallel for *every* session
   regardless of plan tier — confirmed by a code comment on the
   `Combine NIE Outputs` node itself: "Collapse the 2 parallel NIE items
   into 1 so Edit Fields runs exactly once. Edit Fields and Code in
   JavaScript reference both NIE nodes by name — that still works because
   n8n keeps the full execution context." The final `report_markdown` saved
   to the customer is correctly tier-aware (Indie gets only the lean
   `NIE — Indie Coach` text, which has no Revenue Economics section at all;
   all other tiers get Indie Coach's sections prefixed to the premium NIE
   report) — that logic lives in the `Code in JavaScript` node and is fine.
   But the *extracted structured metrics* (`ltv_projection`,
   `growth_trajectory`, `digital_score`, `geo_hotspots` — everything shown
   in the LTV/trajectory/digital-score UI tiles) are extracted exclusively
   from the premium `NIE — Neural Intelligence Engine` report on every tier,
   including Indie. So Indie-tier customers see structured numbers derived
   from a report variant they never actually receive, with zero relationship
   to the lean Indie Coach text they do read.

**Fix scope (deliberately not attempted 2026-07-18)**: this needs real
prompt engineering — a defined LTV formula (likely `monthly_streams` ×
`retention_rate` × an industry-standard per-stream/subscriber rate, computed
explicitly rather than "estimated by tone") plus fixing the extraction step
to read the tier-appropriate report (or, more simply, to compute structured
metrics directly from `structured_data` — the real fetched Spotify/Deezer/
etc. data — rather than re-extracting from already-generated prose at all).
This is a bigger, riskier change than the field-path bug above (prompt
changes affect every future report, not just a frontend read) and needs its
own dedicated session per the "no n8n workflow changes without confirmation"
rule — not bundled into unrelated work.

RESOLVED BUG (found and fixed 2026-07-18): `digital_score` (the headline
"SNIE™ Score" — the largest single number on every report) had the exact
same unprotected shape that let `retention_rate` hit 211 on 2026-07-16: a
prompt-level range instruction (`"digital_score": [Integer 0-100]`) with
zero code-level enforcement — `Code in JavaScript` did
`digital_score: aiData.digital_score || 0` with no clamp. No live violation
had been caught yet for this field specifically (all 10 sampled reports were
in-range), but the belt-and-suspenders logic from the retention_rate
precedent applied: a prompt-level bound alone has already been proven
unreliable in this exact pipeline, so waiting for a live breach before
protecting the most visible number in the product wasn't worth the risk.

**Fix applied, same pattern as retention_rate**: 1) `Edit Fields` node
prompt strengthened to `"digital_score": [Integer, strictly 0-100 — this is
a score out of 100 and must never be below 0 or above 100]`. 2)
`Code in JavaScript` node: added
`const digital_score = Math.min(Math.max(Number(aiData.digital_score) || 0, 0), 100);`
right after the existing `retention_rate` clamp, and changed the PATCH body
to reference the clamped local `digital_score` instead of
`aiData.digital_score` directly.

**Deployed** via the established 3-DB-location method (`workflow_entity.nodes`
+ both `workflow_history` rows for `versionId` `92b861cc-a31a-49af-91a7-147808498ca8`
and `activeVersionId` `a09c4898-47db-4a22-970e-25d86ff6a9dd`), backup
`manual_20260718_213611_pre_digital_score_clamp.sqlite`, clean restart,
export-diff confirmed only the `Edit Fields` and `Code in JavaScript` nodes
changed and connections were byte-identical to the pre-change export.

**Verified**: isolated logic test (145→100, -20→0, 72→72, `"78"`→78,
0→0, missing→0 — all correct) plus a live end-to-end test — disposable
test session `cs_test_digital_score_clamp_verify_20260718` inserted
directly into `intelligence_reports` (bypassing the real Stripe-webhook
path to avoid triggering a real Supabase Auth user + welcome email), fired
via an internal `POST /webhook/submit-analysis` call (artist "Clairo",
Artist Pro tier) from inside the `n8n_songss` container. Clean
`{"status":"ok"}` response, real report generated end-to-end,
`digital_score` came back `63` (in-range, correctly unaffected by the
clamp — same "normal case passes through unchanged" behavior confirmed for
`retention_rate`). Test session and its `processed_sessions` row deleted
after verification.

**Also observed while testing (not fixed, not this bug)**: the Clairo test
report's `digital_score` and `engagement_metrics.engagement_score` came back
identical (63/63) — consistent with the pattern already documented above
(`engagement_score` duplicated `digital_score` in 7 of 10 real reports
sampled during the investigation). `engagement_score` was deliberately left
un-clamped this session — see the note in §11 Active Tasks; whether it
should even remain a separate field is a product question, not a pure bug.

FEATURE ADDED (2026-07-18): **Social Engagement Index**
(`engagement_metrics.social_engagement_index`) — Gilberto's resolution to
the `engagement_score` product question above: rather than remove the
field, define it as a real, code-computed metric instead of an AI free-text
guess. Audited real per-platform data availability first: only TikTok
exposes a genuine interaction-rate signal today
(`tiktok_data.engagement_rate` = `heartCount ÷ followerCount`, already
computed but previously unused). Instagram's current call
(`fetch_user_info_by_username`) is profile-only — no likes/comments;
YouTube's `channel/about` call is channel-level totals only — no
likes/comments either. Both would need a new API call (posts/media
endpoint) to contribute real engagement data — not done, scoped as a future
decision, not bundled into this fix.

**Formula** (computed in `Code in JavaScript`, NOT AI-estimated):
```js
engagement_metrics.social_engagement_index = tiktok_data.followers > 0
  ? Math.min(100, Math.round(tiktok_data.engagement_rate * 100 / 20))
  : null;
```
`CAP=20` is a starting calibration (only 5 real non-zero TikTok
data points existed to tune against at the time), adjustable as more data
accumulates. Returns `null` (not `0`) when TikTok data wasn't resolved —
missing data must never render as a fabricated "0% engagement." Note for
report copy/labels: this is **cumulative lifetime engagement relative to
current followers**, not a recent-activity rate — `heartCount` is
all-time, `followerCount` is a snapshot — avoid language implying
"recent" engagement.

**Deployed**: patched only the `Code in JavaScript` node (no prompt change
needed — this isn't AI-derived) across all 3 DB locations, backup
`manual_20260718_225649_pre_social_engagement_index.sqlite`, clean restart,
export-diff confirmed only that node's `parameters` changed and connections
were identical.

**Mid-deployment anomaly, investigated and resolved as benign**: between
the dry-run and the live patch, `workflow_entity.versionId` changed
underneath the change (`92b861cc` → `c8a04b97`) with 5 rapid saves logged
under "Gilberto Georg" (22:48:18–22:49:04) — Gilberto confirmed he'd
briefly opened the n8n UI to check the `Perplexity — Web Intelligence`
node's name, not intentionally editing anything. Diffed all 5 saves
node-by-node against the pre-open baseline: every one of the 59 nodes only
had its canvas `position` changed (pure layout, e.g. autosave-on-open
behavior), except one — `Check Peer Cache` lost an explicit
`"method": "GET"` parameter, which is n8n's httpRequest node default
anyway (a no-op). Connections were byte-identical throughout. Confirmed
nothing substantive changed before proceeding.

**Tooling note for future sessions**: the dry-run validation step (`cp` the
live `.sqlite` file to a throwaway copy, patch the copy, verify) read a
**stale, WAL-inconsistent snapshot** during this fix — a plain `cp` of just
the main `.sqlite` file misses recent commits still sitting in the
`-wal` sidecar file that n8n's own live connection reads through fine. The
actual live patch (via `sqlite3.connect()` against the real path) and every
CLI `n8n export:workflow` call were accurate throughout — only the
`cp`-based dry-run copy was affected, and only as an extra safety check,
not the real change. If a future dry-run needs to be trustworthy, `cp` all
three files (`database.sqlite`, `-wal`, `-shm`) together, or better, use
`sqlite3 <db> ".backup <copy>"` (an online backup that flushes WAL
correctly) instead of a plain file `cp`.

**Verified**: 1) isolated logic test against real historical values
(grentperez 32.82→100, Fred again.. 17.33→87, Chappell Roan 12.59→63,
Billie Eilish 7.43→37, no-TikTok-data→`null`) all correct. 2) Live test
— disposable session for Clairo hit the `null` path (TikTok didn't resolve
that run) — a valid confirmation of the missing-data path, but not of the
positive-number path. 3) A second live test for Chappell Roan (known to
have resolved real TikTok data 2026-07-16) *also* came back with no TikTok
data — flagged as suspicious rather than assumed transient. 4) A third live
test, this time passing her known TikTok handle (`chappellroan`) explicitly
in the Submit Trigger body to bypass the AI username-resolution step,
succeeded completely: real TikTok data returned (5,100,000 followers, 12.59
engagement rate — matching the historical values exactly) and
`social_engagement_index` came back `63`, exactly matching the formula
(`12.59 × 100 ÷ 20 = 62.95 → round → 63`). All 3 test sessions cleaned up
after verification.

**Open observation, not investigated further this session**: TikTok
username auto-resolution (the Config Haiku/Opus AI fallback used when a
customer doesn't supply a handle at signup) failed on 2 of 3 test attempts
this session for artists known to resolve successfully in the past
(Clairo, and Chappell Roan without an explicit handle) — worth a dedicated
look in a future session to see if this is a live reliability regression or
just this session's bad luck; not blocking, since the `null`-when-missing
behavior handles it gracefully either way.

**Frontend**: `src/pages/Report.tsx` and `src/components/ArtistIndieReport.tsx`
now read `em.social_engagement_index` (nullable) instead of the old
AI-estimated `em.engagement_score`. KPI tile relabeled "Social Engagement
Index"; renders `—` with a "Not enough TikTok data yet" tooltip when null,
instead of falling back to a fabricated default number.

---

## 5. SUPABASE DATABASE

Tables:
- intelligence_reports (session_id, customer_email, artist_name, plan_name,
  report_html, report_markdown, geo_hotspots, engagement_metrics, user_id)
- teams (owner_user_id, member_user_id) — seats for Growth+ plans

RPC SECURITY DEFINER:
- get_report_by_session(p_session_id text) — always use this, never direct SELECT

Public view:
- public_geo_hotspots (geo_hotspots, created_at) — for NeuralWorldMap component

RLS: enabled. Direct reads on intelligence_reports blocked for anon. Always use RPC.

---

## 6. AUTHENTICATION

- Supabase Auth at supabase-auth:9999 (internal Docker)
- Users created by n8n after Stripe payment
- Initial password = Stripe session_id
- n8n encryptionKey: DO NOT CHANGE — stored in /docker/n8n/.n8n/config
- Key value: see /docker/n8n/.n8n/config on VPS (never commit this value)

---

## 7. PRICING (DEFINITIVE — Do not change without authorization)

Artist Indie: $9.90/mo | 4 queries | Haiku
Growth: $29/mo | 12 queries | Haiku
Pro/Team: $99/mo | 50 queries | Sonnet
Enterprise: $299/mo | 150 queries | Sonnet + GPT-4o
Opus Maximus: $1,500/mo or $12k/yr | 1,500 queries | Opus (Taylor Made — no self-service)
Opus + Compliance: $3,000/mo or $24k/yr | 1,500 queries | Opus + IBM watsonx

---

## 8. CLOUDFLARE WAF (5 active rules)

1. Block datacenter bots — ASNs {396982,16509,14618,15169,8075} except /webhook/stripe-webhook
2. Block high-risk countries — CN, RU, KP, IR
3. Block suspicious user agents — python-requests
4. Protect submit endpoint — Managed Challenge without correct Referer
5. Protect n8n Webhook Endpoint

---

## 9. DEPLOY

App (Vercel): push to main → automatic deploy
Landing page: MANUAL via terminal only:
  export CLOUDFLARE_API_TOKEN=<create on the spot, revoke after use>
  cd /root/songss-landing-page && npm run build
  cp wrangler.json dist/server/wrangler.json
  cd dist/server && npx wrangler deploy

WARNING: no_bundle was removed from wrangler.json — do NOT add it back
WARNING: Cloudflare CI is disconnected — always deploy manually

---

## 10. GOLDEN RULES (NEVER VIOLATE)

1. Do not modify n8n workflow without confirmation
2. Do not change n8n encryptionKey
3. Do not use docker pull n8n:latest — always use n8nio/n8n:stable
4. Do not expose Supabase service_role key — use n8n Credentials
5. Do not add no_bundle to wrangler.json
6. Always backup before touching the database:
   cp /docker/n8n/.n8n/database.sqlite /docker/n8n/backups/manual_$(date +%Y%m%d_%H%M%S).sqlite
7. Cloudflare tokens: create → use → revoke immediately
8. RLS: never use USING(true) on intelligence_reports SELECT policies

---

## 11. ACTIVE TASKS

- [ ] Componentize Report.tsx (1,442 lines) — via Cline
- [ ] AI First strategy — update positioning on app and landing pages
- [ ] n8n workflow visual layout — reorganize for readability
- [ ] RTK (Redux Toolkit) — incremental adoption: auth, report, artist, ui slices
- [ ] USPTO — trademark SONGSS Intelligence (Class 42) and NIE
- [ ] MFA on Supabase Studio
- [ ] NIE prompt LTV/predictive-metrics rework — see §4 "KNOWN ISSUE (found
      2026-07-18, not fixed, scoped as its own dedicated future session)":
      needs a real LTV formula plus fixing the extraction step to stop
      always reading the premium report regardless of tier
- [x] ~~Product decision: should `engagement_score` remain a separate field
      from `digital_score`?~~ RESOLVED 2026-07-18 — see §4 "FEATURE ADDED
      (2026-07-18): Social Engagement Index". Kept as a real, distinct
      metric, now computed from real TikTok data instead of AI free-text
      ("tone") estimation. Follow-up: expanding this to Instagram/YouTube
      needs new API calls (posts/media endpoints) to get real interaction
      data from those platforms — not done, a separate future decision.

---

## 12. CONTACTS

Email: hello@songssintelligence.com / admin@songssintelligence.com
Company: Americascom, Inc. — 651 N Broad St, Ste 206, Middletown, DE 19709, USA
Stripe Portal: https://buyer.americaspay.com/p/login/bJe4gz9tjbuTfSa1zL3cc00
Supabase Studio: https://studio.songssintelligence.com
n8n: https://n8n.songssintelligence.com (admin@songssintelligence.com)
