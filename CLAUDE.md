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

RESOLVED (2026-07-27): **Postgres password rotation** — Tier 1 security
item, prioritized once real customer data started flowing through the
live product. `POSTGRES_PASSWORD` in `/root/supabase/.env` is shared
across every Supabase service (`db`, `studio`, `auth` as
`supabase_auth_admin`, `rest` as `authenticator`, `realtime`/`meta`/
`analytics`/`supavisor` as `supabase_admin`, `storage` as
`supabase_storage_admin`, `functions` as `postgres`) — confirmed via
`roles.sql` that `authenticator`, `pgbouncer`, `supabase_auth_admin`,
`supabase_functions_admin`, `supabase_storage_admin` all get this exact
password at init, plus `postgres`/`supabase_admin` natively. Not used
anywhere in n8n (checked `credentials_entity` — no raw Postgres
credential type exists, only `supabaseApi`/`httpHeaderAuth` which go
through the REST API) or in any app code/cron job. `pg_hba.conf` trusts
local/loopback unconditionally — only real inter-container traffic
(`host all all all scram-sha-256`) needs the password, which is why every
`docker exec supabase-db psql` admin command used throughout this
project's history never needed it.

**Rotated live**: `pg_dump` backup first
(`manual_20260727_212613_pre_postgres_password_rotation.sql`), new 40-char
password generated, `ALTER ROLE ... WITH PASSWORD` run live for `postgres`,
`supabase_admin`, `authenticator`, `pgbouncer`, `supabase_auth_admin`,
`supabase_storage_admin` (6 of the intended 7 — `supabase_functions_admin`
does not exist in this database at all, harmless no-op), `.env` updated
(backed up first), `docker compose up -d --force-recreate` run for
`studio auth rest realtime storage meta analytics supavisor`.

**Deviation from plan**: `db` itself also got recreated (a brief real
Postgres restart) even though it wasn't in the explicit service list —
Compose treated it as needing recreation too since its own environment
block also references `${POSTGRES_PASSWORD}`. More disruptive than the
"live `ALTER ROLE`, no restart needed" plan, though it came back healthy
within seconds — noted for next time this needs doing: expect `db` to
recreate too whenever `POSTGRES_PASSWORD` itself changes, even if not
explicitly listed.

**Verified on the real customer path**: REST API query against
`intelligence_reports` via Kong returned a real `200`; Auth health
endpoint responded correctly through Kong with the `apikey` header.
`db`/`auth`/`rest`/`storage`/`meta`/`studio` all report healthy.

