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

RESOLVED SECURITY GAP (found 2026-07-09, fixed 2026-07-23): the "Stripe
Webhook" node had no signature verification. The "Filter" node immediately
downstream only checked `body.type === "checkout.session.completed"` — a
plain string match on the JSON body, not an HMAC/signature check. Practical
effect: anything that could reach POST /webhook/stripe-webhook with the right
JSON shape triggered the full chain (real Supabase Auth user creation, real
welcome email, real intelligence_reports row) — Stripe's own signature was
not required or checked.

**Fix**: `STRIPE_WEBHOOK_SECRET` added to `/docker/n8n/secrets.env`
(env_file-loaded, not committed anywhere). "Stripe Webhook" node's
`options.rawBody` set to `true` (so the real, unparsed request body is
available alongside the already-parsed `body` the existing Filter node
relies on — that node's `$json.body.type` check needed to keep working
unchanged). Two new nodes inserted between "Stripe Webhook" and "Filter":
1) "Verify Stripe Signature" (Code node) — parses the `Stripe-Signature`
header (`t=...,v1=...`), recomputes HMAC-SHA256 over `{timestamp}.{rawBody}`
using `STRIPE_WEBHOOK_SECRET`, compares against `v1` with
`crypto.timingSafeEqual` (length-checked first to avoid a throw on
mismatched lengths), and separately enforces a 5-minute timestamp tolerance
for replay protection — sets `stripe_signature_valid`/
`stripe_signature_reason` on the item rather than throwing. 2) "Signature
Valid?" (IF node) checking `stripe_signature_valid === true`: true branch
continues to the existing "Filter" node unchanged; false branch is
unconnected, so an invalid request simply ends the execution with no further
processing (no behavior change to the Stripe Webhook node's own auto-response
in `onReceived` mode, which still returns 200 regardless — same as before).

**Blocker hit mid-implementation**: the Code node's `require('crypto')`
failed on every single test (valid and invalid alike) — n8n's Code-node
sandbox denies `require()` of any module, including built-ins, unless
explicitly allowlisted. Fixed by adding
`NODE_FUNCTION_ALLOW_BUILTIN=crypto` to `/docker/n8n/docker-compose.yml`.
Separately relearned, same category as the WAL-snapshot tooling note in the
Social Engagement Index entry above: `docker compose restart` does **not**
reload `environment`/`env_file` changes for an already-created container — confirmed
`STRIPE_WEBHOOK_SECRET` and later `NODE_FUNCTION_ALLOW_BUILTIN` both stayed
empty in the running container after a plain `restart`, and only appeared
after `docker compose up -d --force-recreate n8n`.

**Deployed**: backup
(`manual_20260723_114608_pre_stripe_signature_verification.sqlite`), patched
all 3 DB locations (`workflow_entity.nodes`/`connections` +
both `workflow_history` rows, `versionId` `c8a04b97-49dc-4146-8921-7f4835f2df9d`
and `activeVersionId` `a09c4898-47db-4a22-970e-25d86ff6a9dd`), container
force-recreated twice (once for the secret, once for the builtin allowlist),
export-diff confirmed scope: exactly 2 nodes added ("Verify Stripe
Signature", "Signature Valid?"), 1 node changed ("Stripe Webhook" — options +
its outgoing connection to "Filter" redirected through the new nodes), 0
nodes removed, all other 58 nodes byte-identical.

**Verified**: signed and sent 4 test requests to the live webhook endpoint
from inside the `n8n_songss` container (so the real `STRIPE_WEBHOOK_SECRET`
never left the container) using a disposable fake `checkout.session.completed`
event (`cs_test_diagnostic_sig_verify` / artist `__SIG_TEST__DO_NOT_PROCESS__`):
valid signature reached the real pipeline and ran ~5.3s before erroring
further downstream on the intentionally-incomplete fake payload (expected —
proves the gate passed it through); missing signature, a tampered `v1`
value, and a signature with a timestamp 1 hour old were all blocked
immediately (~160-170ms, execution ended cleanly right after the IF node
with nothing downstream executing). Confirmed via direct Supabase query that
the valid-signature test run, despite running deep enough to potentially
reach real side-effecting nodes, left no trace in `auth.users`,
`intelligence_reports`, or `processed_sessions` — it errored out before any
real write occurred.

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

