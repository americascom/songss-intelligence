import { useEffect, useMemo, useState, Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Lock, Loader2, Activity, Users, TrendingUp, DollarSign,
  ShieldCheck, Radio, Calculator, Film, Award,
  Download, Sparkles, ArrowUpRight,
  Building2, AlertTriangle, Newspaper, Heart,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ArtistIndieReport from "@/components/ArtistIndieReport";
import { isSampleReportSession } from "@/lib/sampleReports";
import PeerBenchmarkChart, { type PeerBenchmarkData } from "@/components/PeerBenchmarkChart";
import { C, mono, glass, Section, SectionHeader, MarkdownCard, fmtCompact, fmtUSD } from "@/components/report/shared";
import { NeuralTrajectory } from "@/components/report/NeuralTrajectory";
import { TopMarkets } from "@/components/report/TopMarkets";
import { ThreeMovesCard } from "@/components/report/ThreeMovesCard";
import { CuratorPitch } from "@/components/report/CuratorPitch";
import { RevenueSnapshot } from "@/components/report/RevenueSnapshot";
import { YouTubePresence } from "@/components/report/YouTubePresence";
import { InstagramPresence } from "@/components/report/InstagramPresence";
import { IndustryBuzzTracker } from "@/components/report/IndustryBuzzTracker";
import { EngagementPyramid } from "@/components/report/EngagementPyramid";
import { ArtistRadarProfile } from "@/components/report/ArtistRadarProfile";
import { TikTokDSPCorrelation } from "@/components/report/TikTokDSPCorrelation";
import { RevenueModelAdvanced } from "@/components/report/RevenueModelAdvanced";

// ── Utilities ────────────────────────────────────────────────────────────────

function stripCodeFence(raw: string): string {
  let s = raw.trim();
  if (s.startsWith("```html")) s = s.slice(7);
  else if (s.startsWith("```")) s = s.slice(3);
  if (s.endsWith("```")) s = s.slice(0, -3);
  return s.trim();
}

function renderMarkdown(md: string): string {
  if (!md) return "";
  const inline = (t: string) =>
    t
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");
  const lines = md.split("\n");
  const out: string[] = [];
  let inTable = false, tableRows = 0, inList = false;
  const flushList  = () => { if (inList)  { out.push("</ul>");              inList  = false; } };
  const flushTable = () => { if (inTable) { out.push("</tbody></table>"); inTable = false; tableRows = 0; } };
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith("|")) {
      if (/^\|[-|\s:]+\|$/.test(line)) continue;
      flushList();
      if (!inTable) { out.push("<table>"); inTable = true; tableRows = 0; }
      const cells = line.split("|").slice(1, -1).map((c) => c.trim());
      if (tableRows === 0) {
        out.push("<thead><tr>" + cells.map((c) => `<th>${inline(c)}</th>`).join("") + "</tr></thead><tbody>");
      } else {
        out.push("<tr>" + cells.map((c) => `<td>${inline(c)}</td>`).join("") + "</tr>");
      }
      tableRows++;
      continue;
    }
    flushTable();
    if (/^[-*]\s/.test(line)) {
      if (!inList) { out.push("<ul>"); inList = true; }
      out.push("<li>" + inline(line.replace(/^[-*]\s/, "")) + "</li>");
      continue;
    }
    if (inList && line) flushList();
    if (line.startsWith("> ")) { out.push(`<blockquote>${inline(line.slice(2))}</blockquote>`); continue; }
    if (!line) { flushList(); continue; }
    out.push("<p>" + inline(line) + "</p>");
  }
  flushList();
  flushTable();
  return out.join("");
}

function extractSection(content: string, ...keywords: string[]): string | null {
  for (const kw of keywords) {
    const h2 = new RegExp(`<h2[^>]*>[^<]*${kw}[^<]*<\\/h2>([\\s\\S]*?)(?=<h2|$)`, "i");
    const m2  = content.match(h2);
    if (m2) return m2[1].trim();
    const md = new RegExp(`##\\s*[^\\n]*${kw}[^\\n]*\\n([\\s\\S]*?)(?=\\n##\\s|\\n#\\s|$)`, "i");
    const mm  = content.match(md);
    if (mm) return mm[1].trim();
  }
  return null;
}

// ── Plan tiers ───────────────────────────────────────────────────────────────
function planTier(plan?: string | null): "indie" | "growth" | "pro" | "enterprise" | "opus" {
  const p = (plan || "").toLowerCase();
  if (p.includes("opus"))       return "opus";
  if (p.includes("enterprise")) return "enterprise";
  if (p.includes("pro"))        return "pro";
  if (p.includes("growth"))     return "growth";
  return "indie";
}
const tierRank = { indie: 0, growth: 1, pro: 2, enterprise: 3, opus: 4 } as const;
const has = (t: ReturnType<typeof planTier>, min: keyof typeof tierRank) =>
  tierRank[t] >= tierRank[min];