**Found as a side effect, non-blocking, NOT on the customer path** — see
§11 Active Tasks: `supabase-pooler` (Supavisor) and `realtime` both began
crash-looping after being recreated, joining `supabase-edge-functions`
(also freshly discovered crash-looping, 7,974 restarts since 2026-05-01,
entirely unrelated to this rotation). All three fail on errors *after*
successfully authenticating with the new password (pooler: a Cloak/cipher
key mismatch decrypting its own unrelated internal tenant config;
realtime: an Ecto migration schema error; functions: "could not find an
appropriate entrypoint" — no edge function ever deployed) — none are
password/auth failures, and none are used by the live app (confirmed no
`.channel(`/Realtime usage anywhere in `src/`; nothing connects through
the pooler's proxy ports). Can't prove these predate today's recreate
(restart counts reset on recreation), but the error signatures and the
fact that none of the three have ever been mentioned across this
project's entire audit history both point to long-dormant, unused
components rather than a new regression.

RESOLVED (investigated 2026-07-27): **Git history secret exposure scan**
— separate from the above (confirmed distinct from a different, already-
known transcript-only exposure). `americascom/songss-intelligence` is a
**public** GitHub repo (confirmed via an unauthenticated
`api.github.com` call returning 200 — private repos 404 unauthenticated).
Found real, hardcoded (not `${VAR}`) secrets in exactly 2 early commits:
`6da1d4b` (2026-01-11, `.env` — `VITE_SUPABASE_URL`/`_PROJECT_ID`/
`_PUBLISHABLE_KEY`, all Vite build-time vars that are always public in
the client bundle regardless, so not a real exposure) and `c4c858d`
(2026-04-08, `docker-compose.yml` — real `POSTGRES_PASSWORD`,
`GOTRUE_JWT_SECRET`/`PGRST_JWT_SECRET`, `SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_KEY`). **Confirmed all four values in the real commit
do NOT match anything currently live** — already superseded by prior
rotation before this investigation even started. A full pattern-based
scan across all 318 commits in history (JWTs, Perplexity/OpenAI/
Anthropic/Google/AWS/Stripe key formats, generic `*_PASSWORD`/`*_SECRET`/
`*_KEY`/`*_TOKEN` assignments, private-key blocks — first pass had a
regex word-boundary bug that would've missed compound names like
`POSTGRES_PASSWORD`, caught and fixed before trusting results) found
nothing beyond these same 2 commits. **Conclusion: closed, historical,
non-exploitable** — no git history rewrite attempted (would be
destructive and wasn't warranted given no active exploit risk). Not a
full guarantee (regex scan, not an entropy-based tool like `gitleaks`,
which isn't installed) — flagged as a low-priority follow-up if stronger
confidence is ever wanted.

IN PROGRESS (started 2026-07-28): **Supabase `JWT_SECRET`/`ANON_KEY`/
`SERVICE_ROLE_KEY` rotation** — Tier 1 security item, continuation of the
2026-07-27 Postgres password rotation. Mapped first (separate step, before
touching anything): confirmed `JWT_SECRET` is the single source of truth
(`/root/supabase/.env`, fans out via compose `${VAR}` interpolation to 6+
services incl. `GOTRUE_JWT_SECRET`/`PGRST_JWT_SECRET`), `ANON_KEY`/
`SERVICE_ROLE_KEY` are just HS256 JWTs signed by it (not independently
rotatable — regenerating them without changing the secret provides no real
security benefit), Kong's `kong.yml` gets them via entrypoint-script env
substitution (needs a real recreate, not just restart), and the newer
opaque publishable/secret-key system is fully unconfigured on this
instance (legacy static-JWT path only). Key structural finding: this
instance uses a single symmetric HS256 secret with no JWKS/dual-key
rotation configured, so rotating `JWT_SECRET` **unavoidably invalidates
every currently-logged-in customer's session JWT** — no zero-downtime path
exists here. Gilberto's call: proceed now rather than schedule a window,
since there are no real customers yet.

**New values**: generated via pure-stdlib Python (no `jwt`/`jose` library
available on this VPS) — `JWT_SECRET` as 48 random bytes base64url-encoded
(64 chars, matching the current format exactly, confirmed base64url
charset via regex before generating), `ANON_KEY`/`SERVICE_ROLE_KEY`
re-signed with the same claim shape as the current live keys
(`{role, iat, exp}`, same ~50-year expiry horizon). The HS256 sign/verify
implementation was **self-verified byte-for-byte against the real live
keys** (re-signed the current keys' actual payload with the current real
secret and confirmed exact string match) before being trusted to generate
the new ones.

**Backups** (all timestamped `20260728_143247`, taken before any live
change): `/root/supabase/.env.backup_20260728_143247_pre_jwt_rotation`,
`pg_dumpall` to
`/root/supabase/backups/manual_20260728_143247_pre_jwt_rotation.sql`, and
an online WAL-safe `.backup` copy of n8n's `database.sqlite` to
`/docker/n8n/backups/manual_20260728_143247_pre_jwt_apikey_rotation.sqlite`.

**Live cutover, Supabase side — DONE**: new values written to
`/root/supabase/.env`, `docker compose up -d --force-recreate` run for
`db auth rest storage meta analytics studio kong` in one shot.
**Verified on the real customer path**: REST query via Kong with the new
anon key → `200`; the same query with the **old** anon key → `401
Unauthorized` (proves the old key is actually dead, not just that the new
one happens to work); Auth health check → `200`.

**Side effect found**: `supabase-analytics` began crash-looping after
being recreated — same "freshly surfaced pre-existing dormant issue"
pattern as the pooler/realtime/functions trio found during the 2026-07-27
Postgres rotation (see above). Error is `relation "system_metrics" does
not exist` (an internal Logflare/Ecto migration issue) — not an
auth/password failure, unrelated to this rotation's actual change, and
analytics is not on the live customer request path. Not chased further
this session; should be tracked alongside the existing pooler/realtime/
functions crash-loop item in §11.

**Live cutover, n8n side — DONE**, and closes the "Hardcoded `apikey`
header" Golden Rule 4 gap in the same pass rather than hand-patching
around it: updated the shared "Supabase Service Role Auth" credential
(id `Aqlm0Ocboq2dZEIl`) via `n8n import:credentials` — deliberately used
n8n's own CLI/encryption code rather than reimplementing its AES-256-CBC
credential encryption by hand (that internals path was explicitly ruled
out as a separate Tier 1 item, same category as the encryptionKey
rotation — see `project_n8n_encryptionkey_rotation_pending` in memory).
Verified the CLI mechanism end-to-end first with a disposable test
credential (round-trip encrypt/decrypt confirmed correct) before touching
the real one. Then patched `workflow_entity.nodes` directly via the
established plaintext-SQLite method (same technique used for every
`retention_rate`/`digital_score`/etc. fix since 2026-07-16) to: 1) update
the hardcoded `apikey` header value on all 9 nodes that carry it (`Save
Processed Session`, `Check Duplicate Session`, `HTTP Request`, `Insert
Intelligence Report`, `Update Artist Name`, `Fetch Session Data`, `HTTP
Request1`, `Check Peer Cache`, `Write Peer Cache`) to the new
`SERVICE_ROLE_KEY`; 2) migrate `Check Peer Cache`/`Write Peer Cache` onto
the shared credential for `Authorization` — these 2 previously had **zero**
credential wiring at all (both `Authorization` and `apikey` fully
hardcoded raw), a worse gap than the other 7 nodes which already used the
credential for `Authorization` and only had `apikey` hardcoded. All 9
nodes are now in the same, better state. Restarted n8n, then export-diffed
the active workflow (`8SRNZDEpZKu88qFz`) against a pre-patch export: node
count 63→63, connections byte-identical, exactly the 9 expected nodes
changed and nothing else.

**Structural limit, not an oversight**: full elimination of the hardcoded
`apikey` header itself isn't achievable through n8n's native credential
UI — an `httpHeaderAuth` credential injects exactly one header, and
Supabase's Kong config requires both `apikey` and `Authorization`
populated independently on each request. `apikey` will remain a per-node
hardcoded value going forward; this rotation closes the "no credential at
all" gap, not the "still one raw header" gap, which needs a custom n8n
credential type (real engineering, out of scope here) to fully close.

**Deliberately left stale** (Gilberto's call): the 2 dead `supabaseApi`
credentials ("Supabase account", "Supabase account 2") used only by
inactive old workflow versions (V4.1, V4.2, "TESTE 24-04") — not updated,
now hold a stale service_role key, harmless since unused by the live
workflow.

**Incidental issue found and fixed mid-session, unrelated to the rotation
itself**: a `SELECT * FROM user_api_keys` query (checking for a safer way
to update the n8n credential before the CLI approach was found) printed 3
live n8n Public API tokens in full plaintext into the session transcript
— broad scopes including `credential:read`/`credential:update`/
`workflow:update`. Backed up the n8n DB, then immediately revoked (deleted)
all 3 rows per Gilberto's explicit go-ahead. Likely ad-hoc dev/test keys
from May–June (not confirmed tied to any live external integration), but
treated as exposed regardless once printed.

**RESOLVED (2026-07-28, later same day): Vercel app redeploy.** Gilberto
set `VITE_SUPABASE_PUBLISHABLE_KEY` in the Vercel dashboard to the new
`ANON_KEY` (`VITE_SUPABASE_URL` unchanged) and redeployed. **Verified
live**: fetched `app.songssintelligence.com`'s actual deployed JS bundle
(`/assets/index-BssHilCq.js`) and confirmed the embedded anon key matches
the new value exactly; a real `GET /rest/v1/plan_limits` call through Kong
using that key with `Origin: https://app.songssintelligence.com` returned
a real `200` with data (not a 401); `/auth/v1/health` through Kong with
the same key/origin also returned `200`. The app no longer 401s for real
visitors.

**RESOLVED (2026-07-30): landing page redeploy — closes out this rotation
entirely.** `/root/songss-landing-page/.env`'s `VITE_SUPABASE_PUBLISHABLE_KEY`
updated to the new `ANON_KEY` (old value backed up to
`.env.backup_20260730_pre_landing_page_key_update`), rebuilt via `PATH=
"/snap/bin:$PATH" npm run build` (per the node-version workaround — VPS
default `node`/`npx` is v12). Noted: the build's own `scripts/
ensure-wrangler.mjs` now auto-copies `wrangler.json` into `dist/server/`
as part of `npm run build` — the separate manual `cp wrangler.json
dist/server/wrangler.json` step in §9 is no longer needed, the build
script handles it. Gilberto created a fresh `CLOUDFLARE_API_TOKEN`,
`wrangler deploy` run from `dist/server`, token revoked immediately after
per Golden Rule 7.

**Live-verified end-to-end**: live page at `songssintelligence.com`
(`www.` 301s to the bare domain) serves `index-CUlwJLtf.js` —
hash-identical to the fresh local build. Fetched that live bundle
directly: new anon key present, old key absent (0 matches). Real Kong
REST call from the landing page's own origin
(`Origin: https://songssintelligence.com`) — `GET /rest/v1/plan_limits`
with the new key → real `200` with actual plan data; `/auth/v1/health`
with the same key/origin → `200`; the same REST call repeated with the
**old** key → real `401` (proves the old key is actually dead, not just
that the new one happens to work — same negative-control pattern used to
verify the app).

**Current live impact**: none — app, landing page, and backend are all on
the new key. This closes the entire 2026-07-28 JWT rotation; the only
deliberately-skipped piece is a live disposable NIE run through n8n
(mentioned as a nice-to-have in the original plan, not required since the
backend/Supabase side of this rotation was already independently
live-verified on 2026-07-28).

RESOLVED (2026-07-30): **n8n encryptionKey rotation** — Tier 1 security
item, deferred since the key was accidentally printed into a conversation
transcript on 2026-07-09 (see `project_n8n_encryptionkey_rotation_pending`
in memory). This key encrypts the `data` column of all 15 rows in n8n's
own `credentials_entity` table (AES-256-CBC) — decrypted in memory at
workflow runtime for every node that uses a stored n8n Credential.
Confirmed beforehand: no `N8N_ENCRYPTION_KEY` env var existed anywhere
(compose file, `.env`, `secrets.env`) — the config file at
`/docker/n8n/.n8n/config` (a single-key JSON, `{"encryptionKey": ...}`)
was the sole source of truth, exactly as this section previously stated.

**Dry run first** (Gilberto's explicit ask, given this touches all 15
credentials): full mechanism proven end-to-end on an isolated scratch
copy — a throwaway n8n container (`--rm`, never touching the real
`n8n_songss` container or its bind-mounted volume) against a `.backup`-based
online-consistent copy of the real DB + config. Sequence tested: export
all 15 credentials decrypted under the original key → swap in a disposable
test key → confirm the *old* ciphertext now fails to decrypt (proves the
real risk — n8n fails this loudly and cleanly, "Credentials could not be
decrypted," not silent corruption) → `import:credentials` re-encrypts all
15 under the new key → re-export and diff byte-for-byte against the
original decrypted data (same 15 IDs, same names/types, identical secret
values). **Real finding from the dry run that changed the live procedure**:
n8n hard-validates that `N8N_ENCRYPTION_KEY` (env) matches the config
file's stored `encryptionKey` at startup — a mismatch refuses to boot
entirely, rather than silently misbehaving. So the config file and env var
must be updated together, in the same operation, not the env var alone.

**Storage decision (Gilberto, 2026-07-30)**: promote the key from
config-file-only to an explicit `N8N_ENCRYPTION_KEY` in
`/docker/n8n/secrets.env` (same visible, git-ignored, 600-perm pattern as
every other secret in this project — `PERPLEXITY_API_KEY`,
`STRIPE_WEBHOOK_SECRET`, etc.) rather than leaving it file-only.

**Deployed**: backup first (`manual_20260730_214815_pre_encryptionkey_rotation.
{sqlite,config.json}` — online `.backup`, not a plain `cp`, per the
established WAL-consistency lesson — plus
`secrets.env.pre_encryptionkey_rotation_20260730_221122`). New 64-char hex
key generated, written consistently to both `config` and `secrets.env` via
script (value never echoed to a terminal at any point), confirmed
byte-identical across both files before touching the running container.
`docker compose up -d --force-recreate n8n` (plain `restart` doesn't pick
up `env_file` changes — standing lesson). Container came back up clean, no
mismatch error. Then: `export:credentials --all --decrypted` against the
live instance (still on the old key) → new key active via the recreate →
`import:credentials` re-encrypts all 15 live credentials → re-exported to
confirm the new key can actually decrypt what was just written (not just
"import said success") — 15/15 IDs match, all decryptable. The plaintext
export file was deleted immediately after each use (both the live one and
the dry run's), confirmed via `find` that no copies remained anywhere on
disk afterward.

**Live-verified on the real customer path**: a disposable test session
(`cs_test_encryptionkey_rotation_verify_20260730`, seeded directly into
`intelligence_reports` with `artist_name IS NULL` per the established
false-409-avoidance pattern) fired through the real `Submit Trigger`
webhook (Chappell Roan, real TikTok handle). Returned a clean
`{"status":"ok"}` / `200`, and the resulting row confirmed a fully real,
complete report: correct `artist_name` written back (proves `Update Artist
Name` authenticated via the **Supabase Service Role Auth** credential),
real `spotify_data`/`engagement_metrics`/`industry_buzz_data`, a real
`digital_score` (87) and a full 49,991-character `report_markdown` (proves
the **Google Gemini SONGSS** `googlePalmApi` credential decrypted and
authenticated correctly under the new key). The n8n execution itself
closed out clean (`status: success`, no hang). Test row deleted after, 0
rows left.

**Scope note, found during verification**: of the 15 stored credentials,
only 3 are actually used by the live, active workflow
(`Songss | NIE V4.2 SEQUENTIAL`) — **Supabase Service Role Auth**
(httpHeaderAuth, 9 nodes), **SMTP account** (welcome/report emails), and
**Google Gemini SONGSS** (googlePalmApi, the real NIE Engine LLM calls).
The `Perplexity — Web Intelligence`, `GPT-4o — Financial Analysis`,
`Industry Buzz Tracker — Perplexity`, and `Gemini — Brand Intelligence`
nodes all have **zero n8n Credential wiring** — they read
`PERPLEXITY_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY` directly from
`secrets.env` via raw headers, not through the encrypted credential store
this rotation touches. The other stored credentials (2 Supabase accounts,
3 Anthropic accounts, CloudConvert, HTML-to-PDF, 4 generic Header Auth
accounts) are legacy/dead, used only by inactive old workflow versions
(V4.1, V4.2 FIXED TESTE) — not exercised by, or relevant to, the live
customer path. All 15 still round-tripped correctly regardless, since the
rotation re-encrypts the whole table, not a chosen subset. SMTP itself
was not independently node-level verified this session (the live test
confirmed the other 2 credentials plus overall execution success) — no
reason to expect it behaves differently from the other 14, all of which
round-tripped identically in the structural verification.

RESOLVED (2026-08-01): **n8n version upgrade, 2.28.3 → 2.32.7 — last Tier 1
security item, completed.** Follow-on to the 2026-07-31 paused assessment
(see `project_n8n_upgrade_2.32.7_assessment_2026-07-31` in memory) and the
2026-07-09 original advisory review.

**Pre-upgrade, same session**: confirmed no new advisories shipped since
2026-07-31 (re-fetched the GHSA list, still only the July 22 batch as
latest) and that `2.32.7` was still npm's `stable`/`latest` tag. Closed
the two items yesterday's assessment left open: `GHSA-2x35-3fw4-9jr4`
(Send Email SSRF/file-read) — audited all 3 `emailSend` nodes field-by-
field (`fromEmail` hardcoded static on all 3, `toEmail`/`subject`/`html`
only ever interpolate narrow scalar values inside static templates, no
`options.attachments` configured anywhere) — **confirmed N/A**, the
Nodemailer type-confusion vector needs a field to *be* an object, never
the case here. `GHSA-x5vx-c2c8-m3w9` (AI Agent Viewer-role privesc) —
checked `project`/`project_relation`/`shared_workflow` directly: exactly 1
personal project, 1 `project:personalOwner` relation, all 7 workflows
`workflow:owner` under that same project — **confirmed N/A**, no
shared/Viewer access exists at all. Final tally across both advisory
batches (23 GHSAs total): 7 apply (all core-engine bugs needing an
authenticated editor account to exploit — this upgrade is the fix), 15
confirmed N/A, 1 low-relevance (single-tenant instance).

**Also resolved same session, a separate pending question from
2026-07-31**: the yellow/orange "Publish" indicator in the editor was
investigated via direct DB query (not guessed) — `workflow_entity.versionId`
(`c8a04b97`, frozen since a real editor autosave on 2026-07-18) doesn't
match `activeVersionId` (`a09c4898`, frozen since 2026-07-13); neither
`workflow_history` row had been touched since those dates because none of
the raw-SQL "3 DB location" patch scripts (retention_rate, ltv_projection,
growth_trajectory, industry buzz tracker, apikey credential migration,
etc.) ever wrote to those two pointer columns, only to `nodes`/
`connections`. Confirmed the live `workflow_entity.nodes` (what n8n
actually executes off `active=1`) already reflected every fix through
2026-07-28 — every live-verification test done across all those sessions
succeeded without ever clicking Publish. Conclusion: Publish only
resyncs version-history bookkeeping, not runtime behavior — clicking it
was not required before this upgrade. Not clicked; left as-is.

**Deployed**: backup first (`.sqlite` via online `sqlite3 ... ".backup"`,
not a plain `cp`, plus `.n8n/config` — both timestamped
`manual_20260801_111951_pre_n8n_2.32.7_upgrade.*`), `docker pull
n8nio/n8n:stable` (resolved to 2.32.7), `docker compose up -d
--force-recreate n8n` (plain `restart` doesn't pick up an image change —
standing lesson). Clean startup: all migrations completed, no
encryptionKey mismatch, both active workflows (`SONGSS Lead Magnet`,
`Songss | NIE V4.2 SEQUENTIAL`) auto-reactivated. `n8n --version` confirms
`2.32.7`.

**Live-verified end-to-end on the real customer path**: disposable test
session (`cs_test_n8n_2327_upgrade_verify_20260801`, seeded with
`artist_name IS NULL` per the established false-409-avoidance pattern)
fired through the real `Submit Trigger` webhook (Chappell Roan, real
TikTok handle). Clean `{"status":"ok"}` response, execution status
`success`. Resulting row confirmed fully real: correct `artist_name`
written back, `digital_score: 85`, `retention_rate: 46`,
`ltv_projection: 8348649`, a real 6-point `growth_trajectory`,
`social_engagement_index: 63` (matches this same artist's known historical
TikTok-derived value exactly), `industry_buzz_data` populated, and a full
49,994-character `report_markdown`. `processed_sessions` row present,
confirming `Send Report Email` (SMTP) completed before the final node ran.
**All 3 live credentials confirmed working post-upgrade**: Supabase
Service Role Auth (artist-name write-back + all REST calls), Google
Gemini SONGSS (the real report text), SMTP account (report email send).
Test session + `processed_sessions` row deleted after, 0 rows left.

**Not yet done, deliberately deferred**: post-upgrade sanity checks for
the two non-breaking changelog items flagged in yesterday's assessment
(webhook-auth scoping, credential-sharing model rename) weren't
separately re-verified beyond the live test above, since that test already
exercised the one credential-dependent path that matters
(Supabase/Gemini/SMTP all authenticated correctly). New deprecation
warnings surfaced in the 2.32.7 startup log (`WEBHOOK_URL` →
`N8N_WEBHOOK_URL`, several `N8N_*` default-value-change notices) — none
block anything today, worth a config cleanup pass in a future session, not
urgent.

**Key finding: the 2026-07-09 assessment's target version and one of its
N/A calls are both stale.** A second advisory batch (10 GHSAs) shipped
2026-07-22, after that assessment — the real target is now **2.32.7**
(latest stable as of 2026-07-31, itself released that same day; a 2.33.x
pre-release track already exists, so re-check the actual latest stable at
upgrade time), not 2.29.8, since 2.29.8 only covers the July 8 batch.
Upgrading straight to latest covers both batches in one hop. Separately,
the 2026-07-09 memory's "Confirmed N/A" call on the AI Agent/LangChain CVEs
(`GHSA-x5vx-c2c8-m3w9`, `GHSA-89gh-3pgc-v5h2` — reasoned as "Gemini is
called via direct HTTP Request node, not a LangChain/Agent/Chat node") is
**no longer true**: the live workflow now has 3 `@n8n/n8n-nodes-langchain.agent`
nodes (`NIE — Neural Intelligence Engine`, `AI Agent`, `NIE — Indie Coach`)
and 2 `lmChatGoogleGemini` nodes, added between 2026-07-09 and now (most
likely via the STRATEGIC DATA EXTRACTION PROTOCOL / Industry Buzz Tracker
work). Re-assessed 2026-07-31: both still likely low real risk on this
single-owner instance (`GHSA-x5vx-c2c8-m3w9` needs a shared-project
"Viewer" role — confirmed via direct DB read that only one `user` row
exists, role `global:owner`; `GHSA-89gh-3pgc-v5h2` needs a custom-header
LLM credential — our Gemini nodes use the native `googlePalmApi` credential
type, not a header-based one) but **not exhaustively confirmed** — flag
for re-verification in the actual upgrade session, and don't trust any
prior "N/A" determination in this doc/memory without re-checking node
types against the *current* workflow export, since this pipeline has
changed substantially since 2026-07-09.

**Full current CVE picture (both batches, patched by 2.31.5/2.32.1 or
earlier)** — see memory `project_n8n_upgrade_2.32.7_assessment_2026-07-31`
for the complete per-advisory table. Summary: node-type-confirmed N/A —
Git node, MCP Client node, Snowflake node, Edit Image node, Execute
Sub-workflow node (none used anywhere in the active workflow, confirmed via
full node-type inventory of the live export). Confirmed N/A — Resource
Locator XSS (`GHSA-9wcp-9r3j-383q`, the one open TODO from the 2026-07-09
memory — checked today, zero `__rl`/resourceLocator usage anywhere in the
active workflow's export). Applies, needs real fixing — core expression
engine bugs (`GHSA-pm35-fqvh-cq5g`, `GHSA-hx4h-vr3m-45vh`,
`GHSA-gv7g-jm28-cr3m`) and Edit Fields/Set node prototype pollution
(`GHSA-xwx6-jjhv-84p8`, we use Set 4x) — all require an authenticated n8n
editor account to exploit, not a remote/webhook attacker, but still a real
gap since these are core-engine bugs on the exact expression syntax this
workflow uses everywhere. Needs a closer look, not yet fully cleared — Send
Email Node file-read/SSRF (`GHSA-2x35-3fw4-9jr4`): our 3 `emailSend` nodes
(`Send an Email`, `Send Report Email`, `Send Welcome Email`) all use fixed
HTML templates with only narrow string-field interpolation (`plan_name`,
`artist_name`) checked so far, which looks low-risk, but not every field
was audited exhaustively.

**Changelog/breaking-changes check (2.28.4 → 2.32.7)**: pulled via
`raw.githubusercontent.com/.../CHANGELOG.md` — no explicit `BREAKING
CHANGE` entries found for this range. Notable non-breaking items worth a
post-upgrade sanity check: webhook-auth scoping changes (shouldn't affect
us — Stripe Webhook uses our own HMAC verification, not n8n's native
webhook auth) and a credential-sharing model change ("private credentials"
→ "end-user credentials", creation now limited to owner/admin/project-admin
roles) — low expected impact on a single-owner instance, but verify the 3
live credentials (Supabase Service Role Auth, SMTP account, Google Gemini
SONGSS) are still reachable post-upgrade regardless. This changelog pull
was a single AI-summarized fetch of one file, not an exhaustive per-version
read — re-pull closer to the actual upgrade date.

**Methodology note for next session**: fetching the GHSA advisories *list*
page (github.com/n8n-io/n8n/security/advisories) via WebFetch produced
self-contradictory GHSA-ID-to-title mappings across two separate fetches
of the same page — do not trust that summarized table. Fetching each
individual advisory page (`.../security/advisories/GHSA-xxxx`) one at a
time was reliable and internally consistent every time — always do it that
way, never batch through the list view.

**Incident during this session, resolved, no lasting damage**: while
trying to check n8n's user accounts (single-owner vs. shared project
viewers, relevant to `GHSA-x5vx-c2c8-m3w9` above), ran `n8n
user-management:reset` inside the container without first confirming what
that command actually does — it resets the entire `user` table to
fresh-install state, not a read-only account listing. This wiped the owner
account's `email`/`firstName`/`lastName`/`password` (row itself survived,
`role=global:owner` intact, `password` went `NULL`), which reverted the
editor UI to n8n's first-run "set up owner account" screen. **Confirmed
NOT affected**: n8n version (still 2.28.3), the credentials table, both
active workflows (`SONGSS Lead Magnet` and `Songss | NIE V4.2 SEQUENTIAL`,
both confirmed still `active=1` in the DB and via `n8n list:workflow`
before and after), and the container itself (never restarted throughout —
the live Stripe-webhook → NIE pipeline was never interrupted, this only
ever affected editor-UI login). **Fixed**: Gilberto created a fresh owner
account through the setup screen; confirmed afterward via direct read-only
`sqlite3 -readonly` query that `admin@songssintelligence.com` / Gilberto
Georg / `global:owner` / a real 60-char password hash are now all present,
and both workflows are still `active=1`. See
`project_n8n_user_management_reset_incident_2026-07-31` in memory for the
full incident timeline, and `feedback_verify_cli_semantics_before_running`
for the standing lesson this created.

**Status**: paused here, Gilberto's call ("enough excitement for one
session") — no image change, no upgrade performed. Next session should
start from the memory file above rather than re-deriving any of this.

RESOLVED (2026-08-15): **SSH hardening — password auth disabled, root
login restricted to keys.** Part of a broader security audit sweep (RLS
coverage, Postgres port exposure, SSH, off-site backups, Stripe webhook —
see §11 for the still-open items). Found via `sshd -T`:
`PasswordAuthentication` was effectively **yes** and `PermitRootLogin`
**yes**, and every recent login in `/var/log/auth.log` was `Accepted
password for root` (zero `publickey`) — i.e. the only working auth was
passwords, on a box actively being brute-forced by internet bots.

**Key correction to the initial read** (confirm, don't assume): the two
files in `/etc/ssh/sshd_config.d/` (`50-cloud-init.conf` = `yes`,
`60-cloudimg-settings.conf` = `no`) looked like a "conflict," but the main
`/etc/ssh/sshd_config` has **no `Include` line at all** (hand-customized,
old 2017 OpenBSD-template header, `PermitRootLogin yes` manually appended
after the `Match` example) — so **both drop-ins are inert/unread**. The
real control point is the main config: password auth was `yes` purely by
default (its line was commented), root `yes` from the appended line.
Confirmed by reading the whole file, not assuming standard-Ubuntu Include
behavior.

**Lockout-avoidance (Gilberto's explicit gate)**: did NOT disable password
auth until key login was proven. First key-only test
(`ssh -o PreferredAuthentications=publickey -o PasswordAuthentication=no`)
**failed** (`Permission denied`) — the pre-existing `gilberto@wwtvplay.com`
ed25519 key already in root's `authorized_keys` had no matching private
half on Gilberto's laptop. Server side was healthy for keys (perms
StrictModes-clean, `PubkeyAuthentication yes`, ed25519 accepted, zero key
failures in the log), so the gap was client-side. Gilberto generated a
fresh ed25519 keypair locally; its public key
(`SHA256:Yvzbc9wDCVloo1fdrlMHNK9+QdPk88dErIxZ+tcBS4s`) was appended to
`/root/.ssh/authorized_keys` (backup
`authorized_keys.backup_20260815_112320` first, dedupe-checked, 8→9 keys,
perms `600 root:root`, re-validated with `ssh-keygen -l -f`). Note: two
ed25519 keys now carry the `gilberto@wwtvplay.com` comment — the old
orphan (`SHA256:3NEJ9O…`, private half lost) and the new working one
(`SHA256:Yvzbc9…`); orphan left in place, prune later if wanted.

**Applied**: backup `sshd_config.backup_20260815_112822` first, then in the
main config `PasswordAuthentication no` + `PermitRootLogin prohibit-password`
(renders as `without-password` in `sshd -T`), plus aligned the inert
`50-cloud-init.conf` to `no` (backed up) so no self-contradictory config
remains on disk if an `Include` is ever added later. `sshd -t` passed →
`systemctl reload ssh` (**reload, not restart** — existing sessions
survive; the standing docker-compose lesson's SSH analogue).

**Live-verified end-to-end**: a fresh `Accepted publickey for root ...
ED25519 SHA256:Yvzbc9…` from Gilberto's IP appeared in `/var/log/auth.log`
before the change; after the reload, Gilberto confirmed from a new session
that (1) key login still works with no password prompt, and (2)
password-only login now returns `Permission denied (publickey)`. Rollback
path (unused): `cp /etc/ssh/sshd_config.backup_20260815_112822
/etc/ssh/sshd_config && systemctl reload ssh`. Effective config now:
`passwordauthentication no`, `permitrootlogin without-password`,
`pubkeyauthentication yes`.

**Other sweep items (2026-08-15, see §11)**: RLS confirmed enabled on all
5 public tables (`intelligence_reports`, `plan_limits`,
`processed_sessions`, `spotify_artist_cache`, `teams` — not just the one
verified before; `processed_sessions`/`teams` deny-all with zero policies,
correct); Postgres 5432 confirmed NOT host-published (internal Docker
network only, `supabase-pooler` publishes no ports either); off-site
backups confirmed **absent** (local-only — open item); Stripe webhook
signature verification structurally intact + secret/crypto present, but a
claimed "Douglas's case" break has no record in docs/memory/git and is
unconfirmed.

RESOLVED (2026-08-15): **Off-site encrypted backups to Cloudflare R2 —
closes audit item #4, the last open item from the 2026-08-15 sweep.**
Architecture: daily cron → Supabase `pg_dumpall` + WAL-safe n8n `.n8n`
backup → gzip → GPG symmetric AES-256 (passphrase from `secrets.env`,
never hardcoded) → `rclone` upload to R2 → local shred. 30-day retention
via an R2 bucket lifecycle rule (set in the CF dashboard, not in-script).

- **Script**: `/docker/n8n/offsite_backup.sh` (700 root). Reads secrets
  literally from `secrets.env` (no shell interpretation → any passphrase
  chars safe). n8n step uses `sqlite3 ".backup"` (WAL-safe, standing
  lesson) + includes `.n8n/config` (the encryptionKey — required to
  decrypt n8n creds on restore) + `nodes`/`storage`. **Backs up only
  `.n8n` (132M), NOT `/docker/n8n` (17G of old corrupt-DB junk.)** Supabase
  step: `docker exec supabase-db pg_dumpall -U postgres`. GPG passphrase
  via `--passphrase-fd 0` (never argv). `DRY_RUN=1` builds+encrypts+tests
  R2 connectivity without uploading.
- **rclone**: apt-installed (`v1.53.3`; old but works with R2 via the S3
  backend using `provider=Other` + endpoint + `no_check_bucket=true` —
  R2 rejects the HEAD-bucket probe). Remote configured entirely via
  `RCLONE_CONFIG_R2_*` env vars in-script (no rclone.conf; the "config
  file not found" NOTICE is harmless).
- **secrets.env additions** (via `/root/secrets_upsert.py`, a hidden-prompt
  `getpass` helper Gilberto ran himself so values never hit the
  transcript): `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`,
  `BACKUP_GPG_PASSPHRASE`. **The GPG passphrase is ALSO saved in Gilberto's
  Google Drive** — critical: the on-VPS copy dies with the VPS, and without
  an off-VPS copy the R2 backups would be undecryptable exactly when
  needed.
- **R2 API token**: scoped to Object Read/Write on the single
  `songss-offsite-backups` bucket only. Unlike Golden Rule 7's
  create-use-revoke deploy tokens, this one is long-lived (cron needs it);
  the tight scoping is the mitigation.
- **cron**: `0 3 * * *` daily → `offsite_backup.sh`, logging to
  `/docker/n8n/backups/offsite_backup.log`. Separate from the existing
  hourly LOCAL n8n backup (`backup_n8n.sh`), which stays as-is.
- **Tested end-to-end 2026-08-15**: DRY_RUN → real run (uploaded +
  post-upload verified in R2, nothing kept locally) → restore test
  (downloaded from R2, decrypted, extracted). n8n side **fully
  live-restored** (real queries: integrity ok, 8 workflows, 15 creds,
  active NIE workflow present). Supabase side **statically verified
  complete** (41/41 `intelligence_reports` == live, 6 `plan_limits`, 5/5
  key roles, clean completion) — authoritative proof the artifact holds
  all live data. A live-container Supabase restore hit throwaway-harness
  artifacts (pg_dumpall superuser-password reset self-shutting-down the
  container; a password-line filter then corrupting the COPY stream) —
  NOT backup defects. **Re-verified definitively same session**: unfiltered
  restore into a throwaway stock `postgres:15-alpine` (local-socket peer
  auth, no supervisor to self-shutdown) live-queried `intelligence_reports`
  41/41 == live + `plan_limits` 6 — Supabase side now fully live-restore-
  confirmed too. All plaintext shredded, test image removed after.

RESOLVED (2026-08-16): **Douglas real-customer bug-discovery session — 3
distinct fixes, all found because a real paying customer actually tried to
use the product post-launch.** Reinforces Gilberto's 2026-08-15 call to
prioritize building automated pre-launch testing agents — these 3 bugs
would very plausibly have been caught before any real customer hit them,
by a suite that actually logs in, checks the dashboard, and submits a
report end-to-end rather than only exercising the n8n/DB layer via
disposable sessions the way this project's testing has to date.

**Fix 1 — password reset.** Douglas (`drm@grupooqta.com.br`) needed a
working login. Set directly via the GoTrue admin API through Kong
(`PUT /auth/v1/admin/users/{id}`, `password` + `email_confirm: true` +
`ban_duration: "none"`). Confirmed via the lookup first that his account
was already `email_confirmed_at`-set and not banned — the reset only
needed the password itself. **Live-verified** with a real
`grant_type=password` token exchange against his exact user ID
(`102638e9-a761-4c51-ac58-8fad5ecd8f1d`) before handing the credential
back — proves the password actually works, not just that the API call
returned 200. Scratch files holding the password/API responses shredded
after Gilberto confirmed he'd copied and sent it.

**Fix 2 — `intelligence_reports.user_id` NULL, causing "No active plan
found for this account" on the Dashboard.** Root cause: Douglas's report
row (`session_id cs_live_a1IaFR...`, `Artist Indie`, created
2026-08-15T21:10:53Z) was a manual recovery insert from the Stripe-webhook
outage (see the `$binary` regression entry above) that predates his
Supabase Auth account by 2 seconds and was never linked to it —
`user_id` stayed `NULL`. Both `get_quota_status()` and
`request_new_report()` resolve plan/quota by
`WHERE ir.user_id = v_owner_id` (`v_owner_id = auth.uid()` via
`pool_owner_id`), so a `NULL` `user_id` can never match a real signed-in
user — the RPC correctly fell through to
`RAISE EXCEPTION 'No active plan found for this account'`. The report
still appeared in the Dashboard's "Your Reports" history table because
that query filters by `customer_email`, a completely separate path that
doesn't hit this gap — which is why the symptom looked like a display bug
rather than a missing foreign key. **Fix**: single-row
`UPDATE public.intelligence_reports SET user_id = '102638e9-...' WHERE
session_id = '...' AND user_id IS NULL`. **Deviation from Golden Rule 6**:
no `pg_dump` backup was taken first — a low-risk single-row UPDATE on a
NULL field felt low-stakes in the moment, but the rule says *always*, no
exception carved out for "small." Noted as a real gap, not a one-off
excuse — see `feedback_backup_before_any_db_write` in memory. **Verified**
via a rolled-back-transaction simulation of Douglas's real JWT
(`SET LOCAL request.jwt.claims`) calling the real `get_quota_status()` RPC
post-fix: returned `Artist Indie / 1 / 4` correctly. A second, older row
(`douglas@grupomuzika.com.br`, a same-person test-email row from
2026-08-15) has the identical `user_id IS NULL` gap — deliberately left
alone, Gilberto's explicit call, not a real ongoing account.

**Fix 3 — Cloudflare WAF Rule 4 blocked the CORS preflight, not just the
POST, breaking report submission for any browser whose preflight didn't
carry the expected Referer.** Douglas got a client-side "Load failed"
(exact wording is Safari/WebKit's for a network-level `fetch()` failure,
distinct from this codebase's own `Webhook error {status}` message for a
real HTTP error response — see `src/pages/Submit.tsx` line ~197) trying to
submit a new report, even though Cloudflare Turnstile itself passed.
Root cause, confirmed via direct curl testing against the live endpoint:
`Submit.tsx`'s cross-origin `fetch()` (`app.songssintelligence.com` →
`n8n.songssintelligence.com`, `Content-Type: application/json`) triggers a
mandatory browser CORS preflight `OPTIONS` request first. Rule 4 ("Protect
submit endpoint — Managed Challenge without correct Referer") was matching
`OPTIONS` requests too, not just the real `POST` — an `OPTIONS` preflight
with no Referer got `403` + `cf-mitigated: challenge` + **zero CORS
headers**, which the browser treats as a hard CORS failure and aborts
before ever sending the real POST (or the Turnstile token) — meaning
Turnstile passing was irrelevant, the request never reached n8n. This
was a real bug affecting any customer whose preflight Referer didn't
satisfy the rule, not something specific to Douglas's browser/session.

**Fix, applied directly in the Cloudflare dashboard (not via API — see
below)**: appended `and http.request.method eq "POST"` to Rule 4's
expression, scoping the Referer check to the real POST only and letting
`OPTIONS` preflights pass through untouched. **Live-verified**, 3 cases:
`OPTIONS` no-Referer preflight → `204` with proper
`access-control-allow-origin` (was `403`+challenge); `POST` no-Referer →
still `403` (real bot protection intact, unchanged); `POST` with correct
Referer → still `200` (normal flow unchanged).

**Tooling note for next time a WAF rule needs an API-driven fix**: the
first Cloudflare token Gilberto created only had Zone Read-level access
(zone lookup succeeded, but every `/rulesets/...` endpoint returned a
generic `Authentication error`, code 10000 — indistinguishable via the API
alone from "bad token"). A second token, explicitly re-created for Zone →
Firewall Services → Edit, verified as `active` via
`/user/tokens/verify` but *still* got the identical `Authentication error`
on every ruleset endpoint while zone-level reads kept working — a
dashboard token-creation issue on Cloudflare's side, not a scope typo
recoverable by retrying the same flow. Gilberto made the fix directly in
the dashboard UI instead; the change was still independently verified via
curl exactly as an API-driven fix would have been. Both tokens revoked
after use, per Golden Rule 7.

RESOLVED (started 2026-08-16, fully verified 2026-08-18): **Spotify
artist-identity mismatch guard.**
Found investigating MaLu's (`@malucantora`) real report: Apify's Spotify
search matched "MaLu" (a Brazilian Voice Brasil contestant, real
customer) to **Maluma** (the global reggaeton star) — confirmed via
`spotify_data.artist_name: "Maluma"`, a real Maluma `artist_uri`, and
`peer_benchmark_data.client_name: "Maluma"` benchmarked against Ozuna/
Rauw Alejandro/Farruko. The report's own AI-generated "Digital Hygiene
Index" section self-detected this ("Spotify: Mismatch. Data provided for
'Maluma', not 'MaLu'. Critical identity error." — also flagged Deezer and
Last.fm mismatches against two *different* wrong "Malu"/"Malú" people),
but nothing downstream ever reads that flag — every code-computed
real-data metric since the retention_rate/ltv_projection/growth_trajectory
rework (§4) blindly trusts `structured_data.spotify_data` as ground
truth. Result: `retention_rate: 54`, `ltv_projection: $14.8M`, and the
full `growth_trajectory` curve were all real numbers — for Maluma, shown
to a different real customer as her own.

**Fix implemented (code-level, not dependent on the AI's own hygiene
text)**: a whole-word name comparison (`artistNamesMatch()`, added to the
`Code in JavaScript` node) between the requested `artist_name` and
`spotifyRaw.name`. Deliberately whole-word, not substring — naive
substring containment would have let `"malu"` match inside `"maluma"`
and missed this exact case. On mismatch, `spotify_data.monthly_listeners`/
`followers` are zeroed (kept `artist_name`/`artist_uri` as a diagnostic
breadcrumb); every existing `monthly_listeners > 0` guard downstream
already nulls `retention_rate`/`ltv_projection`/`growth_trajectory`
correctly with zero other code changes needed, and the frontend's Monthly
Listeners KPI tile (reads `spotify_data.monthly_listeners` directly per
the `monthly_streams` removal fix) is protected the same way, for free.
**Explicit known limitation, not fixed this pass**: two real different
people sharing the literal same name (the Deezer/Last.fm mismatches seen
in the same MaLu report) can't be caught by name comparison alone — out
of scope, flagged for a future session if it recurs.

**Deployed and verified so far**: backup taken first (online `.backup`,
`manual_20260816_155655_pre_spotify_identity_guard.sqlite` — redone
properly after an initial plain `cp` was caught and corrected mid-session,
see [[feedback_backup_before_any_db_write]]). Dry run against a scratch
DB copy succeeded (`OLD` block found and replaced cleanly in all 3
locations). Syntax-checked clean with the container's own `node --check`.
**Isolated unit test of `artistNamesMatch()` passed 10/10 cases**,
including the exact motivating bug (`"MaLu"` vs `"Maluma"` → correctly
`false`) and false-positive guards (`"Chappell Roan"` vs itself, `"MC
Kevin"` vs `"MC Kevin o Chris"` — a legitimate official-name variation —
both correctly `true`; `"Bush"` vs `"Bushido"` correctly `false`, proving
the whole-word design avoids the substring trap). Applied live to all 3
DB locations (`workflow_entity.nodes` + both `workflow_history` rows,
`versionId c8a04b97-...`/`a09c4898-...`, same two rows as every fix since
2026-07-18). `docker restart n8n_songss` — clean startup, both active
workflows re-activated, no errors (two "DNS server returned an error"
log lines are pre-existing unrelated noise, present both before and after
this restart). Export-diff confirmed exact scope: 63/63 nodes, only
`Code in JavaScript` changed, connections byte-identical.

**Live test 1 (the real bug case) — PASSED**: disposable session
`cs_test_spotify_identity_guard_malu_20260816` (artist "MaLu", Instagram
`malucantora`) fired via the real `/webhook/submit-analysis` webhook.
Apify reproduced the identical "Maluma" mismatch (confirms it's
deterministic, not a fluke) — and this time the guard correctly caught
it: `spotify_data` came back `{followers: 0, monthly_listeners: 0,
artist_name: "Maluma", artist_uri: <real Maluma URI>}`, and
`retention_rate`/`ltv_projection`/`growth_trajectory` were all correctly
`null` instead of polluted.

**Live test 2 (Chappell Roan regression check) — RESOLVED 2026-08-18, was
a concurrency artifact, not a real regression.** Root cause found via
`execution_entity`: the original 2026-08-16 regression run
(execution 138) had `status: canceled`, `finished: 0`, ran for exactly
300 seconds (16:05:15.729 → 16:10:15.846) — an exact match for this
project's `EXECUTIONS_TIMEOUT=300`. It had been fired nearly
simultaneously with the MaLu test (execution 139, started 16:07:24 while
138 was still running) rather than sequentially, so it got starved/hung
and was killed by the timeout mid-run, before ever reaching the PATCH
step — hence the all-`NULL` `report_markdown`/`spotify_data`, unrelated
to the identity-guard code change itself.

**Confirmed by re-running both tests sequentially, alone, 2026-08-18**:
1) regression check re-run
(`cs_test_regression_check_rerun_20260818`, Chappell Roan, real TikTok
handle) completed cleanly end-to-end with zero concurrency — real
20,690-char `report_markdown`, `spotify_data.artist_name: "Chappell
Roan"`, `monthly_listeners: 30555655`, `retention_rate: 46`,
`ltv_projection: 8448027` (exact match to the existing formula:
`round(30555655 × 0.012 × 24 × 0.96) = 8448027`), `growth_trajectory`
correctly anchored — proves the identity-guard patch introduced no
regression to the normal (non-mismatch) path. 2) MaLu identity-mismatch
case re-run alone afterward
(`cs_test_malu_identity_guard_rerun_20260818`, artist "MaLu", Instagram
`malucantora`) reproduced the exact original bug scenario and confirmed
both halves of the fix still hold: the AI's own Digital Hygiene Index
still detects and reports the mismatch in the generated report text
(`"Spotify: 🔴 Mismatched artist data ("Maluma" instead of "MaLu")."`,
plus a separate MusicBrainz mismatch against a third wrong "Malú"), and
the code-level guard correctly zeroed `spotify_data.monthly_listeners`/
`followers` (keeping `artist_name: "Maluma"`/a real Maluma `artist_uri`
as a diagnostic breadcrumb) with `retention_rate`/`ltv_projection`/
`growth_trajectory` all `null` — not the polluted Maluma numbers the
original bug produced. Both test sessions reached `Save Processed
Session` (real `processed_sessions` rows confirmed SMTP completed). All
4 test rows (today's 2 plus the 2 left over from 2026-08-16) and their
`processed_sessions` rows deleted after, 0 rows left; the scratch file
holding the full report markdown was also deleted. This closes the
Spotify identity-guard fix as fully verified — no code changes were
needed this session, only the outstanding verification.

IMPLEMENTED (2026-08-18): **"⚠️ Limited" badge for null
retention_rate/ltv_projection/growth_trajectory — closes a real display bug
the identity-mismatch guard above exposed.** Once `retention_rate`/
`ltv_projection`/`growth_trajectory` started legitimately going `null`
(2026-08-16's guard), both `src/pages/Report.tsx` and
`src/components/ArtistIndieReport.tsx` were found to still use a
`Number(x ?? 0) || fallback` pattern — this silently turns `null` into `0`,
then `0 || 48`/`0 || 8400`(`4200` on Indie) into a **fabricated number**,
not a blank/broken display as originally suspected. Same bug hit the
Neural Trajectory chart (fell back to a synthetic curve scaled off a fake
28000/12500 listener constant) and, on `Report.tsx` only, three further
consumers that inherit the same fake `retentionRate`/`ltv`: Engagement
Pyramid's "Active Superfans" tier, Artist Radar Profile's "Community" axis
(hardcoded `pending: false`), and Revenue Snapshot / the Enterprise+
"Revenue Model Advanced" 5-Year NPV section (the latter had an *inconsistent*
guard — `(ltv || 25000)` for cashflow but a fully unguarded `ltv * 0.45` for
the revenue-streams table, which would have rendered all-$0 rows on `null`).

**Fix**: all `retentionRate`/`ltv` values are now `number | null`, preserving
`null` instead of coercing through a fallback. New shared primitive in
`src/components/report/shared.tsx` — `LIMITED_LABEL` ("⚠️ Limited"),
`LIMITED_TOOLTIP` ("This data could not be confirmed for this artist or
period."), `LimitedBadge`, `LimitedChartState` (amber, reused across the KPI
tiles, Neural Trajectory, Revenue Snapshot, and Revenue Model Advanced) —
mirrored as local consts in `ArtistIndieReport.tsx` since that file is
deliberately self-contained (doesn't import `shared.tsx`). Deliberately
distinct from the pre-existing softer "—" / native-tooltip convention
already used for `social_engagement_index`/`fan_loyalty_index`/
`industry_buzz` (which means "not enough source data yet") — "Limited" is a
louder, amber warning specifically for a data-quality guard suppressing an
otherwise-computed number. On the Radar chart specifically, this is a new
`limited` flag distinct from the existing `pending` flag (Sync Potential/
Live Performance/Brand Fit, which have no data source at all, ever) — same
distinction, reused in the tooltip formatter and the below-chart grid.
Growth Trajectory's old "legacy pre-2026-07-26 report" synthetic-fallback
curve was deliberately removed rather than preserved alongside the new
Limited state — the two cases are indistinguishable at the frontend (`null`
either way), and showing a fabricated curve for either would contradict the
very "don't fabricate missing data" principle this whole predictive-metrics
rework has enforced since [[project_retention_rate_real_formula_2026-07-23]].

**Verified**: `tsc -p tsconfig.app.json --noEmit` and `vite build` both
clean. Live logic path (real MaLu/Maluma data) already confirmed correct
`null` values reach the frontend in the identity-guard verification above;
this session additionally seeded 2 disposable rows
(`cs_test_limited_badge_verify_growth_20260818` for Report.tsx,
`cs_test_limited_badge_verify_indie_20260818` for ArtistIndieReport.tsx,
both `artist_name: "MaLu"`, `spotify_data.artist_name: "Maluma"`,
`monthly_listeners`/`followers: 0`, `retention_rate`/`ltv_projection`/
`growth_trajectory: null`) and started the dev server (`--host 127.0.0.1
--port 8080`, confirmed via `ss -tlnp` not externally reachable) for a
live visual check — **pending Gilberto's own SSH-tunnel confirmation**,
same as every prior "Live browser visual test" in this doc; not yet
independently screenshot-verified since no headless browser is available
on this VPS. Both test rows deliberately left in the database until that
visual check is done — do not delete
`cs_test_limited_badge_verify_growth_20260818` or
`cs_test_limited_badge_verify_indie_20260818` until confirmed, then clean
up per the usual pattern.

**Not committed to git yet.**

RESOLVED (started 2026-08-18, deployed + live-verified 2026-08-19):
**Artist Identity MVP — optional Spotify Artist Link field, backend uses
direct ID lookup instead of name search when provided.** Builds on the
2026-08-18 Spotify identity-guard work above; this is the proactive
complement — let customers who know they have a name-collision risk
sidestep it entirely by pasting their own Spotify profile link, rather than
relying only on the reactive mismatch-guard/"Limited" badge after the fact.

**Frontend — DONE**: `src/pages/Submit.tsx` — new optional
"Spotify Artist Link" field (`spotifyUrl` state, placed right after Artist
Name) with helper text "For the most accurate results, paste your Spotify
artist profile link (e.g., open.spotify.com/artist/...)."; new helper text
under the Artist Name field itself, "Please enter your artist name exactly
as it appears on streaming platforms for the most accurate results."; POST
body to `/webhook/submit-analysis` now includes `spotify_url:
spotifyUrl.trim()`. `tsc -p tsconfig.app.json --noEmit` clean.

**Backend — DEPLOYED and live-verified.**
Investigated the live workflow export (`8SRNZDEpZKu88qFz`) rather than
assuming a new Spotify Web API integration was needed: the existing
`Spotify` node (`httpRequest`, calls Apify actor
`automation-lab~spotify-scraper`) already supports `mode:"urls"` — direct
artist-URL lookup, no name matching — currently fed exclusively from
`Spotify Search`'s `mode:"search"` result (the exact node responsible for
the MaLu→Maluma collision). So no new API/credential is needed: when a
customer provides their own link, feed it straight into `Spotify`'s
`urls` array and let `Spotify Search`'s risky name-based resolution go
unused for that request.

**Chosen approach (Gilberto's explicit call, 2026-08-18): minimal-diff
option** — `Spotify Search` still runs unconditionally (a small wasted
Apify search call whenever a link is provided) rather than adding an
IF-node bypass to skip it, matching this project's standing preference for
the smallest safe change to the production workflow over saving one minor
API call.

**Patch — exactly 2 nodes, built and validated but not yet applied**:
1. `Submit Context` (Code node, Phase 2/Submit-Trigger path) — add
   `spotify_url: submitBody.spotify_url || ''` to its output object,
   mirroring how `tiktok_username`/`instagram_username` already flow
   through from the webhook body. (Phase 1/Stripe-checkout path's `Extract
   Metadata` node is deliberately NOT touched — Stripe checkout metadata
   has no `spotify_url` field and adding one is out of scope; the
   `Spotify` node's fallback chain checks `Extract Metadata` first purely
   for consistency with every other field's established two-node fallback
   pattern in this workflow, even though it will realistically always be
   empty there today.)
2. `Spotify` node's `jsonBody` — before falling back to
   `$('Spotify Search').first().json.url`, regex-extracts an artist ID
   from the customer-provided `spotify_url` (checked via the same
   `Extract Metadata` → `Submit Context` fallback chain used throughout
   this workflow) and rebuilds it as a canonical
   `https://open.spotify.com/artist/{id}` URL for the actor's `urls` mode.
   Handles `open.spotify.com/artist/ID` with or without `https://`/a
   trailing `?si=...` query string, and the `spotify:artist:ID` URI form;
   any other input (empty, garbage, a non-artist Spotify link like a
   playlist URL) correctly falls through to the existing search-based
   resolution unchanged.

**Validation done this session** (all clean, nothing live-touched yet):
- Backed up first:
  `/docker/n8n/backups/manual_20260818_220411_pre_spotify_artist_link_mvp.sqlite`
  (online `.backup`, not a plain `cp`).
- Confirmed current version pointers unchanged from every fix since
  2026-07-18: `versionId c8a04b97-49dc-4146-8921-7f4835f2df9d` /
  `activeVersionId a09c4898-47db-4a22-970e-25d86ff6a9dd`.
- **Dry run** against an online-`.backup`'d scratch copy of the DB: patch
  script applied cleanly to all 3 locations (`workflow_entity.nodes` +
  both `workflow_history` rows), exactly the 2 target nodes changed,
  63/63 nodes total preserved in each location.
- **Syntax-checked** both patched snippets with the container's own
  `node --check` (v24.18.0, not the host's stale v12) — both clean.
- **Isolated logic test of the ID-extraction regex, 10/10 passed**: full
  URL, URL with `?si=...` query string, URL without `https://`, the
  `spotify:artist:ID` URI form, a trailing-slash variant, empty string,
  `null`, `undefined`, plain garbage text, and — importantly — a
  *non-artist* Spotify link (a playlist URL) correctly returned `null`
  rather than a false match.
- Patch script persisted to a durable VPS path (not just the session's
  ephemeral scratchpad):
  `/docker/n8n/patch_spotify_artist_link_20260818.py` — run as
  `python3 /docker/n8n/patch_spotify_artist_link_20260818.py
  /docker/n8n/.n8n/database.sqlite` to apply. Contains the exact validated
  `jsCode`/`jsonBody` strings for both nodes; asserts exactly `{"Submit
  Context", "Spotify"}` were changed before committing, on both the dry
  run and the live apply.

**Deployed 2026-08-19**: applied
`/docker/n8n/patch_spotify_artist_link_20260818.py` to the live DB (all 3
locations), `docker restart n8n_songss` (plain restart — no env var
changed). Clean startup, both active workflows re-activated, no errors.
**Export-diff confirmed exact scope**: 63/63 nodes preserved (compared
against the pre-patch backup's node/connection set), exactly `Submit
Context` + `Spotify` changed, nothing added/removed, connections
byte-identical.

**Live-verified with a real 3-case suite, fired sequentially** (not
concurrently, per [[project_spotify_identity_guard_verified_2026-08-18]]'s
`EXECUTIONS_TIMEOUT` lesson):
1. **Regression check** — Chappell Roan, real TikTok handle, no
   `spotify_url` — confirmed the existing search-based path unaffected:
   real 25,261-char report, `spotify_data.artist_name: "Chappell Roan"`,
   `monthly_listeners: 30555655`, `retention_rate: 46`. Her real URI
   (`https://open.spotify.com/artist/7GlBOeep6PqTfFi59PTUUN`) captured
   from this run for tests 2/3.
2. **Direct-URL happy path** — same artist name, her own real URL
   (deliberately passed with a `?si=abc123` query string to exercise the
   regex) as `spotify_url` — resolved to **byte-identical real data**
   (same URI, same `monthly_listeners`, same `retention_rate`) as test 1,
   confirming the `mode:"urls"` bypass works end-to-end and the query
   string is correctly stripped.
3. **Deliberate mismatch (the core proof)** — artist_name `"MaLu"` (the
   real 2026-08-16 collision name) + Chappell Roan's real URL as
   `spotify_url` — `spotify_data.artist_name` came back **"Chappell
   Roan"**, never "Maluma" (what the old name-search bug would have
   produced) and never the literal search term "MaLu" — proving the
   provided link fully overrides name search regardless of what a risky
   search would have resolved to. As expected (not a bug), the
   pre-existing 2026-08-16 identity-mismatch guard then correctly fired on
   the genuine "MaLu" vs. "Chappell Roan" mismatch and nulled
   `retention_rate`/`ltv_projection`/`growth_trajectory` — confirms the
   two features compose correctly: the link wins the resolution step, the
   guard still protects against a genuinely wrong link.

All 3 test rows + their `processed_sessions` rows deleted after, 0 rows
left. **Not yet committed to git** (both the frontend `Submit.tsx` change
and this backend workflow patch).

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

REGRESSION + RESOLVED (broke silently ~2026-08-01, root-caused +
fixed 2026-08-15): the signature gate above **rejected every real Stripe
payment for ~2 weeks** after the n8n 2.32.7 upgrade — "Douglas's case."
Root cause, confirmed by reading n8n's own installed source
(`n8n-workflow/dist/cjs/workflow-data-proxy.js`), not guessed: the bare
`$binary` global inside a Code node is unconditionally routed through
`WorkflowDataProxy.nodeDataGetter`, which explicitly strips the base64
`data` property from binary metadata (source comment: `// Skip the data
property`) — so `$binary.data.data` can **never** work, structurally, on
any n8n version with this code, not a transient 2.32.7-only bug.
`$('NodeName').first()` uses a different path (`returnExecutionData`)
that returns the item **unstripped**. So `Verify Stripe Signature`'s
`else` branch (`rawBody = JSON.stringify($json.body)`) fired on every
real event, signing re-serialized JSON that could never match Stripe's
byte-exact payload → `signature_mismatch` on 100% of real payments.
Proven via execution 123 (Douglas's real `livemode:true` payment): the
persisted raw body + the stored `STRIPE_WEBHOOK_SECRET` DO produce a
valid HMAC == Stripe's `v1` — the secret was always correct; the node
just never used the real bytes.

**Fix**: replaced the `$binary`-based raw-body read with
`$('Stripe Webhook').first().binary?.data?.data`, and made the
missing-raw-body path FAIL LOUD (`reason: 'missing_raw_body'`) instead of
silently falling back to `JSON.stringify(body)` — that silent fallback is
exactly what let this hide for two weeks. Deployed via the established
3-DB-location method (`workflow_entity.nodes` + both `workflow_history`
rows, `versionId` `c8a04b97-...`/`a09c4898-...`, unchanged since
2026-07-18), backup `manual_20260815_192935_pre_stripe_binary_fix.sqlite`,
dry run on a scratch copy first, syntax-checked with the **container's
own** `node --check` (v24.18.0, not the host's stale v12), plain
`docker restart n8n_songss`, export-diff confirmed exact scope: 63/63
nodes, only `Verify Stripe Signature`'s `jsCode` changed, connections
byte-identical.

**Live-verified with 4 real signed test requests** (same suite as the
original 2026-07-23 verification, executions 129-132): VALID signature →
`stripe_signature_valid: true` and the run genuinely proceeded through
`Filter → Extract Metadata → Create Supabase User` (proves the fix works
end-to-end, not just in isolation) before erroring cleanly on the
intentionally-incomplete fake payload (empty `customer_email`) — zero
real writes confirmed (`intelligence_reports`/`processed_sessions`/
`auth.users` all 0 rows for the test markers). MISSING signature,
TAMPERED `v1`, and a 10-minute-STALE timestamp were all still correctly
**blocked** before `Filter` (`missing_signature`/`signature_mismatch`/
`timestamp_outside_tolerance`) — confirms the fix didn't weaken the
security gate.

**Impact**: every real Stripe payment from ~2026-08-01 to 2026-08-15 was
rejected at this gate; only Douglas's was recovered (manual
`intelligence_reports` insert). **No reconcile pass needed**: Gilberto
confirmed 2026-08-14 that Douglas is the ONLY real customer who attempted
a purchase during the outage window — no other real customers were
affected. Closed, no further action.

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

RESOLVED (implemented 2026-07-25): **`ltv_projection` replaced with a real,
code-computed formula — second step of the pre-launch LTV/predictive-metrics
rework, after `retention_rate`.** Investigation first confirmed
`monthly_streams` (the field the original AI-guessed `ltv_projection` was
implicitly anchored to) is itself equally AI-fabricated — same "STRATEGIC
DATA EXTRACTION PROTOCOL" JSON schema in `Edit Fields`, same "if not
mentioned, provide a professional estimate based on the report's tone"
license, no formula anywhere. Checked `GPT-4o — Financial Analysis` too, in
case it offered a real monetary anchor instead — it doesn't; its prompt
("Analyze revenue potential, catalog valuation... Return structured JSON")
is pure free-text LLM guessing with no real inputs. So no real $/stream or
$/listener figure exists anywhere in this pipeline; any formula needs at
least one external calibration constant, same category of assumption as
`retention_rate`'s `/200`/`/20` caps but this one drives a dollar figure
shown directly to customers.

Gilberto's call: anchor on real `spotify_data.monthly_listeners` (already
real, Apify-scraped, already the dominant signal in `retention_rate`)
rather than inventing a `monthly_streams` proxy — honest about measuring
unique monthly listeners, not literal stream count.

**Formula — approved by Gilberto 2026-07-25**:
```
ltv_projection = round(monthly_listeners × 0.012 × 24 × (0.5 + retention_rate/100))
```
`0.012` (assumed $/listener/month blended benchmark) and `24` (assumed
baseline fan-engagement horizon in months) are external business constants,
not derived from any real data in this pipeline. The `(0.5 + retention/100)`
term is a bounded 0.5x–1.5x linear multiplier, not a literal churn
probability — a naive textbook `1/(1-retention)` subscription-LTV formula
was considered and rejected: sanity-checked against Chappell Roan's real
`retention_rate: 46`, it implies an ~1.85-month expected fan lifetime, which
misreads `retention_rate`'s actual meaning (a 0-100 cross-platform loyalty
index, not a literal monthly-return probability). `null` (never a fallback
constant) when `monthly_listeners` is 0 or `retention_rate` is `null` — same
"missing data must never render as a fabricated number" rule as
`retention_rate`/`social_engagement_index`.

**Deployed**: backup
(`manual_20260725_230115_pre_ltv_projection_formula.sqlite`), patched
`workflow_entity.nodes` + both `workflow_history` rows (`versionId`
`c8a04b97-49dc-4146-8921-7f4835f2df9d` and `a09c4898-47db-4a22-970e-25d86ff6a9dd`,
same two rows as every fix since 2026-07-18) via a Python script, online
`sqlite3 ... ".backup"` dry run first, syntax-checked with `/snap/bin/node
--check`, clean restart, export-diff confirmed only `Code in JavaScript`
changed (61 nodes before and after, connections byte-identical). `Edit
Fields`'s AI schema still asks for `ltv_projection` (now simply
unread/discarded, same dead-field pattern as `retention_rate`/
`revenue_economics`) — not touched, to keep the diff to exactly one node.

**Live-verified**: two disposable test sessions inserted directly into
`intelligence_reports` (bypassing Stripe webhook), fired via internal `POST
/webhook/submit-analysis` from inside `n8n_songss`. Chappell Roan (real
TikTok handle `chappellroan`): real run returned `monthly_listeners:
30354635`, `retention_rate: 46`, `ltv_projection: 8392449` — matches
`round(30354635 × 0.012 × 24 × 0.96) = 8392449` exactly (compare to the old
AI-guessed figure for this same artist/tier: $1,000,000,000 — two orders of
magnitude off). A second test tried to exercise the `monthly_listeners = 0`
null path with a nonsense artist name, but Apify's Spotify search still
fuzzy-matched a real low-listener result (`364219`) rather than returning
empty — not a bug, the formula math still checked out exactly
(`round(364219 × 0.012 × 24 × 0.69) = 72378`), it just didn't exercise the
null branch. Verified the null branch instead with an isolated logic test
(6/6 cases pass: both real runs' numbers, `monthly_listeners=0`,
`retention_rate=null`, both null, and the prior retention_rate memory's
Chappell Roan numbers). Both test sessions and their `processed_sessions`
rows deleted after verification, 0 rows left.

**Frontend**: `src/pages/Report.tsx` and `src/components/ArtistIndieReport.tsx`
LTV Projection KPI tiles now carry a `title` tooltip (same native-tooltip
pattern already used for Social Engagement Index's null-state hint):
"Estimated using a global blended benchmark ($0.012/listener/month). Real
values vary by geographic distribution and audience retention." `tsc
--noEmit` clean, `vite build` succeeded (both via the `/snap/bin/node`
workaround).

**Not done, deliberately out of scope this round**: `growth_trajectory` is
unchanged (still AI-guessed) — the remaining piece of the LTV/predictive-metrics
rework, along with fixing the extraction step's tier-blindness (always reads
the premium `NIE — Neural Intelligence Engine` report regardless of
customer plan). `monthly_streams` also remains unchanged, still AI-fabricated
and now confirmed fully unused by anything real — a candidate for removal
in a future session, not touched here to keep this diff scoped.

RESOLVED (implemented 2026-07-26): **`growth_trajectory` replaced with a
real, code-computed 6-month projection — third and final step of the
LTV/predictive-metrics rework, after `retention_rate` and `ltv_projection`.**

**Investigation before implementing**: `growth_trajectory` lived in the same
`Edit Fields` "STRATEGIC DATA EXTRACTION PROTOCOL" JSON schema as the old
`ltv_projection`/`digital_score`, same "estimate by tone" license, same
premium-report-only tier-blindness. Unlike its siblings it also had zero
code-level handling at all — `Code in JavaScript` did
`const engagement_metrics = aiData.engagement_metrics || {};` and never
touched `growth_trajectory` again (no clamp, no unit check), so it reached
the frontend exactly as invented. Pulled 10 real reports and found this was
worse than the old `ltv_projection` bug: not just wrong magnitude, but no
consistent *unit* at all. The same real artist (Billie Eilish, identical
real `monthly_listeners` of 78,447,683 across 4 tier-tests on
2026-06-12/13) got four unrelated scales — raw listener counts on one run,
a ~70-110 "index" on two others, a 100,000-scale on a fourth. Dua Lipa's
Growth-tier trajectory was even non-monotonic (75 → 72 → 78), an artifact of
free-text "growth" invention, not a real trend. Where Spotify hadn't
resolved (`monthly_listeners: 0`), the AI still invented a full 6-month
curve anyway rather than reflecting the missing data.

**Formula, approved by Gilberto 2026-07-26** — reuses the same real anchor
(`spotify_data.monthly_listeners`) and the same bounded 0.5x–1.5x
retention-based multiplier pattern as `ltv_projection`, rather than
inventing a second unrelated assumption:
```
BASE_MONTHLY_GROWTH_RATE = 0.02   // 2%/month baseline organic growth assumption
effectiveRate = BASE_MONTHLY_GROWTH_RATE × (0.5 + retention_rate / 100)   // 1%-3%/month
growth_trajectory[i] = round(monthly_listeners × (1 + effectiveRate)^i)   // i = 0..5, months M1..M6
```
M1 (`i=0`) is the real current value, not a projection — the curve starts
from truth and only compounds forward from there. Curve is monotonic
non-decreasing by construction (multiplier floors at 0.5x, so
`effectiveRate` is always positive) — deliberate, since this chart is
literally named "growth trajectory," not a general two-way forecast.
`BASE_MONTHLY_GROWTH_RATE = 0.02` (24%/year baseline) is the one external
business assumption, same category as `ltv_projection`'s `$0.012`/`24` —
required Gilberto's sign-off, not derivable from the pipeline. `null`
(never a fallback constant) when `monthly_listeners` is 0 or
`retention_rate` is `null` — same guard as `ltv_projection`, and in
practice `retention_rate` is never null when `monthly_listeners > 0` since
its Spotify signal shares the same guard with a fixed 0.50 weight.

**Deployed**: same 3-DB-location method as every fix since 2026-07-18
(backup `manual_20260726_101500_pre_growth_trajectory_formula.sqlite`,
`workflow_entity.nodes` + both `workflow_history` rows, `versionId`
`c8a04b97-49dc-4146-8921-7f4835f2df9d`/`a09c4898-47db-4a22-970e-25d86ff6a9dd`
— same two rows, unchanged since 2026-07-18), dry run against an online
`sqlite3 ... ".backup"` copy first, syntax-checked with `/snap/bin/node
--check`, clean restart, export-diff confirmed only `Code in JavaScript`
changed (61 nodes before and after, connections byte-identical).

**Live-verified**: disposable test session inserted directly into
`intelligence_reports` (bypassing Stripe webhook — seeded with `artist_name
IS NULL`, not a placeholder string, after an empty-artist-name placeholder
tripped the real `HTTP Request1` duplicate-check on the first attempt —
that check queries for `artist_name=not.is.null&artist_name=neq.`, so a
non-empty placeholder looked like an already-completed report and returned
a false 409), fired via internal `POST /webhook/submit-analysis` from
inside `n8n_songss` (Chappell Roan, real TikTok handle `chappellroan`).
Real run returned `monthly_listeners: 30340623`, `retention_rate: 46`,
`growth_trajectory: [30340623, 30923163, 31516888, 32122012, 32738755,
33367339]` — exact match to `round(30340623 × 1.0192^i)` for `i=0..5`.
Cross-checked against an isolated 6-case logic test (the live result,
`monthly_listeners=0`, `retention_rate=null`, both null/zero, and two
synthetic cases) — all pass, including both null paths. Test session and
its `processed_sessions` row deleted after, 0 rows left.

**Frontend**: `src/pages/Report.tsx` and `src/components/ArtistIndieReport.tsx`
Neural Trajectory chart sections now carry a small italic caption (visible,
not just a hover tooltip, since this is a full chart section rather than a
KPI tile): "Projected using a baseline 2%/month growth assumption, scaled
by audience loyalty." `tsc --noEmit` clean, `vite build` succeeded (both
via the `/snap/bin/node` workaround).

**Not done, deliberately out of scope this round**: the extraction step's
tier-blindness (`Edit Fields`'s Input Material is hardcoded to the premium
`NIE — Neural Intelligence Engine` node only, regardless of customer plan)
is unchanged — now moot for `retention_rate`/`ltv_projection`/`growth_trajectory`
themselves since all three are code-computed from real data and no longer
read from that extraction step at all, but the `Edit Fields` AI schema still
asks for all three (now simply unread/discarded, same dead-field pattern as
`revenue_economics`) plus `digital_score`/`geo_hotspots`, which remain
genuinely AI-extracted from the premium-only report on every tier — not
touched here. `monthly_streams` also remains unchanged, still
AI-fabricated and confirmed fully unused by anything real — a candidate for
removal in a future session.

RESOLVED (implemented 2026-08-09): **`monthly_streams` removed — closes the
"candidate for removal" item flagged above.** Pre-launch embarrassment-risk
pass: confirmed 8x off from reality on a real artist (Luan Carbonari, AI said
7M, real `spotify_data.monthly_listeners` was 862K) and directly displayed on
a KPI tile on every report, unlike the other AI-fabricated fields already
fixed. Same treatment as `retention_rate`/`ltv_projection`/`growth_trajectory`:
no separate "streams" concept exists anywhere in this pipeline's real data, so
rather than inventing a formula for a fake concept, dropped the field and
pointed every reader at the same real `spotify_data.monthly_listeners` anchor
already used for `ltv_projection`/`growth_trajectory`.

**Backend**: `Code in JavaScript` now does
`delete engagement_metrics.monthly_streams;` right after
`engagement_metrics = aiData.engagement_metrics || {}`, so the AI-fabricated
value never reaches `intelligence_reports.engagement_metrics` — same
dead-field pattern as `revenue_economics` on the `Edit Fields` side (its
"STRATEGIC DATA EXTRACTION PROTOCOL" schema still asks for `monthly_streams`,
now simply generated-and-discarded, not touched, to keep the diff to exactly
one node — consistent with every prior fix in this rework).

**Deployed**: backup
(`manual_20260809_152831_pre_monthly_streams_removal.sqlite`), patched
`workflow_entity.nodes` + both `workflow_history` rows (`versionId`
`c8a04b97-...`/`activeVersionId` `a09c4898-...`, same two rows as every fix
since 2026-07-18) via a Python script, dry run against an online
`sqlite3 ... ".backup"` copy first, syntax-checked with `/snap/bin/node
--check`, plain `docker restart n8n_songss` (no env var changed), export-diff
confirmed exact scope: 63/63 nodes, only `Code in JavaScript` changed.

**Live-verified**: disposable test session
(`cs_test_monthly_streams_removal_verify_20260809`, bypassing Stripe, seeded
with `artist_name IS NULL`), fired via internal `POST /webhook/submit-analysis`
from inside `n8n_songss` (Chappell Roan, real TikTok handle `chappellroan`).
Real run returned `engagement_metrics ? 'monthly_streams'` → `false` (key
fully absent, not just null), while every other real field still checked out:
`retention_rate: 46`, `ltv_projection: 8374300` (exact match to the existing
formula), `growth_trajectory` M1 anchored to the real `monthly_listeners`
(30288991), `social_engagement_index: 63`, `fan_loyalty_index: 55`. Test
session + its `processed_sessions` row deleted after, 0 rows left.

**Frontend** (`src/pages/Report.tsx`, `src/components/ArtistIndieReport.tsx`):
the "Monthly Streams" KPI tile — the only place this field was directly shown
to a customer — is now "Monthly Listeners", reading
`spotify_data.monthly_listeners` directly (added to `ArtistIndieReport.tsx`'s
`ReportRow` interface, which didn't have `spotify_data` typed at all until
now; `Report.tsx` already had it from the Engagement Pyramid work). The
Neural Trajectory chart's synthetic-fallback curve (only reachable when
`growth_trajectory` itself is missing — legacy pre-2026-07-26 reports, or the
genuine `monthly_listeners = 0` edge case) now scales off the same real
anchor instead of the fabricated one. `tsc -p tsconfig.app.json` and `vite
build` both clean.

**Not done, deliberately out of scope**: the two hardcoded per-file fallback
constants for when Spotify data is entirely missing (28000 in `Report.tsx`,
12500 in `ArtistIndieReport.tsx`) are unchanged — same pre-existing pattern
already used by every other KPI tile's `|| <constant>` fallback in both
files, not part of this fix's scope.

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

RESOLVED (implemented 2026-07-27): **Industry Buzz Tracker** (full
report/PDF section name; "Industry Buzz" for compact UI badges/cards —
originally discussed as "Perplexity Social Listening," renamed for
accuracy, see naming rationale below) — a new Perplexity-powered feature
surfacing recent artist press/media buzz, separate from the existing
`Perplexity — Web Intelligence` node already in the NIE flow. Designed and
disambiguation-tested earlier the same day (per Gilberto's explicit ask to
validate "before building anything into the production workflow"), then
built and deployed later the same session once disambiguation was proven.

**Query format, designed and validated against 3 real homonym cases**: a
system-prompt guardrail (generic and reusable, not per-artist-tuned) plus a
structured user-prompt identity block.
- Context fields: `artist_name`, `genre`, `flagship_song_or_album` (+
  year), `active_era` (years active), `approx_monthly_listeners` — all
  objective, always-derivable facts (the last one already real Spotify
  data used elsewhere in this pipeline), deliberately NOT a hand-authored
  "not the wrestler"-style hint, since in production we won't know in
  advance which homonym (if any) a given artist collides with.
- System guardrail: instructs the model to only use facts matching ALL
  identifying details given, exclude anything it isn't confident matches,
  and say so explicitly rather than guessing or blending in a different
  same-named entity.
- Task instruction (v2, see fix below): explicitly names target sources
  (Twitter/X, TikTok, Instagram, and named music press outlets — Pitchfork,
  Rolling Stone, Billboard, NME, Variety) and asks it to prioritize
  visibly-dated content from the last 30 days over older evergreen
  bio/stats pages.

**Disambiguation test — 3 real homonym cases, all passed clean** (direct
`curl` calls to `api.perplexity.ai/chat/completions`, `model: sonar-pro`,
run from the VPS host using the real `PERPLEXITY_API_KEY` sourced from
`/docker/n8n/secrets.env` into a local shell var, never printed):
1. **Sting** (musician) vs. Sting (professional wrestler, Steve Borden) —
   clean; response explicitly confirmed "the search results are clearly
   about the correct Sting."
2. **Bush** (alt-rock band, Gavin Rossdale) vs. Bush (US Presidents) —
   clean; response explicitly confirmed "none of the surfaced results
   refer to a different 'Bush'."
3. **Nirvana** (1990s Seattle grunge band, Cobain) vs. Nirvana (1967
   British psychedelic pop band, Alexander Spyropoulos) — clean, the
   hardest case (same-industry musician-vs-musician, not just a different
   public figure); all citations were Cobain-era only (Aberdeen WA,
   *Nevermind*), zero mention of the 1967 band.

**Buzz-retrieval gap, found and fixed same session**: the first-pass task
prompt (default `search_context_size: low`) reliably passed disambiguation
but returned NO real recent buzz — all 3 test artists fell back to static
bio/stats sources (Wikipedia, Viberate, kworb, ChartMasters) and explicitly
said they couldn't find time-specific last-30-days data rather than
fabricating an answer (the guardrail's "say so explicitly" instruction
working as intended, but exposing a real capability gap, not just a
disambiguation gap).

**Fix**: bumped `web_search_options.search_context_size` to `"high"` and
named explicit target platforms/outlets in the task instruction. Retested
Sting (same artist as the v1 baseline, for a clean before/after
comparison): this **did** surface real, dated coverage — the "Sting 3.0"
world tour expansion, *Desert Rose Reimagined* EP (Apr 2026), a new live
album (Jun 2026), *The Last Ship* at the Met Opera — all backed by real
dated sources (American Songwriter, AXS, NY Post, Ultimate Classic Rock,
Tixel, Consequence, RTT News, spanning Nov 2025-Jul 2026). Identity check
still held throughout — explicitly reconfirmed "this specific Sting...
ex-Police frontman."

**Residual, honest limitation (real, not a prompt-tuning problem)**: even
at `high` context with named platforms, the model still could NOT surface
actual native Twitter/X, TikTok, or Instagram posts — only press/
ticketing/industry coverage that occasionally *references* "trending
searches" or "renewed interest." It said so explicitly rather than
inventing a fake viral moment. This is very likely a real limitation of
what Perplexity's web index covers (news/press/blogs vs. live social
feeds), not something further prompt iteration will fix — same
"don't fabricate missing data" principle already applied to
`retention_rate`/`ltv_projection`/`growth_trajectory`/
`social_engagement_index`, just discovered here instead of designed in
from the start.

**Naming decision (Gilberto, 2026-07-27, final)**: given the
honest-limitation finding, the feature should NOT be called "Social
Listening" — that implies literal social-platform monitoring it can't
actually do. Same honesty principle applied throughout this project (e.g.
`social_engagement_index`'s "not recent activity" caveat,
`ltv_projection`'s tooltip). **"Industry Buzz Tracker"** for the full
report/PDF section; **"Industry Buzz"** for compact UI badges/cards.

**Cost data point**: `sonar-pro` at `search_context_size: low` cost
~$0.015-0.018/call in testing; at `high`, ~$0.028-0.047/call — roughly
2.6x. **Tiering decision (Gilberto, 2026-07-27)**: `low`/`medium` for
Indie/Growth, `high` reserved for Pro/Enterprise/Opus tiers — same
cost-tiering pattern already used for AI model selection across plans
(see §7 Pricing: Haiku vs. Sonnet vs. Opus by tier).

**Implementation (2026-07-27)**: 2 new n8n nodes inserted between
`Perplexity — Web Intelligence` and `GPT-4o — Financial Analysis`:
`Build Industry Buzz Context` (Code node — assembles `genre` from
`Spotify`'s real `genres[]` or `Last.fm`'s real tags, `flagship_song_or_album`
from the customer-submitted `song_name` or `Genius`'s first real hit,
`active_era` from `MusicBrainz`'s `life-span`, `approx_monthly_listeners`
from `Spotify` — all already-fetched real data, zero new API calls; also
resolves `search_context_size` from `plan_label`: `Artist Indie`→`low`,
`Artist Growth`→`medium`, else→`high`, since `Config Haiku` covers
Indie/Growth/Pro in one node but the tiering doesn't map to that grouping
1:1) and `Industry Buzz Tracker — Perplexity` (httpRequest node,
`model: "sonar-pro"`, `alwaysOutputData`/`continueOnFail`, same auth
pattern as the sibling Perplexity node). Perplexity returns structured
JSON directly (`{sentiment, summary, notable_mentions}` + its own real
`citations` array) — no second AI-extraction pass, avoiding the same
tier-blind-extraction anti-pattern already identified for
`digital_score`/`geo_hotspots`. `Code in JavaScript` parses this
defensively (same fenced-JSON-stripping pattern as its `AI Agent` parsing)
and adds `industry_buzz_data` to the PATCH body; `null` (never fabricated)
if the call failed or didn't parse.

New Supabase column `intelligence_reports.industry_buzz_data JSONB` (same
migration pattern as `peer_benchmark_data`), backed up via `pg_dump` first,
`NOTIFY pgrst, 'reload schema'` applied same-step (not an afterthought).

**Real bug found and fixed during live verification**: the first live test
(Chappell Roan, Artist Pro tier) returned `industry_buzz_data: null` in
the database despite both new nodes executing successfully with no error.
Traced step by step through the actual execution's stored data (decoded
via n8n's own `flatted` library, same technique as the 2026-07-19 TikTok
investigation): both new nodes ran clean; the raw Perplexity response
matched the expected shape exactly; `JSON.parse()` on the actual response
content succeeded with no error; `Code in JavaScript`'s own output
already contained a fully correct `industry_buzz_data` object. The actual
bug was one node further downstream — the `HTTP Request` node that PATCHes
to Supabase does not pass `$json` through wholesale; it builds its body
from a hardcoded, explicitly-enumerated field list (`JSON.stringify({...})`)
that already included `peer_benchmark_data` but had never been extended
for this new field, since the original patch only touched `Code in
JavaScript`. Fixed with a one-line addition
(`"industry_buzz_data": $json.industry_buzz_data ?? null,`) mirroring the
existing `peer_benchmark_data` line. **Lesson for future fields added to
the PATCH body**: check the `HTTP Request` node's hardcoded field list
too, not just `Code in JavaScript` — it does not pass fields through
automatically.

**Deployed**: both changes via the established 3-DB-location method
(`workflow_entity.nodes`/`connections` + both `workflow_history` rows,
`versionId` `c8a04b97-...`/`activeVersionId` `a09c4898-...`), two separate
backups (`manual_20260727_174035_pre_industry_buzz_tracker.sqlite` and
`manual_20260727_184404_pre_industry_buzz_data_http_request_fix.sqlite`),
dry-run against a `.backup`-based throwaway copy before each live patch,
`/snap/bin/node --check` syntax verification on all new JS, clean restart
after each, export-diff after each confirming exact scope (first patch: +2
nodes, 1 node changed, 1 connection rewired; second patch: 0 added/removed,
only `HTTP Request` changed, connections byte-identical).

**Live-verified end-to-end**: disposable test session (`session_id`
`cs_test_industry_buzz_verify_20260727`, bypassing Stripe, seeded with
`artist_name IS NULL` per the established false-409-avoidance pattern),
fired via internal `POST /webhook/submit-analysis` from inside
`n8n_songss` (Chappell Roan, real TikTok handle `chappellroan`, `Artist
Pro` plan — deliberately chosen to exercise the `Config Haiku` tiering
nuance). After the `HTTP Request` fix: `industry_buzz_data` came back
fully populated — real `sentiment: "mixed"`, a real dated summary (TikTok
controversy, All Things Go festival withdrawal, political commentary,
Billboard chart coverage), 9 real citations, and `search_context_size:
"high"` correctly resolved for the Pro tier (confirming the plan_label-
conditional fix, not just the flat Config Opus case). Test session +
its `processed_sessions` row deleted after, 0 rows left.

**Frontend** (`src/pages/Report.tsx` and
`src/components/ArtistIndieReport.tsx`): `industry_buzz_data` added to
both `ReportRow` interfaces (same inline-typing precedent as
`peer_benchmark_data`). KPI grid widened from 4 to 5 tiles — new
"Industry Buzz" tile shows a sentiment pill (Positive/Mixed/Negative,
color-coded) or "—" with a "Not enough recent press coverage found"
tooltip, same null-handling convention as Social Engagement Index. New
"Industry Buzz Tracker" full section (only rendered when a summary
exists) reuses the existing `SectionHeader`/`glass` shell, renders the
markdown summary + notable mentions + a Sources list of linked
citations — the first citations/URL-list UI in this codebase — with a
visible caption: "Sourced from recent press and industry coverage — not a
live scan of social media posts." Shown on all tiers uniformly (no
frontend tier-gating; the backend already varies quality via
`search_context_size`). `tsc --noEmit` clean, `vite build` succeeded.

**Live browser visual test (2026-07-27)**: dev server bound to
`127.0.0.1` only (confirmed via `ss -tlnp`), two disposable sessions
(the real Chappell Roan/Pro-tier row above, plus a second directly-seeded
`Artist Indie`-tier row with `industry_buzz_data` explicitly `NULL` to
exercise the missing-data path), viewed via Gilberto's own SSH tunnel.
Confirmed both the sentiment-pill tile and the full section — including
the honesty caption — render correctly on both tiers, and the null path
correctly shows `—` with the tooltip and suppresses the full section
entirely. Both test rows + the `processed_sessions` row deleted after,
0 rows left.

RESOLVED (implemented 2026-08-01): **Fan Loyalty Index**
(`engagement_metrics.fan_loyalty_index`) — a new real, code-computed
metric blending TikTok virality with streaming-platform stickiness.
Originally proposed as `0.6 × Social Engagement Index + 0.4 × Spotify
Retention Rate` (a "hybrid" concept referenced but not actually found on
record in CLAUDE.md or memory when this session started — worth noting
for future sessions that not everything discussed verbally makes it into
persistent docs).

**Design flaw found and fixed before implementation**: `retention_rate`
already contains a 0.20-weighted TikTok Engagement Depth (TED) sub-signal
(`min(100, round((heartCount/followerCount)×100/20))`) that is
*mathematically identical* to `social_engagement_index`
(`min(100, round(engagement_rate×100/20))`, same `heartCount/followerCount`
input). Combining `social_engagement_index` with the *full* `retention_rate`
at 0.6/0.4 would have algebraically reduced (whenever TikTok resolves) to
`0.68×SEI + 0.20×Spotify + 0.12×Last.fm` — 68% effective weight on TikTok
alone, not a clean 60/40 split across two distinct signals — and would have
gone `null` entirely whenever TikTok doesn't resolve (same gate as SEI
itself), since a literal weighted sum of two required inputs has no partial
case. Validated the fix against 3 real artists (grentperez, Chappell Roan,
Billie Eilish — fresh real Last.fm pulls plus a fresh live Spotify pull for
grentperez, whose raw Spotify numbers weren't previously on record anywhere)
before writing any code — see `project_fan_loyalty_index_2026-08-01` in
memory for the full validation table.

**Formula — approved by Gilberto 2026-08-01**:
```
retention_core = round(Σ(SFC×0.50, LRD×0.30 — whichever resolve) / Σ(their weights))
// same SFC/Spotify Follow-Conversion and LRD/Last.fm Repeat-Listen Depth
// sub-signals as retention_rate itself, but TED (TikTok) deliberately
// excluded entirely -- this is the fix for the double-counting above.
// null only if Spotify itself doesn't resolve, same guard as retention_rate.

fan_loyalty_index = round(0.6×SEI + 0.4×retention_core)
// renormalizes like retention_rate: if one side is missing, 100% weight
// goes to whichever resolved; null only if BOTH are missing. This was an
// explicit design choice (Gilberto, 2026-08-01) to keep this metric's
// null-rate as low as retention_rate's own, rather than inheriting SEI's
// narrower TikTok-required availability -- the whole point of a "hybrid"
// metric is that it should have a real value more often than either input
// alone, not less.
```

**Deployed**: backup (`manual_20260801_pre_fan_loyalty_index.sqlite`, online
`sqlite3 ... ".backup"`), patched only `Code in JavaScript` across all 3 DB
locations (`workflow_entity.nodes` + both `workflow_history` rows, same
`versionId`/`activeVersionId` pair as every fix since 2026-07-18), dry run
against a scratch copy first, syntax-checked with `node --check`, clean
restart (`docker restart n8n_songss` — no env var changed, so a plain
restart was sufficient, not `--force-recreate`), export-diff confirmed exact
scope: node count unchanged (63/63), only `Code in JavaScript` changed,
connections byte-identical. The PATCH `HTTP Request` node needed **no**
change this time — checked first rather than assumed (see
`feedback_n8n_http_request_hardcoded_field_list`) — its `engagement_metrics`
field already passes `$json.engagement_metrics` through as a whole object,
so the new key flows through automatically.

**Live-verified both paths**, two disposable sessions (bypassing Stripe,
seeded with `artist_name IS NULL`, fired via internal
`POST /webhook/submit-analysis` from inside `n8n_songss` using Node's native
`fetch` since the container has no `curl`), real Chappell Roan data both
times: with a real TikTok handle (`chappellroan`) →
`fan_loyalty_index: 55` (`social_engagement_index: 63`,
`retention_rate: 46`, implied `retention_core: 42`); without a TikTok handle
→ `fan_loyalty_index: 42`, correctly falling back to 100% weight on
`retention_core` (which itself equals `retention_rate` in this case, since
TikTok also drops out of that calc the same way) instead of going `null`.
Both test sessions and their `processed_sessions` rows deleted after,
0 rows left.

**Not done, deliberately deferred (Gilberto's call, 2026-08-01)**: no
frontend display yet — no KPI tile or section in `Report.tsx` /
`ArtistIndieReport.tsx`. Wants to think through placement/design with fresh
eyes in a future session rather than rush it. The field is live and
populated in `engagement_metrics.fan_loyalty_index` on every new report
starting now, just not yet shown anywhere in the UI.

RESOLVED (implemented 2026-08-19): **`/opus` lead-capture page + a new,
separate n8n workflow ("Opus Maximus Lead Capture") — the Pricing page's
Opus Maximus "Get Started" button and Report.tsx's Enterprise/Opus
existing-customer footer CTA both now route here instead of a raw `mailto:`
link.** Deliberately NOT part of the NIE flow — no Supabase writes, no
Stripe checkout, just a webhook → email notification to
`admin@songssintelligence.com` so the team can prepare a manual, tailored
proposal for this white-glove tier.

**Frontend**: new `src/pages/Opus.tsx`, routed at `/opus` in `App.tsx`.
Card-based form (matches `Auth.tsx`'s Header+Footer+Card shadcn styling,
not `Submit.tsx`'s raw-hex intake-flow look, since this is a marketing/
lead-gen page reachable from Pricing, not a mid-payment-flow intake).
Fields: Name*, Company, Contact Email*, Catalog/Portfolio Size (free-text,
e.g. "25 artists"), Primary Need (Select: Catalog Valuation / Investment
Decisions / Compliance / Other — "Other" reveals a required free-text
"Tell us more" field, reusing the same Select+Textarea pattern already
established in `Submit.tsx` for Enterprise-tier fields). On submit, POSTs
JSON (`name`, `company`, `email`, `catalog_size`, `primary_need`,
`need_details`) to `https://n8n.songssintelligence.com/webhook/opus-lead`
and shows the exact thank-you copy specified by Gilberto in place of the
form. `Pricing.tsx`'s Opus Maximus card already had `ctaLink: "/opus"` set
(pre-existing, routes via `PricingCard`'s internal `<Link>` — no change
needed there). `Report.tsx`'s enterprise/opus-tier footer CTA
("Contact Us for Custom Solutions") changed from `mailto:hello@...` to
`href="/opus"`. `tsc -p tsconfig.app.json --noEmit` and `vite build` both
clean.

**Backend — found and built on prior same-session groundwork**: mid-task,
discovered a disposable dry-run n8n container (`n8n_dryrun_opus`, isolated
`/tmp/n8n_dryrun` volume, its own scratch copy of the DB) already running
with a structurally-identical, already-execution-tested "Opus Maximus Lead
Capture" workflow (webhook → `emailSend` via the real "SMTP account"
credential, id `6JTe1tM0OaFntxjN` — confirmed matches production's real
credential row, not a dry-run fake) — evidence of this exact task having
been started earlier the same day (a real
`manual_20260819_122115_pre_opus_lead_workflow.sqlite` backup on disk
confirms it), before context was lost to compaction. Investigated rather
than assumed before building on it (per the standing "investigate
unfamiliar state" rule) — confirmed the dry-run's SMTP credential ID and
encryption key genuinely matched live production, so it was safe to trust
as a real validated starting point, not discarded.

Adjusted its field names to match this session's actual frontend payload
(dry-run version used a single combined `name_company` field and `notes`;
this build uses separate `name`/`company` and `need_details` — a UX
preference, not a correctness fix) and re-validated the edited version
fresh in the same dry-run container before touching production: 2 curl
tests (populated fields, and an all-optional-fields-blank edge case) both
returned clean `200`/`{"status":"ok"}`, `execution_entity.status:
'success'`, and real SMTP `messageId`/`accepted` responses — confirms an
actual send succeeded, not just a silent no-op. Also had to clean up a
path collision: the dry-run's own leftover original workflow
(`e4ec78d063f144b9`) still had `opus-lead` registered in
`webhook_entity` even after being deactivated (a stale registration, not
cleared by `active=false` alone) — deleted outright since it was disposable
scratch state, not real data.

**Deployed to production**: fresh backup
(`manual_20260819_175807_pre_opus_lead_workflow_live_deploy.sqlite`,
taken immediately before the live write despite the earlier same-day
backup already existing — Golden Rule 6 has no "already backed up
recently" exception, see
[[feedback_backup_before_any_db_write]]). Confirmed no `opus-lead` path or
`Opus`-named workflow existed in production first. Deployed via `n8n
import:workflow` (not the manual 3-DB-location SQL patch method used for
the existing NIE workflow — that method exists to handle
`workflow_history` versioning on an *existing* workflow being edited; this
is a brand-new, fully separate workflow, so n8n's own CLI import is the
correct, simpler tool and doesn't touch the NIE workflow's rows at all).
`n8n update:workflow --active=true` + `docker restart n8n_songss` (CLI
activation needs a restart to actually register the webhook route — same
lesson as every other n8n CLI activation in this project's history). Clean
restart: all 4 workflows (Lead Magnet, NIE, the inactive Granite test
harness, and this new one) activated with no errors — the live NIE/Stripe
pipeline was not touched or disrupted.

**Live-verified 3 ways**: 1) direct container-internal POST (bypasses
Cloudflare, mirrors the established webhook-testing precedent) — clean
`200`, real execution success. 2) **Real public edge test** — this was the
one genuine open risk worth checking empirically rather than assuming:
whether Cloudflare WAF Rule 5 ("Protect n8n Webhook Endpoint") would
challenge this brand-new path the same way Rule 4 blocked Douglas's
`/webhook/submit-analysis` CORS preflights (see
[[project_douglas_real_customer_bugs_2026-08-16]]). Curled both an `OPTIONS`
preflight and the real `POST` directly against
`https://n8n.songssintelligence.com/webhook/opus-lead` through the actual
Cloudflare edge (real `Origin`/`Referer` headers matching what the browser
sends) — `OPTIONS` → real `204` with correct
`access-control-allow-origin`, `POST` → real `200`, `{"status":"ok"}`,
`cf-cache-status: DYNAMIC`, no `cf-mitigated` challenge on either. Rule 5
does not block this endpoint — no WAF change needed. 3) confirmed via
`execution_entity` that both production test runs (one internal, one
through the public edge, both clearly marked `__TEST__` in the name field
so they're identifiable if Gilberto checks the inbox) completed
`status: 'success'`.

**Cleanup**: the disposable dry-run container and its `/tmp/n8n_dryrun`
scratch volume were removed after use; a leftover workflow-export scratch
file inside `n8n_songss`'s own `/tmp` was also removed (contained only the
SMTP credential's *name/id* reference, not its actual secret value — same
non-exposure as any workflow export via the n8n UI).

**Known, not chased**: no bot/spam protection on this new public form
(no Turnstile, no WAF Referer-scoping rule) — the existing Rule 4 pattern
used for `/webhook/submit-analysis` was deliberately not extended to
`/webhook/opus-lead` this session, since the endpoint fully works without
it and adding WAF scoping is a separate dashboard change; worth adding if
this endpoint sees abuse. Real test emails (2 from the isolated dry-run,
2 from production verification, all clearly marked `__TEST__`/diagnostic
in the `name` field) were sent to the real `admin@songssintelligence.com`
inbox as an unavoidable side effect of proving the SMTP send genuinely
works — nothing to clean up server-side since this workflow has no
database writes at all. Not yet committed to git.

RESOLVED (implemented 2026-08-19): **Predictive Globe powered by real
Last.fm data — closes the "fabricated globe/revenue data" gap flagged in
`51b0ac9` earlier the same day.** That commit removed the fake-data
fallback (the globe/mini-revenue-chart depended on a `/metrics` endpoint
that hard-401s — no such backend route exists) so both components
correctly rendered nothing rather than invented numbers, but nothing had
replaced it with a real source yet. This does that for the globe; revenue
remains intentionally empty (see below — Last.fm has no monetary data,
and "no number" is the correct behavior here, not a gap to fill).

**Architecture, per Gilberto's explicit design**: Last.fm's free
`geo.gettoptracks` API (country-level, not literal city-level — Last.fm
has no city-granularity geo endpoint) polled by a new, separate n8n
workflow on a schedule (not per-visitor, to stay well within Last.fm's
free tier and keep the page fast) into a new Supabase table; the frontend
reads only from Supabase, never calls Last.fm directly.

**New table `public.geo_activity`** (backup first,
`manual_20260819_191125_pre_geo_activity_table.sql`): `region text PRIMARY
KEY` (the literal Last.fm `country` param), `city text` (display label —
each region's principal city, same coordinates already used by the old
fake-data hook), `lat`/`lng double precision`, `track_count integer`,
`total_listeners bigint` (real, summed from Last.fm's own `listeners`
field across the top 10 tracks — **not** `playcount`, which this endpoint
does not return; confirmed by a real API call before writing any code,
not assumed), `top_track text`, `updated_at timestamptz`. RLS: `anon`/
`authenticated` get `SELECT USING(true)` (public marketing page, no auth
call needed — same pattern as `plan_limits`), only `service_role` can
write. `NOTIFY pgrst, 'reload schema'` sent as part of the same migration,
not an afterthought.

**New n8n workflow "Geo Activity — Last.fm Poller"** (id
`geoActivityLastfm01`, separate from the NIE workflow, deployed via `n8n
import:workflow` — same lower-risk method as the Opus Maximus workflow,
appropriate for a brand-new workflow vs. the manual 3-DB-location SQL
patch method reserved for editing the *existing* NIE workflow). Schedule
Trigger every 20 minutes → a Code node listing 20 curated
country/city/lat/lng pairs → `Last.fm Geo Top Tracks` (httpRequest,
`geo.gettoptracks`, `api_key={{ $env.LASTFM_API_KEY }}` — exact same
proven pattern as the existing NIE workflow's own `Last.fm` node, just
`country` instead of `artist`) → `Build Real Rows` (Code node — sums real
`listeners`, drops any region with zero real tracks/listeners that cycle
rather than writing a fabricated zero; a region simply keeps its last-real
row and an older `updated_at` if Last.fm has a transient empty response,
rather than the marker flapping on/off) → `Upsert to Supabase` (POST
`.../geo_activity?on_conflict=region`, `Prefer:
return=minimal,resolution=merge-duplicates`, same hardcoded-`apikey` +
shared "Supabase Service Role Auth" credential pattern as every other
Supabase-writing node in this project — see
[[feedback_hardcoded_apikey_header_all_7_migrated_nodes]]).

**Two real country-name corrections found by testing against the live
Last.fm API before trusting the list** (not assumed from the old fake-data
hook's country list, which had never actually been validated against
Last.fm's real ISO-name requirements): `"South Korea"` → Last.fm rejects
this (`error 6, country param invalid`); the correct value is `"Korea,
Republic of"`. All other 19 of the 20 candidate countries worked
correctly on the first real test.

**Real bug found and fixed via dry-run testing (same isolated-scratch-
container discipline as every other n8n change this project makes)**: the
first version of the `Upsert to Supabase` node had the `credentials`
block attached but was still getting rejected with `401 — "new row
violates row-level security policy for table geo_activity"` — i.e.
authenticating as `anon`, not `service_role`, despite the credential being
attached. Root cause, found by direct comparison against a real working
production node (`Insert Intelligence Report`): **attaching a
`credentials.httpHeaderAuth` block alone is not sufficient** — the
node's own `parameters` must also explicitly declare
`"authentication": "genericCredentialType"` and `"genericAuthType":
"httpHeaderAuth"`, or n8n never actually applies the credential to the
request. Confirmed via a direct curl using the real `SERVICE_ROLE_KEY`
for both `apikey` and `Authorization` (real `201 Created`, test row
cleaned up after) that the table/RLS policy were correct all along — the
bug was purely this missing pair of node parameters. **New standing
lesson, worth checking on any future new `httpHeaderAuth`-credentialed
node**: see `feedback_n8n_generic_credential_type_required` in memory.

**Live-verified in the isolated dry-run container** (online-backup scratch
DB copy, real `LASTFM_API_KEY`/`N8N_BLOCK_ENV_ACCESS_IN_NODE=false`/
`EXECUTIONS_DATA_SAVE_ON_SUCCESS=all` — the latter two both needed
explicit setting to match production's actual `docker-compose.yml`, since
a bare fresh container doesn't have them and silently produces misleading
"access to env vars denied" errors or truncated execution data
otherwise): after the auth fix, a full run wrote all 20 real rows to the
**real production** `geo_activity` table (this table has no separate
staging environment — same everywhere-shared-Supabase constraint as every
other dry-run test in this project) — real per-country `total_listeners`
ranging 424 (China) to 175,627 (United States), real `top_track` values.
These are genuine first-seed data, not test artifacts — deliberately not
deleted.

**Deployed to production**: backup first
(`manual_20260819_212804_pre_geo_activity_workflow.sqlite`), imported via
`n8n import:workflow`, activated, `docker restart n8n_songss` — clean,
all 5 active workflows (Lead Magnet, NIE, the inactive Granite test
harness, Opus Maximus, and this new one) came back with no errors; the
live NIE/Stripe/Opus pipeline was not disrupted. **Not independently
live-fired in production this session** — a second production DB write
(temporarily shortening the schedule interval to force an immediate test
fire) was correctly declined by the permission layer as an unnecessary
extra production mutation, given the exact same workflow JSON had just
been proven end-to-end in the dry-run container immediately beforehand.
The real 20-minute schedule will fire on its own; worth a quick check next
session that `geo_activity.updated_at` has actually advanced past
`2026-08-19T21:27:23` (the dry-run test's timestamp) under its own
production schedule, not just the manually-triggered dry run.

**Frontend** (`src/hooks/useMetricsData.ts`, fully rewritten —
`src/components/Globe3D.tsx` label-only change): `useMetricsMarkers()` now
reads `geo_activity` directly via the Supabase client (`anon`-readable,
no auth call needed), top 8 by real `total_listeners`, zero fabricated
fallback — an empty/errored read just yields `[]`, same as
`Globe3D.tsx`'s pre-existing `markers ?? []` guard. Marker field renamed
`streams` → `listeners` throughout (the hook, the type, and the on-globe
label) since Last.fm's real field is listener counts, not literal stream
counts — matches this project's established honesty-in-labeling precedent
(e.g. the `monthly_streams` → `monthly_listeners` KPI-tile rename). The
old `useMetricsSummary()`/`NeuralEngineMetric` fake-`/metrics`-endpoint
plumbing was deleted entirely (was 401ing on every single page load,
pure dead weight) rather than left dormant. `useFormattedMetrics()` is
kept (still imported by `MiniRevenueChart.tsx`) but now a static stub
that always returns "no data" and makes zero network calls — **Last.fm
has no monetary data at all**, so per Gilberto's explicit instruction this
is correct, permanent behavior under this data source, not a gap: the
revenue card should simply never render rather than show any number,
invented or otherwise. `MiniRevenueChart.tsx`/`Home.tsx` themselves needed
no code changes — their existing `if (revenueData.length < 2 ...) return
null` guard already does exactly the right thing against the new stub.
Visual layout/positioning (globe size, city-marker style, revenue-card
placement) deliberately untouched — only the data source changed, per
Gilberto's explicit scope. `tsc -p tsconfig.app.json --noEmit` and `vite
build` both clean. **Not yet committed to git.**

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
- n8n encryptionKey: rotated 2026-07-30 (was exposed 2026-07-09) — see §3
  dated entry for the full procedure. Do not change again without
  following that documented rotation procedure (dry run on a scratch
  container first, export-decrypted → swap key in config+secrets.env
  together → import to re-encrypt → live-verify).
- Now stored as `N8N_ENCRYPTION_KEY` in /docker/n8n/secrets.env (promoted
  from config-file-only on 2026-07-30, same pattern as every other secret
  in this project) — config file at /docker/n8n/.n8n/config must always
  match it exactly, or n8n refuses to start (hard validation, confirmed
  2026-07-30). Key value: never commit or print either location.

---

## 7. PRICING (DEFINITIVE — Do not change without authorization)

Artist Indie: $9.90/mo | 4 queries | Haiku
Growth: $29/mo | 12 queries | Haiku
Pro/Team: $99/mo | 50 queries | Sonnet
Enterprise: $299/mo | 150 queries | Sonnet + GPT-4o
Opus Maximus: $1,500/mo or $12k/yr | 1,500 queries | Opus (Taylor Made — no self-service)
Opus + Compliance: $3,000/mo or $24k/yr | 1,500 queries | Opus + IBM watsonx

RESOLVED (2026-08-15): the 2026-08-12 "Opus Maximus now includes IBM Granite
by default" / Enterprise $800/mo add-on plan flagged here as pending is now
moot — Gilberto cancelled the entire Granite initiative 2026-08-15 (see §11
"Granite production wiring — Opus Maximus, REVERTED" and "IBM Granite
badge/disclaimer"). The table above was never actually stale; no rewrite is
needed for this item.

SEPARATE, BIGGER ISSUE (found 2026-08-12, NOT fixed, flagged for its own
future session — see §11 Active Tasks "Pricing table model differentiation
never existed in the pipeline"): the "Haiku"/"Sonnet"/"Opus"/"Sonnet + GPT-4o"
per-tier model claims in the table above have never reflected what the
pipeline actually runs. Every tier's report — Indie through Opus Maximus —
is written by the exact same hardcoded `gemini-2.5-flash` call in
`NIE — Neural Intelligence Engine`. This is unrelated to, and predates, the
now-cancelled Granite work above.

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
WARNING: `wrangler.json`'s `assets.html_handling: "none"` is intentional —
  do NOT remove it. Cloudflare's default assets handling 307-redirects any
  request for a literal `*.html` path to its extensionless equivalent
  (e.g. `/google<id>.html` → `/google<id>`), which broke Google Search
  Console's domain-ownership verification — its verifier fetches the exact
  `.html` URL and does not follow the redirect. Since this site is fully
  SSR'd through the Worker (TanStack Start), Cloudflare's own HTML routing
  never serves any real page anyway, so disabling it has no effect on
  normal site behavior. Fixed and committed 2026-08-15
  (`eca540f`) — also committed the actual verification file itself,
  `public/google5b3546be51c87f40.html`, which had been present on disk and
  live via a prior manual deploy but was never checked into git (every
  other file in `public/` was already tracked).

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
7. Cloudflare tokens: create → use → revoke immediately
8. RLS: never use USING(true) on intelligence_reports SELECT policies

---

## 11. ACTIVE TASKS

- [x] ~~Artist Identity MVP — Spotify Artist Link field~~ RESOLVED
      2026-08-19 — see §4 "RESOLVED (started 2026-08-18, deployed +
      live-verified 2026-08-19)". Deployed to live n8n, export-diff
      confirmed exact scope, 3-case live test suite passed (regression,
      direct-URL happy path, deliberate-mismatch override proof). **Not
      yet committed to git.**

- [ ] Security audit sweep (2026-08-15) — 5-item honest-status pass. Two
      items clean, one done, two open:
      - [x] ~~RLS coverage on ALL public tables~~ CLEAN — all 5 tables
            (`intelligence_reports`, `plan_limits`, `processed_sessions`,
            `spotify_artist_cache`, `teams`) have `rowsecurity=t`;
            `processed_sessions`/`teams` are deny-all (zero policies), no
            `USING(true)` anywhere. Nothing to fix.
      - [x] ~~Postgres 5432 external exposure~~ CLEAN — `supabase-db`
            publishes no host port (internal Docker net only), no host
            listener on 5432/6543, `supabase-pooler` publishes nothing.
            Nothing to fix.
      - [x] ~~SSH: password auth + direct root login~~ RESOLVED 2026-08-15
            — see §3 "RESOLVED (2026-08-15): SSH hardening". Password auth
            disabled, `PermitRootLogin prohibit-password`, key login proven
            working first, live-verified both directions.
      - [x] ~~Off-site backups — OPEN, real single-point-of-failure
            gap.~~ RESOLVED 2026-08-15 — daily encrypted backups to
            Cloudflare R2 (`0 3 * * *` → `/docker/n8n/offsite_backup.sh`:
            Supabase `pg_dumpall` + WAL-safe n8n `.n8n` → gzip → GPG
            AES-256 → rclone → R2, 30-day lifecycle). Built + tested
            end-to-end (dry run, real upload+verify, restore test). Full
            detail in §3 "RESOLVED (2026-08-15): Off-site encrypted
            backups". The old local-only n8n hourly `cp` + manual Supabase
            `pg_dump` stay as-is, now complemented by the off-site copy.
      - [x] ~~★ Stripe webhook signature verification BROKEN by the
            2.32.7 upgrade; blocked EVERY real Stripe payment.~~ ROOT-CAUSED
            + FIXED 2026-08-15 — see §4 "REGRESSION + RESOLVED" (near the
            2026-07-23 signature-gate entry) for the full story: `$binary`
            in a Code node structurally strips the base64 `data` property
            (confirmed by reading n8n's own installed source), so the gate
            silently signed `JSON.stringify(body)` instead of Stripe's real
            bytes on every real payment. Fixed by switching to
            `$('Stripe Webhook').first().binary?.data?.data` + a fail-loud
            `missing_raw_body` path. Deployed (3-DB-location method,
            backup, dry run, `node --check` on the container's own node)
            and live-verified with 4 real signed test requests (valid
            passes + proceeds; missing/tampered/stale still blocked; zero
            real side effects). See memory
            `project_stripe_webhook_binary_regression_2026-08-15`.
      - [x] ~~Stripe webhook reconcile pass~~ NOT NEEDED — Gilberto
            confirmed 2026-08-14 that Douglas was the ONLY real customer
            who attempted a purchase during the ~2026-08-01 to 2026-08-15
            outage window; no other real customers were affected. No scan
            required, closed.
- [ ] **Session status snapshot (2026-08-15, start here next session):**
      DONE — SSH hardening (§3: password auth off, root prohibit-password,
      key login proven first); RLS clean (all 5 public tables); Postgres
      5432 not host-exposed (internal Docker only); d3-color resolved
      (committed lockfile pins the patched 3.1.0); off-site encrypted R2
      backups (§3: daily `0 3 * * *`, built + restore-tested); **Stripe
      webhook signature verification root-caused + FIXED + live-verified**
      (§4 "REGRESSION + RESOLVED" — `$binary` structurally strips binary
      `data` in n8n Code nodes; switched to `$('Stripe Webhook').first()`,
      fail-loud on missing raw body; 4-case live test suite passed, zero
      side effects; no reconcile pass needed — Gilberto confirmed
      2026-08-14 that Douglas was the only real customer affected during
      the outage window). react-router-dom — RESOLVED 2026-08-19, see §11
      npm audit item — patched to 6.30.6 (v6 line backported the fix,
      no major v7 bump needed); no known browser-bundle dep vuln remains
      open.
- [ ] IBM Granite badge/disclaimer — UI plumbing DONE 2026-08-12, but the
      whole Granite initiative was CANCELLED 2026-08-15 (Gilberto's call:
      too much integration friction for a solo founder relative to the
      value it adds — see "Granite production wiring — Opus Maximus,
      REVERTED" below). `intelligence_reports.granite_powered` column,
      the `Report.tsx` badge/disclaimer (gated on that flag), and the
      `Terms.tsx` §20 trademark section are all left in place as harmless
      dead plumbing — nothing will ever set the flag true now, so the
      badge stays permanently invisible. Not worth unwinding; same
      "leave the unused field, don't chase it" pattern used elsewhere in
      this doc (e.g. `revenue_economics`). §7's pricing table still needs
      a cleanup pass to drop the stale "Opus Maximus now includes IBM
      Granite by default" / Enterprise add-on language — no Stripe
      entitlement work (`granite_addon_active`) was ever built, and none
      is needed now.
- [ ] Pricing table model differentiation never existed in the pipeline —
      found 2026-08-12 while reviewing the production NIE workflow to plan
      the Granite wiring below, NOT fixed, bigger than a Granite-scoped
      change so tracked as its own item. §7's "Haiku"/"Sonnet"/"Opus"/
      "Sonnet + GPT-4o" per-tier claims have never reflected real pipeline
      behavior: `Config Haiku (Indie/Growth/Pro)` and
      `Config Opus (Enterprise/Opus Maximus)` both set an `ai_model` field
      (`claude-haiku-4-5-...` / `claude-opus-4-6`), but nothing downstream
      ever reads it to select an LLM — it dead-ends inside
      `Data Consolidator`'s config object. The actual report-writing call,
      `NIE — Neural Intelligence Engine` (backed by
      `Google Gemini Chat Model — NIE`), is hardcoded to `gemini-2.5-flash`
      for every tier, Indie through Opus Maximus, with zero branching.
      `GPT-4o — Financial Analysis` and `Gemini — Brand Intelligence` are
      real calls, but they're upstream single-purpose data-gathering steps
      whose raw text gets pasted into the NIE Engine's own prompt as
      `FINANCIAL:`/`BRAND:` context — not alternate synthesis engines, so
      Enterprise doesn't actually get "Sonnet" either. Needs its own
      dedicated session: either build the real per-tier model routing the
      pricing table has been promising, or rewrite §7 to match what's
      actually shipping. Do not conflate with the Granite work above/below —
      that's adding a new capability for Opus Maximus; this is about
      whether the *existing* tier promises (Haiku/Sonnet/Opus) were ever
      true for any tier.
- [x] ~~**Granite production wiring — Opus Maximus.**~~ REVERTED 2026-08-15
      — Gilberto's call: stop pursuing IBM Granite integration entirely,
      too much friction for a solo founder relative to the value it adds
      (this was the item paused mid-deployment 2026-08-13 after a second
      live test failed with an undiagnosed error — see memory
      `project_granite_production_wiring_opus_maximus_2026-08-12` for the
      full paused-state detail, now historical). All 4 Granite nodes (`Route to
      Granite?`, `Get IAM Token`, `Granite Text Generation`, `Normalize
      Granite Output`) removed from the production workflow
      (`8SRNZDEpZKu88qFz`); `Edit Fields`, `Code in JavaScript`, and `HTTP
      Request` restored to their pre-Granite bodies; `Gemini — Brand
      Intelligence`'s edge reconnected directly to both
      `NIE — Neural Intelligence Engine` and `NIE — Indie Coach` (undoing
      the `Route to Granite?` reroute). Opus Maximus (and every other
      tier) is back to 100% Gemini synthesis, same as every tier before
      2026-08-13.

      **Deployed**: backup first
      (`manual_20260815_002332_pre_granite_revert.sqlite`), source of
      truth was the known-good `manual_20260813_135743_
      pre_granite_production_wiring.sqlite` backup (taken immediately
      before the Granite deploy began) — its `workflow_entity.nodes`/
      `connections` and both `workflow_history` rows (`versionId`
      `c8a04b97-...`/`activeVersionId` `a09c4898-...`, same two rows as
      every fix since 2026-07-18) applied to the live DB, dry-run-verified
      against a scratch copy first, plain `docker restart n8n_songss` (no
      env var changed). Export-diff confirmed an exact restoration: 63/63
      nodes, node-for-node byte-identical to the pre-Granite reference,
      connections byte-identical, zero Granite nodes remaining.

      **Live-verified**: disposable Opus Maximus test session
      (`cs_test_granite_revert_verify_20260815`, Chappell Roan, real
      TikTok handle) fired through the real `/webhook/submit-analysis`
      path → clean `200`/`{"status":"ok"}`, real 25,690-char
      `report_markdown`, correct `artist_name`, `granite_powered: false`,
      `processed_sessions` row present (confirms SMTP completed).
      `retention_rate`/`ltv_projection`/`growth_trajectory` came back
      `null` this run on a transient Apify Spotify hiccup
      (`monthly_listeners: 0`/`followers: 0` for an otherwise
      correctly-resolved artist URI) — unrelated to this revert, and the
      existing null-guard behaved exactly as designed (no fabricated
      numbers); `social_engagement_index`/`fan_loyalty_index` (TikTok-
      anchored, not Spotify-anchored) computed correctly at 63/63. Test
      row + `processed_sessions` row deleted after, 0 rows left. Plaintext
      scratch files (the workflow export, which contains the 9 nodes'
      hardcoded `apikey`/`SERVICE_ROLE_KEY` values inline per the known
      Golden Rule 4 gap) shredded after use.

      **Not touched, deliberately out of scope**: the isolated test
      workflow (`T3ma7RKsDyQBKuuD`, "TEST — IBM Granite watsonx.ai
      Comparison") — left as-is, since Gilberto's decision was about
      production integration, not the standalone test harness; can be
      archived/deleted in a future session if desired. The
      `intelligence_reports.granite_powered` column and the `Report.tsx`
      badge/disclaimer UI (gated solely on that flag, see the badge task
      above) are also left in place — harmless dead plumbing now that
      nothing will ever set the flag true again, same "leave the unused
      column, don't chase it" pattern already used for `revenue_economics`
      elsewhere in this doc. §7's stale "Opus Maximus now includes IBM
      Granite by default" note has already been resolved (see §7 — the
      plan never shipped, so the pricing table's pre-existing figures
      needed no rewrite after all).

- [x] ~~SERVICE_ROLE_KEY transcript exposure (2026-08-13)~~ RESOLVED same
      session. Resuming the Granite plan above, reading the `HTTP Request`
      PATCH node's full body (step 2 of the plan) printed the live
      `SERVICE_ROLE_KEY` into the transcript again — same recurring
      structural gap as 2026-08-11 (the hardcoded `apikey` header can't be
      made credential-only via n8n's UI). Gilberto's call: rotate again
      rather than defer. Same procedure as 2026-07-28/08-11 (see §3 for the
      full method): backups first (`.env`, `pg_dumpall`, n8n sqlite online
      `.backup`, all `manual_20260813_122352_*`), new `JWT_SECRET`/
      `ANON_KEY`/`SERVICE_ROLE_KEY` generated via pure-stdlib Python
      (self-verified against the real live keys byte-for-byte first),
      values never printed to the terminal — written straight to a
      600-perm file and consumed by scripts, shredded once no longer
      needed. `docker compose up -d --force-recreate db auth rest storage
      meta analytics studio kong`. **Live-verified**: new anon key → `200`,
      old anon key → `401` negative control, Auth health → `200`. n8n:
      shared "Supabase Service Role Auth" credential updated via `n8n
      import:credentials`, re-exported to confirm it decrypts to the new
      value (iat matched exactly). All 9 hardcoded `apikey` headers patched
      via the established 3-DB-location method (`workflow_entity.nodes` +
      both `workflow_history` rows, same `versionId`/`activeVersionId` as
      every fix since 2026-07-18), dry run against a scratch copy first,
      plain `docker restart n8n_songss` (no env var changed), export-diff
      confirmed exact scope (63/63 nodes, connections byte-identical,
      exactly the 9 target nodes changed, all 9 confirmed on the new key).
      **Live end-to-end test**: disposable session
      (`cs_test_jwt_rotation_verify_20260813`, Chappell Roan, real TikTok
      handle), fired via internal `POST /webhook/submit-analysis` → clean
      `200`/`{"status":"ok"}`, real `artist_name`/`digital_score: 65`/
      `retention_rate: 46`/`ltv_projection: 8457057`/27,762-char
      `report_markdown`, `processed_sessions` row present (SMTP
      completed). Test row + `processed_sessions` row deleted after,
      0 rows left. **All 3 legs closed same session**: Vercel app (Gilberto
      updated `VITE_SUPABASE_PUBLISHABLE_KEY` in the dashboard and
      redeployed) and landing page (`/root/songss-landing-page/.env`
      updated, rebuilt via the node-version workaround, deployed by
      Gilberto directly on the VPS terminal) both live-verified via
      bundle-grep (new key present, old key absent) + real REST/Auth `200`s
      from each origin + old-key `401` negative control. All plaintext
      credential-export/patch scratch files shredded after use, same
      standing lesson as 2026-08-11.
- [ ] SERVICE_ROLE_KEY transcript exposure — RESOLVED (2026-08-11) on the
      backend+n8n leg, 2 legs remain. Found: the live `SERVICE_ROLE_KEY`
      (hardcoded `apikey` header, already a known Golden Rule 4 gap on 9
      n8n nodes) got printed into a Claude Code transcript while
      inspecting a node's JSON shape during the Granite/watsonx.ai test
      resume. Not a new architectural gap, but a live secret reaching a
      transcript is treated as exposed regardless — same category as the
      2026-07-28 incident. No real customers yet (confirmed), so no
      forced-relogin concern this time, unlike the 2026-07-28 rotation's
      framing.

      **Done, same procedure as 2026-07-28 (see §3 for that entry's full
      method)**: backups first (`.env`, `pg_dumpall`, n8n sqlite online
      `.backup`, all `manual_20260811_110831_*`/`.env.backup_20260811_110831_*`).
      New `JWT_SECRET` (48 random bytes, base64url, 64 chars) + re-signed
      `ANON_KEY`/`SERVICE_ROLE_KEY` (same `{role,iat,exp}` claim shape,
      same ~50-year horizon) generated via pure-stdlib Python, HS256
      implementation self-verified against the real live keys byte-for-byte
      before trusting it to generate new ones. `docker compose up -d
      --force-recreate db auth rest storage meta analytics studio kong`.
      **Live-verified**: real Kong REST call with new anon key → `200`;
      same call with old anon key → `401` (negative control); Auth health
      → `200`. n8n side: shared "Supabase Service Role Auth" credential
      updated via `n8n import:credentials` (not hand-rolled encryption),
      re-exported to confirm it decrypts to the new value. All 9 hardcoded
      `apikey` headers patched via the established 3-DB-location method
      (`workflow_entity.nodes` + both `workflow_history` rows), plain
      `docker restart n8n_songss` (no env var changed), export-diff
      confirmed exact scope (63/63 nodes, 9/9 confirmed on new value).
      **Live end-to-end test**: disposable session
      (`cs_test_jwt_rotation_verify_20260811`, Chappell Roan, real TikTok
      handle) through the real `/webhook/submit-analysis` path → clean
      `200`/`{"status":"ok"}`, real `artist_name`/`digital_score: 90`/
      `retention_rate: 46`/`ltv_projection: 8410897`/21,037-char
      `report_markdown`, `processed_sessions` row present (confirms SMTP
      completed). Test row + `processed_sessions` row deleted after,
      0 rows left. All plaintext credential-export/patch scratch files
      (container and host) shredded/removed after use.

      **RESOLVED same session — all 3 legs done, rotation fully closed.**
      Vercel app: Gilberto updated `VITE_SUPABASE_PUBLISHABLE_KEY` in the
      dashboard and redeployed; live-verified via bundle-grep (new key
      present, old absent) + real REST/Auth `200`s from
      `Origin: https://app.songssintelligence.com` + old-key `401`
      negative control. Landing page:
      `/root/songss-landing-page/.env`'s `VITE_SUPABASE_PUBLISHABLE_KEY`
      updated (old value backed up to
      `.env.backup_20260811_120128_pre_landing_page_key_update`), rebuilt
      via the node-version workaround, deployed via `wrangler deploy`
      using a fresh Cloudflare token Gilberto created (told to revoke it
      after — note `unset CLOUDFLARE_API_TOKEN` only clears the local
      shell var, doesn't itself invalidate the token on Cloudflare's side).
      Live-verified identically: bundle-grep on the live
      `songssintelligence.com` assets (new key present, old absent) + real
      REST/Auth `200`s from that origin + old-key `401`. All scratch
      files (bundles, HTML fetches) deleted after use. See memory
      `project_service_role_key_transcript_exposure_2026-08-11`.
- [ ] Syntax errors found during graphify Pass 1 extraction (2026-08-10) —
      `graphify extract . --code-only` reported 2 source files with syntax
      errors, partially extracted rather than fully parsed:
      `src/pages/Pricing.tsx` (first error at line 109) and
      `src/pages/Privacy.tsx` (first error at line 892). Not investigated
      yet — worth a look to confirm whether these are real bugs or
      artifacts of graphify's tree-sitter parser (e.g. unsupported syntax),
      since neither has been reported as broken in the live app.
- [ ] npm dependency security audit (started 2026-08-09) — `npm audit` found
      18 vulnerable packages (15 high, 3 moderate, 0 critical). Priority
      order agreed with Gilberto: react-router-dom first (real
      customer-facing exposure, ships in the browser bundle), then the
      broader dev-tooling batch, then Dependabot security alerts (Gilberto
      checking/enabling directly in GitHub settings — needs his own
      account access, not checkable via API without a token).
      - [x] ~~`react-router-dom` — the originally-reported fix (bump
            6.30.2 → 6.30.4, non-major) does NOT fully close the exposure:
            a newer advisory, [GHSA-jjmj-jmhj-qwj2](https://github.com/advisories/GHSA-jjmj-jmhj-qwj2)
            ("Open redirect leading to XSS", moderate), covers the range
            `6.0.0-alpha.0 - 7.17.0` — i.e. all of v6 including 6.30.4.
            The only real fix is `react-router-dom@7.18.2`, a **major**
            version bump~~ RESOLVED 2026-08-19, without the major bump.
            Gilberto asked for the full v6→v7 migration; research first
            (per his ask, before touching anything) found the maintainers
            had backported the fix to the v6 line as 6.30.5/6.30.6,
            released 2026-08-18 — one day before this session, which is
            why the 2026-08-09 assessment above didn't know about it.
            Cross-verified 3 ways before trusting it (GitHub's advisory
            *page* is a JS-rendered version-range widget that gave
            self-contradictory answers across scrape attempts — same
            "don't trust the summarized view" lesson as
            [[project_perplexity_press_media_buzz_design_2026-07-27]]'s
            advisory-list finding; used the GitHub Advisories **API**
            instead for the authoritative machine-readable range):
            1) GHSA API confirms the underlying fix landed in
            `react-router@7.13.0` via PR #14718; 2) the v6 CHANGELOG's
            6.30.5/6.30.6 entry is explicitly described as "a cherry-pick
            of #14718" — the identical fix; 3) OSV.dev independently
            confirms `react-router-dom@6.30.4` vulnerable,
            `@6.30.6` clean. Patched `6.30.4`(installed)/`6.30.2`(declared)
            → `6.30.6` — non-major, zero API surface change, no import
            changes needed anywhere. `npm install` reproduced the exact
            "surprising blast radius" from 2026-08-09 (confirmed harmless
            this time: only 4 packages actually changed version — the
            react-router-dom/react-router/@remix-run/router chain plus an
            unrelated `@babel/runtime` bump — the other ~140 touched lines
            were pre-existing transitive deps missing from the committed
            lockfile, i.e. the `npm ci` drift noted below, not new/changed
            packages) — hand-patched just the 3 relevant lockfile entries
            instead of landing the full regeneration, leaving the
            `npm ci` drift issue exactly as it was. `tsc -p
            tsconfig.app.json --noEmit` and `vite build` both clean; dev
            server smoke test (root, `/dashboard`, a dynamic
            `/report/:id`, and the catch-all 404 route) all `200` with no
            transform errors; confirmed the shipped bundle actually
            contains `6.30.6`. Committed
            (`fix(deps): patch react-router-dom to 6.30.6...`) and pushed
            — Vercel auto-deploys from `main`. **As of 2026-08-19 this
            closes the SOLE remaining open browser-bundle vulnerability**
            (d3-color resolved 2026-08-15) — no known browser-bundle dep
            exposure remains open. A true v7 migration (removing loader/
            data-router API gaps, adopting the new default future-flag
            behaviors) is still worth doing someday as modernization, but
            is no longer security-driven — not scheduled.
      - [x] ~~`d3-color` ReDoS ([GHSA-36jr-mh4h-2g58](https://github.com/advisories/GHSA-36jr-mh4h-2g58),
            high)~~ RESOLVED 2026-08-15 — advisory confirmed (WebFetch of
            the GHSA page) as vulnerable `>=1.0.2, <3.1.0`, first patched
            `3.1.0`. The committed `package-lock.json` pins
            `d3-color@3.1.0` — **exactly the patched version, NOT
            vulnerable as committed.** The 2026-08-09 flag was raised only
            during the transient, *reverted* broad lockfile re-resolution;
            the restored committed tree sits at 3.1.0. It's transitive
            (via `d3-transition` → Recharts), so a future re-resolution
            could move it — but only forward, never back below 3.1.0.
            Nothing to do.
      - [x] ~~`js-yaml`~~ RESOLVED 2026-08-19 (Dependabot PR reviewed and
            landed). Transitive via `@eslint/eslintrc` only, never shipped
            to the browser. Changelog (4.1.0→4.3.1) confirmed no breaking
            changes — the intermediate releases are pure security fixes
            (prototype pollution in the merge operator, two
            quadratic-complexity DoS fixes). Couldn't merge the Dependabot
            PR object directly (no `gh` CLI or GitHub API token in this
            environment, and the PR branch predated 2 later commits on
            `main` anyway — a raw branch merge would have reverted them).
            Landed the equivalent fix instead: `npm update js-yaml` against
            current `main` (isolated version-level diff confirmed only 2
            packages actually changed version — `js-yaml` and an incidental
            `@babel/runtime` bump — everything else was the lockfile
            catching up on ~140 entries already missing for dependencies
            already declared in `package.json`), `tsc`/`vite build` both
            clean, identical output bundle hashes. **Bonus**: this
            incidentally fixed the `npm ci` drift bug below too — verified
            in an isolated scratch copy that `npm ci` now succeeds cleanly
            against the updated lockfile (previously failed with `Missing:
            internmap@1.0.1 from lock file`, see the finding right below).
      - [ ] Remaining dev-tooling batch (`vite`, `rollup`, `esbuild`,
            `postcss`, `lodash`, `glob`, `minimatch`, `picomatch`, `nanoid`,
            `ajv`, `ws`, `brace-expansion`, `flatted`, `yaml`) —
            build-time/dev dependencies, not shipped to the customer's
            browser. `npm audit fix` (non-forced) reported a fix available
            for all of them as of 2026-08-09, but not run yet given the
            react-router-dom install's surprising blast radius — worth a
            careful, isolated diff-check the same way, not assumed safe
            just because npm calls it "fix available". Since the `npm ci`
            drift bug is now fixed (see `js-yaml` above), a future pass at
            this batch should start from a clean `npm ci`-verified lockfile
            rather than the drifted one these packages were originally
            flagged against.
      - [x] ~~Dependabot security alerts — not yet confirmed on~~ CONFIRMED
            ACTIVE 2026-08-10: a `git push origin main` surfaced GitHub's
            own Dependabot summary directly in the push output — **34
            vulnerabilities found (15 high, 17 moderate, 2 low)**, a
            broader count than the 18 `npm audit` found locally on
            2026-08-09 (15 high, 3 moderate, 0 critical). No
            `.github/dependabot.yml` exists (alerts are GitHub's default
            repo-level scanning, not a configured update bot), and the
            full per-advisory breakdown still isn't checkable without an
            authenticated `gh`/API token — Gilberto to review the
            Dependabot tab directly for details beyond this summary count.
      - **Reverted, not committed** (2026-08-09): the `react-router-dom@6.30.4` +
        broad lockfile change was fully reverted this session
        (`git checkout -- package.json package-lock.json`) — nothing from
        this investigation is live or committed. `node_modules` on disk
        was resynced back toward the committed lockfile via `npm ci`,
        which — separately from all of the above — **failed both times it
        was run**, identically: `Missing: internmap@1.0.1 from lock file`.
        Not investigated further (Gilberto's explicit call, out of scope
        for today) — flagging as its own open finding since it means
        `npm ci` (the strict, reproducible-install command a fresh clone
        or CI/CD would use) currently does not work cleanly against this
        repo's committed lockfile, independent of anything touched this
        session. `node_modules` itself was confirmed still intact/usable
        afterward (`vite`, `react-router-dom` both present) — the app
        isn't broken, only `npm ci` specifically is.
      - [x] ~~`npm ci` drift (`internmap@1.0.1` missing)~~ RESOLVED
        2026-08-19, as a side effect of reviewing/landing the `js-yaml`
        Dependabot PR above — `internmap@1.0.1` (a dependency of
        `react-simple-maps`/`d3-geo`) was exactly one of the ~140 lockfile
        entries that were missing for dependencies already declared in
        `package.json` but never properly locked. `npm ci` now verified
        to succeed cleanly (isolated scratch copy) against the committed
        lockfile.
- [x] ~~Componentize Report.tsx (1,442 lines) — via Cline~~ RESOLVED
      2026-08-01. Cline's initial pass created 12 section components plus
      a shared.tsx (constants/formatters/Section/SectionHeader/
      MarkdownCard) but never actually wired them in — Report.tsx still
      had every section's original JSX duplicated inline, plus a real
      TS2440 "import conflicts with local declaration" compile error on
      Section/SectionHeader/MarkdownCard invisible to a naive `tsc
      --noEmit` (the root tsconfig.json is solution-style with `files:
      []`; only `tsc -p tsconfig.app.json` surfaces it — see
      `feedback_tsc_solution_style_false_pass` in memory). Finished the
      wiring: swapped every inline block for its component, removed the
      dead local definitions/imports, and fixed a real behavioral gap in
      IndustryBuzzTracker.tsx (it dumped raw markdown into
      dangerouslySetInnerHTML instead of running it through
      renderMarkdown() first) via a pre-rendered summaryHtml prop.
      Report.tsx: 1547 → 964 lines. `tsc -p tsconfig.app.json` and `vite
      build` both clean; live-verified via a disposable test row with
      markdown-laden industry_buzz_data (bold/italic rendered correctly,
      row deleted after). Also surfaced and fixed an unrelated finding
      mid-review: this repo's local `.env` had the pre-rotation dead
      Supabase anon key (2026-07-28/30 JWT rotation missed this file) —
      see `project_local_dev_env_stale_anon_key_2026-08-01` in memory.
- [ ] Fan Loyalty Index — frontend display (KPI tile/section in
      Report.tsx / ArtistIndieReport.tsx). Backend formula implemented and
      live-verified 2026-08-01 — see §4 "RESOLVED (implemented
      2026-08-01): Fan Loyalty Index" — `engagement_metrics.fan_loyalty_index`
      is live and populated on every new report now, just not shown in the
      UI yet. Deliberately deferred (Gilberto's call) to think through
      placement/design with fresh eyes in a future session rather than
      rush it.
- [ ] AI First strategy — update positioning on app and landing pages
- [ ] n8n workflow visual layout — reorganize for readability
- [ ] RTK (Redux Toolkit) — incremental adoption: auth, report, artist, ui slices
- [ ] USPTO — trademark SONGSS Intelligence (Class 42) and NIE
- [ ] MFA on Supabase Studio
- [x] ~~n8n version upgrade 2.28.3 → 2.32.7+ — last Tier 1 security
      item~~ RESOLVED 2026-08-01 — see §3 "RESOLVED (2026-08-01): n8n
      version upgrade, 2.28.3 → 2.32.7 — last Tier 1 security item,
      completed." Assessment finished (23 CVEs tallied: 7 apply/
      editor-only, 15 N/A, 1 low-relevance), upgraded and live-verified
      end-to-end on the real Stripe→NIE path; all 3 credentials confirmed
      working post-upgrade. Also closed the separate "yellow Publish
      indicator" question same session — confirmed via DB it was stale
      version-history bookkeeping, not pending changes.
- [ ] Supabase `pooler`/`realtime`/`functions` crash loops — non-blocking,
      not on the live customer path (see §3 "RESOLVED (2026-07-27):
      Postgres password rotation" for full detail). `supabase-pooler`
      (Supavisor) crashes on a Cloak/cipher key mismatch decrypting its
      own internal tenant config; `realtime` crashes on an Ecto migration
      schema error; `supabase-edge-functions` has been crash-looping since
      2026-05-01 (7,974 restarts) on "could not find an appropriate
      entrypoint" — no edge function ever deployed. All three
      authenticate to Postgres successfully before failing, so none are
      password/auth issues. Confirmed nothing in the live app uses
      Realtime subscriptions or connects through the pooler's proxy
      ports. Needs its own dedicated session to investigate root causes.
- [x] ~~"Industry Buzz Tracker" feature (compact UI form: "Industry Buzz") —
      n8n workflow integration~~ IMPLEMENTED 2026-07-27 — see §4 "RESOLVED
      (implemented 2026-07-27): Industry Buzz Tracker...". 2 new n8n nodes,
      new `industry_buzz_data` Supabase column, frontend KPI tile + full
      section, live-verified end-to-end. Found and fixed a real bug during
      verification (the `HTTP Request` PATCH node's hardcoded field list
      didn't include the new field).
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
      - [x] ~~Step 2: ltv_projection real formula~~ DONE 2026-07-25 — see §4
            "RESOLVED (implemented 2026-07-25): ltv_projection replaced...".
            `round(monthly_listeners × 0.012 × 24 × (0.5 + retention_rate/100))`,
            anchored on real `spotify_data.monthly_listeners` (not a fabricated
            `monthly_streams` proxy), approved by Gilberto, live-verified
            deterministic. Frontend tooltip added to both report components.
      - [x] ~~Step 3: growth_trajectory real formula~~ DONE 2026-07-26 — see
            §4 "RESOLVED (implemented 2026-07-26): growth_trajectory
            replaced...". `round(monthly_listeners × (1 + 0.02×(0.5 +
            retention_rate/100))^i)` for i=0..5, same real anchor + bounded
            retention multiplier pattern as ltv_projection, live-verified
            deterministic. Frontend caption added to both report components.
      - [ ] Remaining: the extraction step's tier-blindness (`Edit Fields`
            always reads the premium `NIE — Neural Intelligence Engine`
            report regardless of tier) — now only affects `digital_score`
            and `geo_hotspots`, since retention_rate/ltv_projection/
            growth_trajectory are all code-computed and no longer read from
            that extraction step at all
- [x] ~~Hardcoded `apikey` header (Supabase `service_role` JWT) — the
      "no credential at all" half of the gap~~ RESOLVED 2026-07-28, as part
      of the JWT rotation below — see §3 "IN PROGRESS (started 2026-07-28):
      Supabase JWT_SECRET/ANON_KEY/SERVICE_ROLE_KEY rotation". `Check Peer
      Cache`/`Write Peer Cache` (previously zero credential wiring at all)
      migrated onto the shared "Supabase Service Role Auth" credential,
      matching the other 7 nodes. **Not fully closed**: `apikey` itself
      stays a per-node hardcoded value on all 9 nodes — n8n's
      `httpHeaderAuth` credential type only injects one header, and
      Supabase needs both `apikey` and `Authorization` independently. Full
      closure needs a custom n8n credential type (real engineering) — flag
      again if this needs revisiting.
- [x] ~~Supabase JWT rotation — finish landing page redeploy.~~ RESOLVED
      2026-07-30 — see §3 "RESOLVED (2026-07-30): landing page redeploy —
      closes out this rotation entirely." All 3 legs (Supabase backend +
      n8n, Vercel app, landing page) now done and live-verified. `.env`
      updated, rebuilt (`ensure-wrangler.mjs` now auto-copies
      `wrangler.json`, no longer a separate manual step), deployed via a
      create-use-revoke Cloudflare token, live bundle-grep + real Kong
      REST 200/401 checks from the landing page's own origin confirmed
      the cutover. Entire rotation closed; no real-visitor impact remains.
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
- [x] ~~Artist Radar Profile & Conversion Funnel — ground in real data~~
      RESOLVED 2026-07-27 (frontend-only, `src/pages/Report.tsx`). These
      were the last belt-and-suspenders pre-launch fields: investigation
      found `virality_score`/`sync_potential`/`live_score`/`brand_fit`/
      `streaming_growth`/`community_score` and `funnel`/`conversion_funnel`
      never existed anywhere in the n8n workflow or in any real report —
      not AI-guessed like `ltv_projection`/`growth_trajectory`, but pure
      static frontend fallback constants (e.g. radar always showed
      65/72/58/70/80/55 for every artist, every session, confirmed via
      `git log -p` to predate this investigation entirely). Fixed:
      - **Conversion Funnel → Engagement Pyramid**: 3 real tiers — Passive
        Reach (`spotify_data.monthly_listeners`), Retained Audience
        (`spotify_data.followers` + a clamped 0-100%
        Follower-to-Listener-Ratio badge, `min(100, max(0,
        followers/monthly_listeners×100))` — legacy/superstar artists can
        exceed 100% raw), Active Superfans (`retention_rate` +
        `social_engagement_index` badge). Tier widths in the UI are static
        visual chrome, not derived from the tiers' own values — deliberately
        avoids the old bug's fake per-artist "X% convert to Y" implication
        between incomparable units.
      - **Artist Radar Profile**: 3 of 6 axes now real — Streaming Growth
        (derived from `growth_trajectory`'s M1→M6 as `(M6/M1-1)×100`,
        clamped 0-100), Community (bound directly to `retention_rate`),
        Virality (reuses `social_engagement_index` directly rather than a
        second, redundant TikTok calculation — Gilberto's call, avoids
        duplicating logic and a second unvalidated constant). The remaining
        3 (Sync Potential, Live Performance, Brand Fit) have no real data
        source anywhere in the pipeline — render `value: 0` for safe chart
        plotting but a `pending: true` flag drives a "Pending Data" badge
        in both the chart tooltip and the below-chart grid, instead of a
        fake number.
      - **Verified**: isolated logic test (real Chappell Roan data, missing
        `growth_trajectory`, empty-array `growth_trajectory`, and a
        legacy-superstar >100%-raw-ratio case) — all correct, no
        `NaN`/`undefined` ever reaches the chart. `tsc --noEmit` clean,
        `vite build` succeeded. Live browser visual test (2026-07-27): dev
        server bound to `127.0.0.1` only (confirmed via `ss -tlnp`, not
        externally reachable), disposable `intelligence_reports` row seeded
        with real, previously-verified Chappell Roan data, viewed via SSH
        tunnel. Confirmed Engagement Pyramid tiers and Radar's 3
        "Pending Data" badges render correctly; `growth_trajectory`'s M1
        correctly matched the real `monthly_listeners` anchor. Test row +
        dev server torn down after.
      - **Follow-up polish items surfaced during visual QA, not blocking,
        not yet investigated**: (1) Revenue Snapshot section — bar label
        rendering issue observed live, needs its own look. (2) PDF export —
        needs a theme/styling check (unclear yet whether the new Engagement
        Pyramid/Radar sections render correctly in the PDF export path).

---

## 12. CONTACTS

Email: hello@songssintelligence.com / admin@songssintelligence.com
Company: Americascom, Inc. — 651 N Broad St, Ste 206, Middletown, DE 19709, USA
Stripe Portal: https://buyer.americaspay.com/p/login/bJe4gz9tjbuTfSa1zL3cc00
Supabase Studio: https://studio.songssintelligence.com
n8n: https://n8n.songssintelligence.com (admin@songssintelligence.com)

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