RESOLVED (implemented 2026-07-23): **`retention_rate` replaced with a real,
code-computed formula — first step of the pre-launch LTV/predictive-metrics
rework (see the "NIE prompt LTV/predictive-metrics rework" active task).**
Gilberto's call: fix `retention_rate` on real data before building LTV on
top of it, rather than layering a real calculation on an ungrounded one.
Previously `retention_rate` was, like `ltv_projection`, purely AI-extracted
in the `Edit Fields`/`AI Agent` step with the same "estimate by tone if not
stated" license — the 2026-07-16 fix only clamped its range, it never
grounded the value. Investigation also found `monthly_streams` (the
denominator used in the original LTV cross-artist analysis) is **equally
AI-fabricated**, requested in the identical `Edit Fields` JSON schema — so
the original "implied $/stream" spread was comparing two independently
hallucinated numbers, not one real anchor against one fake one. No code
anywhere computes `monthly_streams` from any real fetched field.

**Formula — "Multi-Platform Loyalty Index"**, computed in `Code in
JavaScript` from real `structured_data` only, no AI involved:
```
SFC_score = min(100, round(followers / monthlyListeners × 100))       // Spotify Follow-Conversion, weight 0.50
LRD_score = min(100, round((playcount / listeners) / 200 × 100))      // Last.fm Repeat-Listen Depth, weight 0.30
TED_score = followerCount > 1000
  ? min(100, round((heartCount / followerCount) × 100 / 20))          // TikTok Engagement Depth, weight 0.20
  : excluded
retention_rate = round(Σ(available signal × its weight) / Σ(available weights))
// null if Spotify itself doesn't resolve — never fabricated
```
Missing signals drop out and the rest renormalize (never zero-filled).
SoundCloud was evaluated and excluded as a core signal — near-zero/unused
for all 4 real artists sampled (major-label artists don't actively use it),
which would penalize platform non-usage rather than measure real retention.
The TikTok `followerCount > 1000` floor exists specifically because a real
sample (Clairo) returned an obviously-wrong resolved account
(`followers: 6, heart: 0`) — same known TikTok-handle-resolution
reliability gap already documented for `social_engagement_index`, not new
to this fix. `LRD`'s `/200` and `TED`'s `/20` caps are starting
calibrations against a small real sample (4 distinct artists — grentperez,
Clairo, Chappell Roan, Billie Eilish, pulled from real successful n8n
executions), same honest caveat as `social_engagement_index`'s `CAP=20`.

**Validated against real data before deploying**: computed both candidate
ratios (Spotify follow-conversion, Last.fm repeat-listen depth) across the
4 real artists first. Billie Eilish's Spotify ratio came back **164%**
(legacy superstar — cumulative followers exceed current monthly listeners),
disproving the initial hypothesis that this ratio self-bounds under 100% —
confirmed a clamp is required, same pattern as every other real metric in
this pipeline. Final formula logic-tested against all 4 real artists plus
a synthetic no-Spotify case (5/5 pass, matching hand-computed values:
grentperez 50, Chappell Roan 46, Billie Eilish 100, Clairo 47-with-floor,
no-Spotify → `null`).

**Deployed**: backup
(`manual_20260723_233230_pre_retention_rate_real_formula.sqlite`), patched
`workflow_entity.nodes` + both `workflow_history` rows (`versionId`
`c8a04b97-49dc-4146-8921-7f4835f2df9d` and `a09c4898-47db-4a22-970e-25d86ff6a9dd`)
via a Python script with an online-backup dry run first (`sqlite3 ...
".backup"`, not a plain `cp`, per the earlier WAL-consistency lesson),
syntax-checked with `/snap/bin/node --check` (host's default `node` is v12,
too old for the file's `?.` optional chaining — false-alarmed once, resolved
per the known node-version workaround), clean restart, export-diff
confirmed only `Code in JavaScript` changed (61 nodes before and after,
connections byte-identical).

**Live-verified**: two disposable test sessions inserted directly into
`intelligence_reports` (bypassing Stripe webhook), fired via internal
`POST /webhook/submit-analysis` from inside `n8n_songss` (artist "Chappell
Roan", real TikTok handle `chappellroan` to bypass the known
no-auto-lookup gap). Both runs returned `retention_rate: 46` with
byte-identical real Spotify/TikTok inputs (followers 8,381,215 /
monthlyListeners 30,409,031 / TikTok engagement_rate 12.59 both times) —
confirmed fully deterministic in production, not just in the isolated unit
test, unlike the old AI approach where the same real artist (Billie
Eilish) previously produced 4 unrelated values across sessions. Both test
sessions and their `processed_sessions` rows deleted after verification.

**Not done, deliberately out of scope this round**: `ltv_projection`,
`growth_trajectory`, `digital_score`'s relationship to real data are
unchanged — this fix covers `retention_rate` only, as the deliberate first
step before the LTV formula work. `Edit Fields`'s AI extraction schema
still asks for `retention_rate` in its JSON (now simply unread/discarded,
same "leave the dead AI field in place, don't touch the prompt" pattern
already used for `revenue_economics`) — not touched, to keep this change's
diff to exactly one node.

**Also found, not part of this fix — flagged for its own session**: while
inspecting `Update Artist Name`'s node parameters for the live test, found
its `apikey` header still contains a hardcoded Supabase `service_role` JWT
in cleartext, not routed through an n8n Credential (Golden Rule 4). Checked
all 7 nodes migrated to the shared `Supabase Service Role Auth` credential
back on 2026-07-09 ([[project_n8n_hanging_execution_bug]]) — **all 7 have
the same pattern**: the `Authorization` header was migrated to the shared
credential, but a separate `apikey` header (which Supabase/Kong requires
alongside it) was left hardcoded on every one, since n8n's `httpHeaderAuth`
credential type only covers a single header. This matches that memory's own
2026-07-09 wording ("left `apikey` header untouched") — a known, deliberate
scope decision at the time, just never carried forward as an explicit open
item since. Same class of key already sits in cleartext across all 7 nodes
today; not rotated or touched this session — flag and defer to its own
dedicated session, same as the encryptionKey and Cloudflare tunnel token
precedents, rather than fix reactively mid-unrelated-task.

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

RESOLVED (investigated 2026-07-19): the "TikTok username auto-resolution"
framing above was wrong — there is no AI-based username resolution anywhere
in this workflow, so there was nothing "failing intermittently." Traced the
full field lineage for `tiktok_username`: `Extract Metadata` reads it
verbatim from Stripe checkout metadata; `Config Haiku`/`Config Opus` are a
pure try/catch passthrough between `Extract Metadata` and `Submit Context`
(no LLM call, no artist-name-to-handle guessing); the `TikTok` node's
`uniqueId` query param is itself just
`try Config Haiku.tiktok_username → try Config Opus.tiktok_username → ''`.
No node anywhere attempts to derive a handle from `artist_name`.

Confirmed via decoded real execution data (n8n's own `flatted` library,
executions 78/79/80, 2026-07-18): whenever `tiktok_username` isn't supplied,
the real outbound call to `api.tikhub.io` is
`GET .../fetch_user_profile?uniqueId=""`, which TikHub deterministically
rejects with `400` (`"params":{"uniqueId":""}` in the error body) — same
exact failure for both Clairo (exec 78) and Chappell Roan without a handle
(exec 79). Exec 80 (Chappell Roan, handle passed explicitly) got a real
`200` with real data. This is not rate limiting, not an intermittent API
issue, and not a regression — it is a **guaranteed, 100%-reproducible**
failure any time a customer doesn't type a TikTok handle into the Submit
form, which is the common case. `alwaysOutputData` catches the 400 cleanly
and `social_engagement_index` correctly renders `null` (not a fabricated
number) — that part was never broken.

**Product decision (Gilberto, 2026-07-19)**: no auto-lookup feature — this
is expected/acceptable behavior given the target user profile (industry
professionals who already know their own or their artist's handles).
Follow-up scoped instead as a UX nudge, not a data-pipeline fix — see §11
"Submit form — add helper text near TikTok/Instagram/YouTube fields."

**Frontend**: `src/pages/Report.tsx` and `src/components/ArtistIndieReport.tsx`
now read `em.social_engagement_index` (nullable) instead of the old
AI-estimated `em.engagement_score`. KPI tile relabeled "Social Engagement
Index"; renders `—` with a "Not enough TikTok data yet" tooltip when null,
instead of falling back to a fabricated default number.

KNOWN GAP (investigated 2026-07-19, not fixed): Submit.tsx / Submit Trigger
have no code path for "authenticated user, no `session_id`" — confirmed this
is the same underlying gap as the planned "Request New Report" button; the
two former separate pending items are merged into one scoped item (see §11).

**Frontend**: the route is `/submit/:sessionId` (`App.tsx`) — `sessionId` is
a required URL segment, there is no bare `/submit` route, so hitting it with
no ID falls through to the catch-all `*` → `NotFound`. Even if a route
existed that rendered `Submit` with no `sessionId`, its data-fetch effect
(`Submit.tsx` ~line 132) does `if (!sessionId) return;` and never calls
`setLoading(false)` on that path — the page would spin on "Loading intake…"
forever, no error, no form, no way forward.

**Backend**: live-tested via a real POST to `/webhook/submit-analysis` with
`artist_name` but no `session_id` (fired from inside the `n8n_songss`
container to bypass the WAF's Managed Challenge on this endpoint — direct
external calls to it are correctly blocked, confirmed as a side effect of
this test). Traced execution id 82: `HTTP Request1`'s duplicate-check query
became `session_id=eq.undefined` (0 rows) → `If1` false → `Update Artist
Name` PATCHes `session_id=eq.undefined` (0 rows, silent no-op) → `Fetch
Session Data` GETs `session_id=eq.undefined` → returns `[]`. Because the
HTTP Request node splits a JSON array response into one item per element, an
empty array produces **zero output items**, so the branch simply stops —
`lastNodeExecuted` was `Fetch Session Data`. `Submit Context`, `Plan
Router`, and `Respond to Submit` (the node that would send `{"status":"ok"}`
or the existing `409` "already generated" error) never run. n8n still closes
out the workflow as `status: success` and returns a bare, empty-body
`HTTP 200` — no error surfaced, no NIE run, no email, nothing written to
`processed_sessions`. Confirmed no real data was touched (0 rows in
`intelligence_reports` matching `session_id` containing "undefined" or the
diagnostic artist name used in the test).

**Why this isn't a quick fix**: the whole chain assumes a `session_id`
pre-created by the Stripe webhook (Phase 1). A "Request New Report" flow for
an already-authenticated user needs real new work on both ends, not a
validation tweak:
1. Backend — a new path that creates a fresh `intelligence_reports` row for
   the authenticated user (checking their plan's remaining query quota and
   decrementing it) instead of relying on Stripe checkout having created the
   row first. Just returning a clear error instead of a silent empty 200
   (mirroring the existing 409 pattern) would only patch the *current*
   no-session_id symptom — it would not deliver the actual "Request New
   Report" feature.
2. Frontend — a new entry point/UI (e.g. a dashboard button) since
   `Submit.tsx` has no no-ID UI state at all today.

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
      - [x] ~~Step 1: retention_rate real formula~~ DONE 2026-07-23 — see §4
            "RESOLVED (implemented 2026-07-23): retention_rate replaced...".
            Real, deterministic Multi-Platform Loyalty Index
            (Spotify/Last.fm/TikTok), live-verified. Also found
            `monthly_streams` is equally AI-fabricated (no real formula
            anywhere) — relevant context for the remaining LTV/growth_trajectory/
            digital_score work below.
      - [ ] Remaining: `ltv_projection` real formula (now that `monthly_streams`
            is confirmed fake too, needs its own real anchor — likely derived
            from Spotify `monthlyListeners`, not the AI-invented field),
            `growth_trajectory`, and fixing the extraction step to stop always
            reading the premium report regardless of tier
- [ ] Hardcoded `apikey` header (Supabase `service_role` JWT) on all 7 nodes
      migrated to the shared credential 2026-07-09 — see §4 "Also found, not
      part of this fix" (2026-07-23) and
      `feedback_hardcoded_apikey_header_all_7_migrated_nodes` in memory.
      Known since the original migration, never tracked as an open item
      since; needs its own session, same as the encryptionKey/tunnel-token
      rotations
- [x] ~~Submit form — add helper text/recommended indicators near the
      TikTok/Instagram/YouTube fields to encourage customers to fill them
      in~~ IMPLEMENTED 2026-07-19 — TikTok/Instagram fields in
      `src/pages/Submit.tsx` now show a cyan "Recommended" indicator (new
      `Field` `recommended` prop) with field-specific helper copy (TikTok:
      "Without it, your report's Social Engagement Index can't be
      calculated"; Instagram: "Adds real follower and profile data to your
      report"). YouTube skipped — no input field exists for it in the form
      today (Gilberto's call, scoped out rather than adding a new field).
- [x] ~~"Request New Report" flow for authenticated users with no
      session_id~~ IMPLEMENTED 2026-07-20 (merged 2026-07-19 from two
      formerly separate list items — confirmed to be the same gap; see §4
      "KNOWN GAP (investigated 2026-07-19, not fixed)"). 6-task
      implementation plan, all done:
      1. [x] Backup before schema change
      2. [x] Create `plan_limits` table with quota values (including Opus
             tiers) — deployed to `supabase-db`, all 6 plan_keys populated
      3. [x] Create `request_new_report()` SECURITY DEFINER RPC — deployed;
             `EXECUTE` granted to `authenticated`/`service_role` only, no
             `anon`/`PUBLIC` grant (confirmed via `\df+`/`aclexplode` on
             2026-07-20 after an unclean VS Code restart raised doubt about
             whether the anon revoke had completed — it had)
      4. [x] Verify RPC end-to-end (quota allow, quota block, no-plan error)
             via live curl/psql tests — done 2026-07-20, all in
             `SET LOCAL role`/`request.jwt.claims`-simulated transactions
             that were rolled back (zero persistent side effects, confirmed
             0 leaked rows after). No-plan: fresh uuid with zero
             `intelligence_reports` rows → "No active plan found for this
             account". Quota allow: seeded 1 row for a real test account on
             `Growth` (limit 12) → RPC returned a new `session_id`, used
             count went 1→2. Quota block: seeded 4 rows for a real test
             account on `Artist Indie` (limit 4) → "Monthly quota reached
             (4 / 4)". Also confirmed `SET LOCAL role = anon` gets
             "permission denied for function request_new_report" at the
             function level, not just visible in ACL introspection.
      5. [x] Update `Dashboard.tsx`: read limits from `plan_limits` table,
             add "Request New Report" button — done 2026-07-20. Replaced the
             hardcoded, incomplete `PLAN_LIMITS` map (was missing both Opus
             tiers) with a live fetch from `plan_limits` (public
             `anon`/`authenticated` SELECT policy, no auth call needed);
             matching logic mirrors the RPC's own longest-matching-`plan_key`
             substring rule exactly, so frontend display and backend
             enforcement can't drift apart. Button added inside the Quota
             card: calls `supabase.rpc("request_new_report", {
             p_artist_name: null })`, navigates to `/submit/${session_id}`
             on success (confirmed `Submit.tsx` already fetches by
             `session_id` via `get_report_by_session`, so the new row works
             with zero other changes needed), shows the RPC's raw error
             message inline on failure, disabled once quota is reached.
             Follows the same `.rpc(name as any, {...}) as any` cast pattern
             already used for `get_report_by_session` in `Report.tsx`/
             `Submit.tsx`, since neither `plan_limits` nor
             `request_new_report` are in the generated `types.ts`.
             **Verified**: `tsc --noEmit` (exit 0, clean) and `vite build`
             (succeeded) — both run via `/snap/bin/node
             node_modules/.bin/tsc` / `node_modules/vite/bin/vite.js`
             directly, because this VPS's default `node`/`npx` in PATH is
             v12.22.9, too old for this project's toolchain (fails with
             `Cannot find module 'node:path'` / `Unexpected token '?'` on
             `??`).

             **Live browser visual test (2026-07-20)**: real disposable
             Supabase Auth user created via the GoTrue admin API, seeded
             with 3 real `intelligence_reports` rows (`plan_name='Growth'`,
             limit 12), dev server run locally (bound to `127.0.0.1` only —
             `vite.config.ts` defaults to `host: "::"`/all-interfaces with
             `ufw` inactive on this VPS, so the first launch was briefly
             reachable from the public internet before being restarted
             bound to localhost; accessed afterward via SSH tunnel only).
             Found and fixed one real bug this way: the Quota card rendered
             the limit as `—` instead of `12` — `plan_limits` had been
             created via direct SQL (task 2) and PostgREST's schema cache
             never learned about it, so `Dashboard.tsx`'s new
             `.from("plan_limits")` REST call 404'd with `PGRST205`
             ("Could not find the table ... in the schema cache"). The
             `request_new_report()` RPC never showed this symptom because
             SECURITY DEFINER `plpgsql` bodies run as raw SQL and bypass
             PostgREST entirely — only the frontend's direct table read was
             affected. Fixed live with
             `NOTIFY pgrst, 'reload schema';` (no container restart needed,
             confirmed via REST curl going 404→200 within ~2s). **General
             rule for future direct-SQL schema changes that the frontend
             will query directly (not just through an RPC): always send
             this NOTIFY as part of the change, not as a troubleshooting
             afterthought** — see
             `feedback_postgrest_schema_cache_reload` in memory. After the
             fix, full re-test passed: Quota card showed the correct
             `3 / 12 reports`, and clicking "Request New Report" correctly
             navigated to a new blank `/submit/:sessionId` form (Cloudflare
             challenge on that form's actual submit is expected/unrelated —
             the local test bypasses the normal Cloudflare-fronted path).
             All test data cleaned up after: 3 seeded rows + 2 RPC-created
             rows (button was clicked twice during testing) deleted, the
             disposable Auth user deleted via GoTrue admin API (confirmed 0
             rows left in `auth.users`), dev server stopped.
      6. [x] Document in CLAUDE.md: feature shipped + the known
             pre-launch-blocking team-pooling gap — this entry.

      **Known pre-launch-blocking limitation, unchanged by this work**: the
      RPC resolves plan/quota from `intelligence_reports.user_id` only —
      `public.teams` (`owner_user_id`/`member_user_id`) is never consulted,
      so a team's combined usage is not pooled under its owner. This is a
      real quota leak on unlimited-seat/team plans (e.g. Opus Maximus) —
      do not launch team seats on this RPC unchanged (see the RPC's own
      inline comment in the DB).
- [x] **Team quota pooling — IMPLEMENTED and live-verified 2026-07-21.**
      Was the highest-priority pre-launch blocker (see item above). Full
      detail in memory `project_team_quota_pooling_design_2026-07-21`;
      design summary (as agreed, then built exactly as designed):

      **Current state confirmed 2026-07-21**: `public.teams`
      (`owner_user_id`, `member_user_id`, `plan_name`, UNIQUE on the pair)
      has **0 rows** and RLS enabled with **zero policies** (unreadable via
      PostgREST today — only `postgres`/`service_role` can touch it). No
      code anywhere reads or writes it — no invite/team-management UI
      exists in `src/pages` or `src/components`, and it's absent from the
      n8n workflow export. This isn't a pooling bug to patch, it's the
      first piece of a seat-assignment feature that doesn't exist yet.

      **Design** — one concept, `pool_owner(u)`: if `u` appears as a
      `teams.member_user_id`, the pool owner is that row's
      `owner_user_id`; otherwise `u` is its own pool owner (solo user or a
      team owner). Then:
      - `plan_name` (which plan/limit governs) always comes from the pool
        owner's latest `intelligence_reports` row — whoever actually pays.
      - `used` (quota consumed) counts `intelligence_reports` rows across
        the whole pool (`owner + all its members`) for the current month —
        one shared counter, not per-person.
      - New report rows still insert under the *actual requester's own*
        `user_id`/email (so "who on the team used it" stays traceable) —
        only the quota check spans the pool.
      - Avoid duplicating "find my team" logic in two places (RPC +
        Dashboard JS, the same drift risk already called out for
        `plan_limits` matching): add one SQL helper
        `public.pool_member_ids(uuid) RETURNS SETOF uuid`, used by
        `request_new_report()`; add a new `get_quota_status()` SECURITY
        DEFINER RPC using the same helper, and have `Dashboard.tsx` call
        *that* instead of re-deriving quota client-side from raw report
        rows + `plan_limits` — removes frontend/backend drift risk
        entirely rather than mirroring the logic twice.
      - Leave `teams` RLS closed (no anon/authenticated policies) — all
        resolution happens server-side in SECURITY DEFINER functions, so
        the frontend never needs direct table access.

      **Edge cases, flagged not blocking**: (1) the UNIQUE constraint is
      per `(owner, member)` pair, not per member, so a member could in
      principle belong to more than one owner's team — no invite flow
      exists yet to actually create that, so left unhandled (arbitrary/first
      match) rather than designed against a scenario that can't happen
      today. (2) Unlimited-*seat* tiers (Opus Maximus / Opus+Compliance)
      still have a real query cap (1,500/mo) — "unlimited seats" only means
      no cap on team size, the shared pool itself stays bounded.

      **Scope decision (Gilberto, 2026-07-21)**: this round covers pooling
      logic only (RPC + `pool_member_ids` + `get_quota_status()` +
      Dashboard). No invite/assign UI — `teams` rows will be seeded
      manually for testing, same pattern as `plan_limits` was seeded
      directly via SQL. A real invite flow for owners to add members is
      separate future work, not yet scheduled.

      **Dashboard display — resolved (Gilberto, 2026-07-21)**: team members
      see the shared team quota (not a personal view) — the same pooled
      number the owner sees. Reasoning: transparency, avoids a member
      thinking they have their own separate quota when it's actually
      shared, reinforces the product's collaborative positioning.

      **Deployed, 2026-07-21**: backup (`pg_dump` →
      `/root/supabase/backups/manual_20260721_222610_pre_team_quota_pooling.sql`),
      then `public.pool_owner_id(uuid)` + `public.pool_member_ids(uuid)`
      (internal-only helpers), `public.get_quota_status()` (new
      `authenticated`/`service_role`-only RPC returning
      `{plan_name, used, monthly_limit}`), `request_new_report()` updated to
      resolve `plan_name`/`used` through those same helpers instead of the
      raw `user_id`, and `Dashboard.tsx` updated to call
      `get_quota_status()` instead of deriving quota client-side from
      `plan_limits` + raw report rows (the old `planLimitFor()` helper and
      its `plan_limits` fetch were removed entirely). `tsc --noEmit` clean,
      `vite build` succeeded.

      **Verified**: 1) rolled-back-transaction test (real FK-anchor test
      accounts, `SET LOCAL role`/`request.jwt.claims`, same pattern as the
      original RPC verification) — pooled quota identical for owner and
      member, owner's plan correctly wins over a deliberately different
      plan_name tagged on the member's row, member's new report correctly
      attributed to their own `user_id`, pool correctly blocks at capacity,
      solo user with no `teams` row unaffected, 0 rows leaked. 2) Real live
      test via two disposable GoTrue users + real (non-rolled-back) seed
      data, called through actual Kong/PostgREST with real JWTs (browser
      automation wasn't available this session) — this **caught a real
      bug**: `get_quota_status()` 404'd (`PGRST202`) through the real REST
      path because PostgREST's schema cache didn't know the new function
      existed, same root cause as the 2026-07-20 `plan_limits` table 404 but
      this time on a function — the psql-simulated test alone had NOT
      caught this. Fixed with `NOTIFY pgrst, 'reload schema';`, re-tested
      clean: owner and member both got the identical pooled result via real
      HTTP, `anon` got a real `42501 permission denied`. All test data +
      both disposable users deleted after.

      **Also caught while deploying the helpers**: `REVOKE ALL ... FROM
      PUBLIC` alone did not fully lock down `pool_owner_id`/
      `pool_member_ids` as internal-only — this Supabase instance's default
      schema privileges auto-grant `anon`/`authenticated` EXECUTE on every
      new `public` function regardless of the PUBLIC revoke. Caught by
      checking `pg_proc.proacl` directly rather than assuming the revoke
      worked; fixed with an explicit `REVOKE EXECUTE ... FROM anon,
      authenticated`. See memory `feedback_supabase_default_function_grants`.

      **Not done**: no invite/team-management UI — `teams` rows still
      require manual SQL insertion until that separate feature is built
      (deliberately out of scope this round, Gilberto's call). Not yet
      committed to git.
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