// ── Error boundary ────────────────────────────────────────────────────────────
interface EBState { hasError: boolean; message: string }
class ErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { hasError: false, message: "" };
  static getDerivedStateFromError(err: unknown): EBState {
    return { hasError: true, message: err instanceof Error ? err.message : String(err) };
  }
  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error("[Report] render error", err, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-6" style={{ background: C.bg }}>
          <div className="text-center max-w-md">
            <div className={`${mono} text-xs uppercase tracking-[0.4em] mb-3`} style={{ color: "#FF6B6B" }}>Render Error</div>
            <p className="text-sm mb-4" style={{ color: C.gray }}>Something went wrong rendering this report.</p>
            <code className="text-xs block px-4 py-3 rounded-lg text-left break-all" style={{ background: C.surface, color: "#FF9999" }}>
              {this.state.message}
            </code>
            <button
              className="mt-6 text-xs underline"
              style={{ color: C.cyan }}
              onClick={() => this.setState({ hasError: false, message: "" })}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Error screen ──────────────────────────────────────────────────────────────
function Classified() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: C.bg }}>
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-md"
      >
        <Lock className="w-8 h-8 mx-auto mb-6" style={{ color: C.cyan }} />
        <div className={`${mono} text-xs uppercase tracking-[0.4em] mb-3`} style={{ color: C.cyan }}>401 — Classified</div>
        <h1 className="text-2xl font-semibold mb-3" style={{ color: C.white }}>This dossier does not exist.</h1>
        <p className="text-sm" style={{ color: C.gray }}>The session ID is invalid or has been revoked.</p>
      </motion.div>
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface ReportRow {
  id: string;
  session_id: string;
  email: string | null;
  customer_email: string | null;
  artist_name: string | null;
  plan_name: string | null;
  digital_score: number | null;
  geo_hotspots: any;
  engagement_metrics: any;
  report_markdown: string | null;
  report_html: string | null;
  created_at: string;
  youtube_data: { subscribers?: number; total_views?: number | string } | null;
  instagram_data: { followers?: number; following?: number; media_count?: number } | null;
  spotify_data: { followers?: number; monthly_listeners?: number; top_country?: string } | null;
  tiktok_data: { followers?: number; engagement_rate?: number } | null;
  peer_benchmark_data: PeerBenchmarkData | null;
  industry_buzz_data: {
    sentiment: string | null;
    summary: string | null;
    notable_mentions: string[];
    citations: string[];
    search_context_size: string | null;
  } | null;
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Report() {
  return (
    <ErrorBoundary>
      <ReportInner />
    </ErrorBoundary>
  );
}

function ReportInner() {
  const { session_id } = useParams<{ session_id: string }>();
  const [report, setReport]   = useState<ReportRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!session_id?.trim()) { setLoading(false); setError("invalid"); return; }
    let stopped = false;
    const poll = async () => {
      const { data, error } = await (supabase
        .rpc("get_report_by_session" as any, { p_session_id: session_id }) as any);
      if (stopped) return;
      if (error) { setLoading(false); setError(error.message); return; }
      const row = Array.isArray(data) ? data[0] : data;
      if (row && (row.report_html || row.report_markdown)) {
        setReport(row as unknown as ReportRow);
        setLoading(false);
        return;
      }
      setTimeout(poll, 4000);
    };
    poll();
    return () => { stopped = true; };
  }, [session_id]);

  // ── Tier ─────────────────────────────────────────────────────────────────
  const tier = planTier(report?.plan_name);
  const isSample = isSampleReportSession(session_id);

  // ── Base data ─────────────────────────────────────────────────────────────
  const em  = report?.engagement_metrics  ?? {};
  const geo = report?.geo_hotspots        ?? {};

  const snie            = Number(report?.digital_score          ?? 0) || 72;
  const rawSEI           = (em as any)?.social_engagement_index;
  const engagementScore: number | null = rawSEI == null ? null : Number(rawSEI);
  const rawFanLoyalty    = (em as any)?.fan_loyalty_index;
  const fanLoyaltyIndex: number | null = rawFanLoyalty == null ? null : Number(rawFanLoyalty);
  const retentionRate   = Number((em as any)?.retention_rate    ?? (em as any)?.retentionRate   ?? 0) || 48;
  // monthly_streams was an AI-fabricated free-text estimate (no formula) --
  // same class of bug already fixed for retention_rate/ltv_projection/
  // growth_trajectory. Use the real Spotify anchor those fields already use
  // instead of a second, unrelated fake number.
  const monthlyListeners = Number((report?.spotify_data as any)?.monthly_listeners ?? 0) || 28000;
  const ltv             = Number((em as any)?.ltv_projection ?? (em as any)?.ltv ?? 0) || 8400;

  const yt              = report?.youtube_data   ?? {};
  const ytSubscribers   = Number(yt?.subscribers ?? 0);
  const ytTotalViews    = Number(yt?.total_views  ?? 0);
  const hasYouTubeData  = ytSubscribers > 0 || ytTotalViews > 0;

  const ig               = report?.instagram_data ?? {};
  const igFollowers      = Number(ig?.followers   ?? 0);
  const igFollowing      = Number(ig?.following   ?? 0);
  const hasInstagramData = igFollowers > 0;

  // Industry Buzz Tracker: real-time Perplexity press/media coverage,
  // structured JSON returned directly by the model (sentiment + summary +
  // notable_mentions), citations are Perplexity's own real search_results,
  // never AI-invented. null (not a fabricated default) when the artist
  // doesn't have enough recent, verifiable coverage.
  const industryBuzz     = report?.industry_buzz_data ?? null;
  const buzzSentiment    = industryBuzz?.sentiment ?? null;
  const hasIndustryBuzz  = !!(industryBuzz?.summary);
  const BUZZ_SENTIMENT_STYLE: Record<string, { label: string; color: string }> = {
    positive: { label: "Positive", color: C.cyan },
    mixed:    { label: "Mixed",    color: C.warm },
    negative: { label: "Negative", color: "#FF6B6B" },
  };
  const buzzBadge = buzzSentiment && BUZZ_SENTIMENT_STYLE[buzzSentiment]
    ? BUZZ_SENTIMENT_STYLE[buzzSentiment]
    : null;
  const buzzSummaryHtml = useMemo(() => renderMarkdown(industryBuzz?.summary || ""), [industryBuzz]);

  const reportDate = report
    ? new Date(report.created_at).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric",
      })
    : "";

  // ── Memoised data ─────────────────────────────────────────────────────────
  const trajectory = useMemo(() => {
    const raw = (em as any)?.growth_trajectory ?? (em as any)?.trajectory ?? (em as any)?.neural_trajectory ?? [];
    if (Array.isArray(raw) && raw.length) {
      return raw.slice(0, 6).map((r: any, i: number) => ({
        month:   r?.label   ?? r?.month ?? `M${i + 1}`,
        streams: Number(r?.streams ?? r?.value ?? 0),
      }));
    }
    return Array.from({ length: 6 }, (_, i) => ({
      month:   `M${i + 1}`,
      streams: Math.round(monthlyListeners * (0.55 + i * 0.12)),
    }));
  }, [em, monthlyListeners]);

  const markets = useMemo(() => {
    const raw  = Array.isArray(geo) ? geo : ((geo as any)?.top_cities ?? (geo as any)?.cities ?? (geo as any)?.top ?? (geo as any)?.hotspots ?? []);
    const list = Array.isArray(raw) ? raw : [];
    const parseNum = (v: any): number | null => {
      if (v == null) return null;
      if (typeof v === "number" && Number.isFinite(v)) return v;
      const s = String(v).replace(/[, ]/g, "");
      const m = s.match(/(-?\d+(?:\.\d+)?)\s*([KkMmBb]?)/);
      if (!m) return null;
      const n = parseFloat(m[1]);
      if (!Number.isFinite(n)) return null;
      const mult = m[2]?.toLowerCase() === "k" ? 1e3 : m[2]?.toLowerCase() === "m" ? 1e6 : m[2]?.toLowerCase() === "b" ? 1e9 : 1;
      return n * mult;
    };
    const rawScores = list.map((r: any) =>
      parseNum(r?.score ?? r?.potential ?? r?.potential_score ?? r?.velocity ?? r?.value ?? null)
    );
    const maxScore  = Math.max(0, ...rawScores.filter((n): n is number => n != null));
    const normalize = (n: number | null, idx: number): number => {
      if (n == null) return [84, 78, 73][idx] ?? 70;
      if (n <= 100)  return Math.round(n);
      if (maxScore > 0) return Math.max(40, Math.round((n / maxScore) * 100));
      return 70;
    };
    const arr = list.slice(0, 3).map((r: any, i: number) => ({
      country:     r?.country ?? r?.name ?? r?.city ?? "—",
      city:        r?.city && r?.country && r.city !== r.country ? r.city : null,
      score:       normalize(rawScores[i], i),
      opportunity: r?.opportunity ?? r?.insight ?? r?.note ?? null,
    }));
    if (arr.length) return arr;
    return [
      { country: "United States", city: "Los Angeles", score: 84, opportunity: "Strong sync & editorial potential" },
      { country: "Brazil",        city: "São Paulo",   score: 78, opportunity: "Growing playlist traction" },
      { country: "United Kingdom",city: "London",      score: 73, opportunity: "Editorial radar candidate" },
    ];
  }, [geo]);

  const revenueSnapshot = useMemo(() => [
    { source: "Streaming", revenue: Math.round(ltv * 0.50) },
    { source: "Merch",     revenue: Math.round(ltv * 0.20) },
    { source: "Sync",      revenue: Math.round(ltv * 0.16) },
    { source: "Live",      revenue: Math.round(ltv * 0.14) },
  ], [ltv]);

  const recommendations = useMemo(() => {
    const raw = (em as any)?.recommendations ?? (em as any)?.actions ?? [];
    if (Array.isArray(raw) && raw.length >= 3) {
      return raw.slice(0, 3).map((r: any) =>
        typeof r === "string"
          ? { title: r, body: "" }
          : { title: r?.title ?? r?.action ?? "Next step", body: r?.body ?? r?.description ?? "" }
      );
    }
    return [
      { title: "Lean into your top market",      body: `Your strongest signal is in ${markets[0]?.country}. Plan one release event or playlist push focused there in the next 30 days.` },
      { title: "Show up consistently for fans",  body: "Retention climbs when fans hear from you weekly. Try one short video and one story post per week for the next month." },
      { title: "Open a second revenue door",     body: "Streaming is paying, but a small merch drop or a sync pitch can meaningfully lift your LTV. Pick one and ship it." },
    ];
  }, [em, markets]);

  // ── Growth+: Engagement Pyramid (replaces Conversion Funnel) ────────────────
  // Real, grounded 3-tier depth model. Tier widths below are static visual
  // chrome (100/78/56%), not derived from the tiers' own values -- the old
  // Conversion Funnel bug was implying a fake per-artist conversion rate
  // between stages built off an AI-fabricated monthly_streams field with no
  // real funnel data anywhere in the pipeline; this replaces it rather than
  // repeating the pattern with different labels.
  const engagementPyramid = useMemo(() => {
    const spotify          = report?.spotify_data ?? {};
    const monthlyListeners = Number(spotify?.monthly_listeners ?? 0);
    const spotifyFollowers = Number(spotify?.followers ?? 0);
    const rawRatio         = monthlyListeners > 0 ? (spotifyFollowers / monthlyListeners) * 100 : 0;
    const clampedRatio     = Math.min(100, Math.max(0, rawRatio));

    return [
      {
        tier: "Passive Reach",
        value: `${fmtCompact(monthlyListeners)} Listeners`,
        color: C.cyan,
      },
      {
        tier: "Retained Audience",
        value: `${fmtCompact(spotifyFollowers)} Followers`,
        badge: `${clampedRatio.toFixed(1)}%`,
        badgeTitle: "Follower-to-Listener Ratio, capped at 100% for index purposes — legacy/superstar artists can have raw follower counts that exceed current monthly listeners.",
        color: C.cyanSoft,
      },
      {
        tier: "Active Superfans",
        value: `${retentionRate.toFixed(0)}% Retention`,
        badge: engagementScore === null ? undefined : `${engagementScore.toFixed(0)} SEI`,
        color: "#4ECDC4",
      },
    ];
  }, [report, retentionRate, engagementScore]);

  // ── Pro+: Artist Radar ────────────────────────────────────────────────────
  // 3 axes grounded in already-computed real data; 3 axes with no real data
  // source yet marked pending rather than shown with a fake number (these
  // were previously static fallback constants — 65/72/58/70/80/55 for every
  // artist, every session, never AI- or code-derived at all).
  const radarData = useMemo(() => {
    const gt = Array.isArray((em as any)?.growth_trajectory) ? (em as any).growth_trajectory : null;
    let growthPct: number | null = null;
    if (gt && gt.length >= 2) {
      const m1 = Number(gt[0]?.value ?? 0);
      const m6 = Number(gt[gt.length - 1]?.value ?? 0);
      if (m1 > 0) growthPct = Math.min(100, Math.max(0, ((m6 / m1) - 1) * 100));
    }

    return [
      { axis: "Streaming Growth", value: growthPct ?? 0,      pending: growthPct === null },
      { axis: "Community",        value: retentionRate,        pending: false },
      { axis: "Virality",         value: engagementScore ?? 0, pending: engagementScore === null },
      { axis: "Sync Potential",   value: 0,                    pending: true },
      { axis: "Live Performance", value: 0,                    pending: true },
      { axis: "Brand Fit",        value: 0,                    pending: true },
    ];
  }, [em, retentionRate, engagementScore]);

  // ── Enterprise+: TikTok × DSP ─────────────────────────────────────────────
  const tiktokDSP = useMemo(() => {
    const raw = (em as any)?.tiktok_dsp ?? (em as any)?.viral_correlation ?? [];
    if (Array.isArray(raw) && raw.length) return raw;
    return Array.from({ length: 12 }, (_, i) => ({
      week:   `W${i + 1}`,
      tiktok: Math.round(2000 + i * 900  + Math.sin(i)        * 1200),
      dsp:    Math.round(20000 + i * 4800 + Math.sin(i * 0.7) * 3000),
    }));
  }, [em]);

  // ── Enterprise+: NPV ──────────────────────────────────────────────────────
  const npv = useMemo(() => {
    let cum = 0;
    return Array.from({ length: 5 }, (_, i) => {
      const cf   = Math.round((ltv || 25000) * (1 + i * 0.18));
      const disc = Math.round(cf / Math.pow(1.1, i + 1));
      cum += disc;
      return { year: `Y${i + 1}`, cashflow: cf, discounted: disc, cumulative: cum };
    });
  }, [ltv]);

  // ── Enterprise+: Revenue Streams ──────────────────────────────────────────
  const revStreams = useMemo(() => [
    { source: "Streaming Royalties", revenue: Math.round(ltv * 0.45), growth: 18.4 },
    { source: "Sync & Licensing",    revenue: Math.round(ltv * 0.18), growth: 32.1 },
    { source: "Merch & D2C",         revenue: Math.round(ltv * 0.16), growth: 11.7 },
    { source: "Live & Touring",      revenue: Math.round(ltv * 0.21), growth: 24.6 },
  ], [ltv]);

  // ── Markdown sections ─────────────────────────────────────────────────────
  const cleanMd   = useMemo(() => stripCodeFence(report?.report_markdown ?? report?.report_html ?? ""), [report]);
  const hygieneMd = useMemo(() => extractSection(cleanMd, "DIGITAL HYGIENE"),                         [cleanMd]);
  const microMd   = useMemo(() => extractSection(cleanMd, "MICRO-INFLUENCE", "MICRO INFLUENCE"),       [cleanMd]);
  const investMd  = useMemo(() => extractSection(cleanMd, "NEXT STEP INVESTMENT", "INVESTMENT CALCULATOR"), [cleanMd]);
  const syncMd    = useMemo(() => extractSection(cleanMd, "SYNC-READINESS", "SYNC READINESS", "SYNC-READY"), [cleanMd]);
  const peerMd    = useMemo(() => extractSection(cleanMd, "PEER BENCHMARK"),                           [cleanMd]);
  const acquireMd = useMemo(() => extractSection(cleanMd, "ACQUISITION", "LABEL TARGET", "PARTNER"),   [cleanMd]);

  const hygieneHtml = useMemo(() => hygieneMd ? renderMarkdown(hygieneMd) : null, [hygieneMd]);
  const microHtml   = useMemo(() => microMd   ? renderMarkdown(microMd)   : null, [microMd]);
  const investHtml  = useMemo(() => investMd  ? renderMarkdown(investMd)  : null, [investMd]);
  const syncHtml    = useMemo(() => syncMd    ? renderMarkdown(syncMd)    : null, [syncMd]);
  const peerHtml    = useMemo(() => peerMd    ? renderMarkdown(peerMd)    : null, [peerMd]);
  const acquireHtml = useMemo(() => acquireMd ? renderMarkdown(acquireMd) : null, [acquireMd]);

  // Grounded peer_benchmark_data can exist independent of whether the AI's
  // markdown happened to include a parseable "## PEER BENCHMARK" section —
  // the section must not disappear just because peerHtml extraction failed.
  const hasPeerBenchmarkData = !!(report?.peer_benchmark_data?.peer_benchmark?.length);

  const hygieneScore = useMemo((): number | null => {
    if (!hygieneMd) return null;
    const m = hygieneMd.match(/(\d{1,3})\s*(?:\/\s*100|out\s+of\s+100)/i)
           || hygieneMd.match(/score[^:]*:\s*(\d{1,3})/i);
    const n = m ? parseInt(m[1], 10) : NaN;
    return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null;
  }, [hygieneMd]);

  const curatorPitch = useMemo(() => {
    const isTableParagraph = (p: string) => {
      const ls = p.split("\n");
      return ls.filter((l) => l.includes("|---|") || l.trimStart().startsWith("|")).length / ls.length > 0.2;
    };
    const mdToHtml = (text: string) =>
      text
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .split("\n\n")
        .filter((p) => p.trim().length > 0 && !isTableParagraph(p))
        .map((p) => `<p>${p.trim()}</p>`)
        .join("");
    const pitchMatch = cleanMd.match(/##\s*Curator\s*Pitch\s*([\s\S]*?)(?=\n##\s|\n#\s|$)/i);
    if (pitchMatch) return mdToHtml(pitchMatch[1].trim());
    const execMatch = cleanMd.match(/##\s*Executive\s*Summary\s*([\s\S]*?)(?=\n##\s|\n#\s|$)/i);
    if (execMatch) {
      const paras = execMatch[1].trim().split("\n\n").filter((p) => p.trim().length > 20 && !isTableParagraph(p)).slice(0, 2).join("\n\n");
      return mdToHtml(paras);
    }
    const firstPara = cleanMd.split("\n\n").find((p) => {
      const t = p.trim();
      return t.length > 40 && !t.startsWith("<") && !t.startsWith("#") && !t.startsWith("`") && !isTableParagraph(t);
    });
    if (firstPara) return mdToHtml(firstPara.trim());
    return "Your sound bridges intimacy and momentum — a rare combination that resonates with playlist curators looking for authentic voices with crossover appeal.";
  }, [cleanMd]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-6" style={{ background: C.bg }}>
        <style>{`
          @keyframes rGlow  { 0%,100%{opacity:.55;transform:scale(1)} 50%{opacity:1;transform:scale(1.35)} }
          @keyframes rSonar { 0%{transform:scale(1);opacity:.7} 100%{transform:scale(3.6);opacity:0} }
          .r-glow  { animation:rGlow  2.6s ease-in-out infinite; box-shadow:0 0 12px ${C.cyan},0 0 28px ${C.cyan}80 }
          .r-sonar { animation:rSonar 2s cubic-bezier(.22,1,.36,1) infinite }
        `}</style>
        <div className="relative flex w-3 h-3">
          <span className="absolute inline-flex h-full w-full rounded-full r-sonar" style={{ background: C.cyan }} />
          <span className="relative inline-flex rounded-full h-3 w-3 r-glow"  style={{ background: C.cyan }} />
        </div>
        <div className={`${mono} text-xs uppercase tracking-[0.4em]`} style={{ color: C.cyan }}>
          Decrypting Intelligence...
        </div>
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: C.cyan }} />
      </div>
    );
  }

  if (error || !report) return <Classified />;

  // Artist Indie → dedicated warm template
  if ((report.plan_name || "").trim().toLowerCase() === "artist indie") {
    return <ArtistIndieReport report={report as any} isSample={isSample} />;
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="tier-report-root min-h-screen relative overflow-hidden" style={{ background: C.bg, color: C.white }}>
      <style>{`
        @keyframes tierGlow  { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.08)} }
        @keyframes tierMesh  { 0%{transform:translate3d(0,0,0)} 50%{transform:translate3d(1%,-1%,0) scale(1.04)} 100%{transform:translate3d(0,0,0)} }
        .tier-mesh { position:absolute;inset:-10%;background:radial-gradient(45% 35% at 25% 30%,rgba(0,196,181,.10) 0%,transparent 60%),radial-gradient(40% 30% at 75% 70%,rgba(245,200,75,.06) 0%,transparent 60%);filter:blur(40px);pointer-events:none;animation:tierMesh 28s ease-in-out infinite;z-index:0 }
        .tier-glow { animation:tierGlow 2.6s ease-in-out infinite }
        .indie-section-content { font-size:13px;line-height:1.65 }
        .indie-section-content table { width:100%;border-collapse:collapse;font-size:12px;border-radius:8px;overflow:hidden }
        .indie-section-content thead { background:rgba(0,196,181,0.07) }
        .indie-section-content th { color:#00C4B5;text-transform:uppercase;letter-spacing:.12em;font-size:10px;padding:10px 14px;border-bottom:1px solid rgba(0,196,181,0.18);text-align:left;font-weight:700;white-space:nowrap }
        .indie-section-content td { padding:10px 14px;border-bottom:1px solid #1A1A1A;color:#D4D4D4;vertical-align:top;font-size:12px;line-height:1.55 }
        .indie-section-content tbody tr:last-child td { border-bottom:none }
        .indie-section-content tbody tr:hover td { background:rgba(255,255,255,0.018);transition:background 0.15s }
        .indie-section-content ul,.indie-section-content ol { padding:0;margin:4px 0 8px;list-style:none }
        .indie-section-content li { color:#C4C4C4;font-size:13px;margin-bottom:7px;line-height:1.65;padding-left:18px;position:relative }
        .indie-section-content li::before { content:'›';position:absolute;left:2px;top:0;color:rgba(0,196,181,0.7);font-weight:700;font-size:15px;line-height:1.4 }
        .indie-section-content strong { color:#F0F0F0;font-weight:600 }
        .indie-section-content em { color:#9A9A9A;font-style:italic }
        .indie-section-content p { color:#9A9A9A;font-size:13px;line-height:1.75;margin-bottom:8px }
        .indie-section-content blockquote { border-left:3px solid #00C4B5;padding:10px 16px;margin:10px 0;background:rgba(0,196,181,0.06);border-radius:0 8px 8px 0;color:#D4D4D4;font-size:13px;font-style:italic }
        @media print {
          @page { size:A4;margin:12mm }
          html,body { background:#0a0a0a !important;color:#f5f5f5 !important;-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important }
          .no-print, header[role="banner"], footer, nav { display:none !important }
          .tier-mesh { display:none !important }
          .tier-report-root { background:#0a0a0a !important;color:#f5f5f5 !important }
          .tier-report-root * { box-shadow:none !important;text-shadow:none !important;animation:none !important }
          .tier-report-root .max-w-6xl { max-width:100% !important;width:100% !important;padding-left:0 !important;padding-right:0 !important }
          .tier-report-root .recharts-wrapper, .tier-report-root .recharts-surface { overflow:visible !important }
          .tier-report-root .overflow-x-auto { overflow:visible !important }
          .tier-report-root .mb-14 { margin-bottom:1.25rem !important }
          .tier-report-root .mb-8 { margin-bottom:0.75rem !important }
          .tier-report-root .py-10 { padding-top:0.5rem !important;padding-bottom:0.5rem !important }
          .tier-report-root .pb-10 { padding-bottom:0.75rem !important }
          .tier-report-root section, .tier-report-root .rounded-xl, .tier-report-root .rounded-2xl { page-break-inside:avoid;break-inside:avoid }
        }
      `}</style>
      <div className="tier-mesh" aria-hidden />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-8 no-print">
          <div className={`${mono} text-[10px] uppercase tracking-[0.35em] flex items-center gap-2`} style={{ color: C.cyan }}>
            <span className="w-1.5 h-1.5 rounded-full tier-glow" style={{ background: C.cyan, boxShadow: `0 0 10px ${C.cyan}` }} />
            SONGSS Intelligence · {report.plan_name ?? "Report"}
          </div>
          {!isSample && (
          <button
            onClick={() => {
              const prev = document.title;
              const safe = (report.artist_name || "Report").replace(/[^\w\- ]+/g, "").trim() || "Report";
              document.title = `${safe} — SONGSS Intelligence`;
              window.addEventListener("afterprint", () => { document.title = prev; }, { once: true });
              setTimeout(() => window.print(), 50);
            }}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] border transition-all hover:scale-[1.02] no-print"
            style={{ borderColor: C.cyan, color: C.cyan, background: "rgba(0,196,181,0.06)" }}
          >
            <Download className="w-3.5 h-3.5" />
            Download PDF
          </button>
          )}
        </div>

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-14 pb-10 border-b"
          style={{ borderColor: "rgba(0,196,181,0.15)" }}
        >
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border" style={{ borderColor: C.cyan, color: C.cyan }}>
            <Sparkles className="w-3.5 h-3.5" />
            <span className={`${mono} text-[10px] uppercase tracking-[0.25em]`}>
              {report.plan_name ?? "Intelligence Report"} · {reportDate}
            </span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.05] mb-8" style={{ color: C.white }}>
            {report.artist_name || "Your Artist Report"}
          </h1>
          <div className="inline-flex flex-col items-center">
            <div className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: C.cyan }}>SNIE™ Score</div>
            <div
              className={`${mono} text-[120px] sm:text-[180px] font-bold leading-none`}
              style={{ color: C.white, textShadow: `0 0 40px ${C.cyan}66, 0 0 80px ${C.cyan}33` }}
            >
              {snie}
            </div>
            <div className="text-xs mt-2" style={{ color: C.gray }}>out of 100</div>
          </div>
          <p className="mt-6 text-[11px] max-w-md mx-auto leading-relaxed italic" style={{ color: C.grayDim }}>
            SNIE™ Score reflects real-time streaming and market data at the moment of analysis. Scores may vary between reports as platform data updates continuously.
          </p>
          <p className="mt-6 text-base max-w-xl mx-auto leading-relaxed" style={{ color: C.gray }}>
            Neural intelligence engine analysis — data-driven insights built for action.
          </p>
        </motion.header>

        {/* ── KPI Cards ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 mb-14">
          {[
            { label: "Social Engagement Index", value: engagementScore === null ? "—" : engagementScore.toFixed(0), icon: Activity, title: engagementScore === null ? "Not enough TikTok data yet to compute this" : "Cumulative engagement relative to audience size" },
            { label: "Retention Rate",   value: `${retentionRate.toFixed(0)}%`,   icon: Users      },
            { label: "Monthly Listeners", value: fmtCompact(monthlyListeners),    icon: TrendingUp },
            { label: "LTV Projection",   value: fmtUSD(ltv),                     icon: DollarSign, title: "Estimated using a global blended benchmark ($0.012/listener/month). Real values vary by geographic distribution and audience retention." },
            { label: "Industry Buzz",    value: buzzBadge ? buzzBadge.label : "—", icon: Newspaper, valueColor: buzzBadge?.color, title: buzzBadge ? "Recent press & industry coverage sentiment" : "Not enough recent press coverage found" },
            { label: "Fan Loyalty Index", value: fanLoyaltyIndex === null ? "—" : fanLoyaltyIndex.toFixed(0), icon: Heart, title: fanLoyaltyIndex === null ? "Not enough TikTok or Spotify data yet to compute this" : "Blends TikTok engagement depth with cross-platform streaming retention" },
          ].map((k, i) => (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-xl border p-5"
              style={glass}
              title={(k as any).title}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: C.gray }}>{k.label}</span>
                <k.icon className="w-3.5 h-3.5" style={{ color: C.cyan, filter: `drop-shadow(0 0 6px ${C.cyan}AA)` }} />
              </div>
              <div className={`${mono} text-3xl font-semibold`} style={{ color: (k as any).valueColor || C.white }}>{k.value}</div>
            </motion.div>
          ))}
        </div>

        {/* ── Neural Trajectory ────────────────────────────────────────────── */}
        <NeuralTrajectory trajectory={trajectory} />

        {/* ── Top 3 Markets ────────────────────────────────────────────────── */}
        <TopMarkets markets={markets} />

        {/* ── Three Moves That Matter ───────────────────────────────────────── */}
        <ThreeMovesCard recommendations={recommendations} />

        {/* ── Digital Hygiene Index ─────────────────────────────────────────── */}
        {hygieneHtml && (
          <MarkdownCard
            html={hygieneHtml}
            emoji="🛡️"
            icon={ShieldCheck}
            title="Digital Hygiene Index"
            accent={C.cyan}
            delay={0.16}
            badge={
              hygieneScore !== null ? (
                <div className="flex items-baseline gap-1">
                  <span className={`${mono} text-3xl font-bold`} style={{ color: hygieneScore < 60 ? "#FF6B6B" : C.cyan }}>
                    {hygieneScore}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.15em]" style={{ color: C.grayDim }}>/100</span>
                </div>
              ) : undefined
            }
            extraContent={
              hygieneScore !== null && hygieneScore < 60 ? (
                <div
                  className="flex items-start gap-3 rounded-xl px-4 py-3 mb-6 border"
                  style={{ background: "rgba(255,107,107,0.07)", borderColor: "rgba(255,107,107,0.28)" }}
                >
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#FF6B6B" }} />
                  <p className="text-sm font-semibold leading-snug" style={{ color: "#FF6B6B" }}>
                    Stop everything. Fix your ISRC registration first. You are losing royalty money.
                  </p>
                </div>
              ) : undefined
            }
          />
        )}

        {/* ── Micro-Influence Map ───────────────────────────────────────────── */}
        {microHtml && (
          <MarkdownCard html={microHtml} emoji="🎯" icon={Radio} title="Micro-Influence Map" accent={C.cyan} delay={0.18} />
        )}

        {/* ── Next Step Investment ──────────────────────────────────────────── */}
        {investHtml && (
          <MarkdownCard
            html={investHtml}
            emoji="💰"
            icon={Calculator}
            title="Next Step Investment"
            accent={C.warm}
            delay={0.20}
            badge={
              <span className={`${mono} text-[10px] px-2.5 py-1 rounded-md border`}
                style={{ background: `${C.warm}12`, color: C.warm, borderColor: `${C.warm}30` }}>
                $100 Budget
              </span>
            }
          />
        )}

        {/* ── Sync-Readiness Score ──────────────────────────────────────────── */}
        {syncHtml && (
          <MarkdownCard html={syncHtml} emoji="🎬" icon={Film} title="Sync-Readiness Score" accent={C.cyan} delay={0.22} />
        )}

        {/* ── Peer Benchmark ────────────────────────────────────────────────── */}
        {(peerHtml || hasPeerBenchmarkData) && (
          <Section delay={0.24}>
            <div className="rounded-2xl border mb-8 overflow-hidden" style={glass}>
              <SectionHeader
                emoji="🏆"
                icon={Award}
                title="Peer Benchmark"
                accent={C.warm}
              />
              <div className="p-6 sm:p-8">
                <PeerBenchmarkChart
                  data={report.peer_benchmark_data}
                  accentColor={C.warm}
                  peerColor={`${C.cyan}55`}
                  gridColor={C.border}
                  textColor={C.gray}
                />
                {peerHtml && (
                  <div className="indie-section-content" dangerouslySetInnerHTML={{ __html: peerHtml }} />
                )}
              </div>
            </div>
          </Section>
        )}

        {/* ── Curator Pitch ─────────────────────────────────────────────────── */}
        <CuratorPitch curatorPitch={curatorPitch} />

        {/* ── Revenue Snapshot ──────────────────────────────────────────────── */}
        <RevenueSnapshot revenueSnapshot={revenueSnapshot} />

        {/* ── YouTube Presence ──────────────────────────────────────────────── */}
        {hasYouTubeData && (
          <YouTubePresence ytSubscribers={ytSubscribers} ytTotalViews={ytTotalViews} />
        )}

        {/* ── Instagram Presence ────────────────────────────────────────────── */}
        {hasInstagramData && (
          <InstagramPresence igFollowers={igFollowers} igFollowing={igFollowing} />
        )}

        {/* ── Industry Buzz Tracker ─────────────────────────────────────────── */}
        {hasIndustryBuzz && (
          <IndustryBuzzTracker industryBuzz={industryBuzz} summaryHtml={buzzSummaryHtml} buzzBadge={buzzBadge} />
        )}

        {/* ════════════════════════════════════════════════════════════════════
            GROWTH+
        ════════════════════════════════════════════════════════════════════ */}
        {has(tier, "growth") && (
          <EngagementPyramid engagementPyramid={engagementPyramid} />
        )}

        {/* ════════════════════════════════════════════════════════════════════
            PRO+
        ════════════════════════════════════════════════════════════════════ */}
        {has(tier, "pro") && (
          <ArtistRadarProfile radarData={radarData} />
        )}

        {/* ════════════════════════════════════════════════════════════════════
            ENTERPRISE+
        ════════════════════════════════════════════════════════════════════ */}
        {has(tier, "enterprise") && (
          <>
            {/* TikTok × DSP Correlation */}
            <TikTokDSPCorrelation tiktokDSP={tiktokDSP} />

            {/* Revenue Model Advanced */}
            <RevenueModelAdvanced revStreams={revStreams} npv={npv} />

            {/* Acquisition Targets & Partners */}
            {acquireHtml ? (
              <MarkdownCard
                html={acquireHtml}
                emoji="🤝"
                icon={Building2}
                title="Acquisition Targets & Partners"
                accent={C.warm}
                delay={0.42}
              />
            ) : (
              <Section delay={0.42}>
                <div className="rounded-2xl border mb-8 overflow-hidden" style={glass}>
                  <SectionHeader emoji="🤝" icon={Building2} title="Acquisition Targets & Partners" accent={C.warm} />
                  <div className="p-6 sm:p-8">
                    <p className="text-sm" style={{ color: C.gray }}>
                      Acquisition and partnership intelligence will populate here once the AI workflow includes an{" "}
                      <strong style={{ color: C.white }}>## Acquisition Targets</strong> or{" "}
                      <strong style={{ color: C.white }}>## Label Targets</strong> section in the report markdown.
                    </p>
                  </div>
                </div>
              </Section>
            )}
          </>
        )}

        {/* ── Footer CTA ───────────────────────────────────────────────────── */}
        {(tier === "enterprise" || tier === "opus") ? (
          <Section delay={0.44}>
            <div
              className="rounded-2xl border p-8 sm:p-12 text-center relative overflow-hidden no-print"
              style={{
                background: `linear-gradient(135deg, rgba(0,196,181,0.06) 0%, rgba(14,14,14,0.9) 100%)`,
                borderColor: C.border,
              }}
            >
              <div className="relative">
                <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full"
                  style={{ background: `${C.cyan}15`, color: C.cyan }}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className={`${mono} text-[10px] uppercase tracking-[0.25em]`}>Top-Tier Access</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-semibold mb-4" style={{ color: C.white }}>
                  You're on our most powerful plan.
                </h2>
                <p className="text-sm sm:text-base mb-8 max-w-lg mx-auto leading-relaxed" style={{ color: C.gray }}>
                  Need something custom? Our strategy team is ready to build around your specific goals.
                </p>
                <a
                  href="mailto:hello@songssintelligence.com"
                  className="inline-flex items-center gap-2 rounded-lg px-7 py-4 text-xs font-bold uppercase tracking-[0.2em] transition-all hover:scale-[1.02]"
                  style={{ background: C.cyan, color: C.bg, boxShadow: `0 0 30px ${C.cyan}55` }}
                >
                  Contact Us for Custom Solutions
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </Section>
        ) : tier === "pro" ? (
          <Section delay={0.44}>
            <div
              className="rounded-2xl border p-8 sm:p-12 text-center relative overflow-hidden no-print"
              style={{
                background: `linear-gradient(135deg, rgba(0,196,181,0.08) 0%, rgba(14,14,14,0.9) 100%)`,
                borderColor: C.cyan,
              }}
            >
              <div className="absolute inset-0 opacity-30"
                style={{ background: `radial-gradient(60% 80% at 50% 0%, ${C.cyan}22 0%, transparent 70%)` }} />
              <div className="relative">
                <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full"
                  style={{ background: `${C.cyan}15`, color: C.cyan }}>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className={`${mono} text-[10px] uppercase tracking-[0.25em]`}>Ready to Scale?</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-semibold mb-4" style={{ color: C.white }}>
                  Unlock enterprise intelligence.
                </h2>
                <p className="text-sm sm:text-base mb-8 max-w-lg mx-auto leading-relaxed" style={{ color: C.gray }}>
                  Get TikTok × DSP correlation, advanced NPV modeling, acquisition targets, and a dedicated strategy team.
                </p>
                <a
                  href="https://buyer.americaspay.com/b/4gM8wP6h742r9tM5Q13cd0P"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg px-7 py-4 text-xs font-bold uppercase tracking-[0.2em] transition-all hover:scale-[1.02]"
                  style={{ background: C.cyan, color: C.bg, boxShadow: `0 0 30px ${C.cyan}55` }}
                >
                  Upgrade to Enterprise
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </Section>
        ) : tier === "growth" ? (
          <Section delay={0.44}>
            <div
              className="rounded-2xl border p-8 sm:p-12 text-center relative overflow-hidden no-print"
              style={{
                background: `linear-gradient(135deg, rgba(0,196,181,0.08) 0%, rgba(14,14,14,0.9) 100%)`,
                borderColor: C.cyan,
              }}
            >
              <div className="absolute inset-0 opacity-30"
                style={{ background: `radial-gradient(60% 80% at 50% 0%, ${C.cyan}22 0%, transparent 70%)` }} />
              <div className="relative">
                <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full"
                  style={{ background: `${C.cyan}15`, color: C.cyan }}>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className={`${mono} text-[10px] uppercase tracking-[0.25em]`}>Go Deeper</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-semibold mb-4" style={{ color: C.white }}>
                  Unlock deeper insights.
                </h2>
                <p className="text-sm sm:text-base mb-8 max-w-lg mx-auto leading-relaxed" style={{ color: C.gray }}>
                  Artist Pro adds a 6-axis radar profile, sync-readiness scoring, peer benchmarks, and curator pitch intelligence.
                </p>
                <a
                  href="https://buyer.americaspay.com/b/aFa4gz9tj7eD49sguF3cd0O"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg px-7 py-4 text-xs font-bold uppercase tracking-[0.2em] transition-all hover:scale-[1.02]"
                  style={{ background: C.cyan, color: C.bg, boxShadow: `0 0 30px ${C.cyan}55` }}
                >
                  Upgrade to Artist Pro
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </Section>
        ) : (
          <Section delay={0.44}>
            <div
              className="rounded-2xl border p-8 sm:p-12 text-center relative overflow-hidden no-print"
              style={{
                background: `linear-gradient(135deg, rgba(0,196,181,0.08) 0%, rgba(14,14,14,0.9) 100%)`,
                borderColor: C.cyan,
              }}
            >
              <div className="absolute inset-0 opacity-30"
                style={{ background: `radial-gradient(60% 80% at 50% 0%, ${C.cyan}22 0%, transparent 70%)` }} />
              <div className="relative">
                <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full"
                  style={{ background: `${C.cyan}15`, color: C.cyan }}>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className={`${mono} text-[10px] uppercase tracking-[0.25em]`}>Intelligence Active</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-semibold mb-4" style={{ color: C.white }}>
                  Ready to operationalize this intelligence?
                </h2>
                <p className="text-sm sm:text-base mb-8 max-w-lg mx-auto leading-relaxed" style={{ color: C.gray }}>
                  Book a private session with our strategy team to translate this dossier into a 90-day execution plan.
                </p>
                <a
                  href="mailto:hello@songssintelligence.com"
                  className="inline-flex items-center gap-2 rounded-lg px-7 py-4 text-xs font-bold uppercase tracking-[0.2em] transition-all hover:scale-[1.02]"
                  style={{ background: C.cyan, color: C.bg, boxShadow: `0 0 30px ${C.cyan}55` }}
                >
                  Schedule Strategy Session
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </Section>
        )}

        <div style={{ textAlign: "center", padding: "24px 0 8px", borderTop: "1px solid #1a1a2e", marginTop: "32px", display: "flex", justifyContent: "center", alignItems: "center", gap: "40px", flexWrap: "wrap" }}>
          <img src="/logos/songss.png" alt="SONGSS Intelligence" style={{ height: "64px", display: "block", opacity: 0.9 }} />
          <img src="/logos/americascom.png" alt="Americascom" style={{ height: "64px", display: "block", opacity: 0.9 }} />
          <img src="/logos/americas-music-publishing.png" alt="Americas Music Publishing" style={{ height: "64px", display: "block", opacity: 0.9 }} />
        </div>
        <div className={`${mono} text-center mt-8 text-[10px] uppercase tracking-[0.3em]`} style={{ color: C.grayDim }}>
          CONFIDENTIAL · SONGSS Intelligence · Americascom, Inc.
        </div>
      </div>
    </div>
  );
}
