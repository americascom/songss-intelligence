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
- [ ] Review NIE prompt's LTV calculation formula — real `ltv_projection` values
      are implausible at the extremes (e.g. Dua Lipa returned $85, a global
      superstar valued lower than an unknown indie artist); found 2026-07-18
      while live-verifying the predictive-elements field-path fix (see
      CLAUDE.md §4 "RESOLVED BUG (found and fixed 2026-07-18)"). The display
      bug is fixed and real per-artist values now reach the frontend — this
      is about whether the AI's own math is sound, a separate, not-yet-started
      investigation

---

## 12. CONTACTS

Email: hello@songssintelligence.com / admin@songssintelligence.com
Company: Americascom, Inc. — 651 N Broad St, Ste 206, Middletown, DE 19709, USA
Stripe Portal: https://buyer.americaspay.com/p/login/bJe4gz9tjbuTfSa1zL3cc00
Supabase Studio: https://studio.songssintelligence.com
n8n: https://n8n.songssintelligence.com (admin@songssintelligence.com)
