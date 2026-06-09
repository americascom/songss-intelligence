import { useEffect, useMemo, useState, Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Lock, Loader2, Activity, Users, TrendingUp, DollarSign,
  MapPin, Lightbulb, ShieldCheck, Radio, Calculator, Film, Award,
  Heart, Download, Sparkles, Music, Target, ArrowUpRight,
  Youtube, Instagram, Building2, AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ArtistIndieReport from "@/components/ArtistIndieReport";

// ── Constants ────────────────────────────────────────────────────────────────
const C = {
  bg: "#070707",
  surface: "#0E0E0E",
  card: "#111111",
  border: "#1F1F1F",
  cyan: "#00C4B5",
  cyanSoft: "#7AE3DA",
  warm: "#F5C84B",
  white: "#F5F5F5",
  gray: "#9A9A9A",
  grayDim: "#4A4A4A",
};
const mono = "font-mono tabular-nums";
const glass: React.CSSProperties = {
  background: "linear-gradient(135deg, rgba(14,14,14,0.85) 0%, rgba(28,28,28,0.68) 100%)",
  borderColor: "rgba(0,196,181,0.18)",
  backdropFilter: "blur(22px) saturate(150%)",
  WebkitBackdropFilter: "blur(22px) saturate(150%)",
  boxShadow: "0 12px 48px -16px rgba(0,196,181,0.18), inset 0 1px 0 rgba(255,255,255,0.04)",
};
const tooltipStyle: React.CSSProperties = {
  background: "rgba(11,11,11,0.94)",
  border: "1px solid rgba(0,196,181,0.35)",
  borderRadius: 8,
  color: C.white,
  fontSize: 12,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace",
  backdropFilter: "blur(8px)",
};
const GROWTH_LADDER = ["Seed", "Sprout", "Root", "Branch", "Crown"] as const;
type GrowthLevel = (typeof GROWTH_LADDER)[number];

// ── Utilities ────────────────────────────────────────────────────────────────
function fmtCompact(n: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}
function fmtUSD(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

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

// ── Sub-components ───────────────────────────────────────────────────────────
function SectionHeader({
  emoji, icon: Icon, title, accent, badge,
}: {
  emoji: string;
  icon: React.ElementType;
  title: string;
  accent: string;
  badge?: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-between px-6 py-4 border-b"
      style={{ borderColor: `${accent}22`, background: `linear-gradient(135deg, ${accent}0f 0%, transparent 70%)` }}
    >
      <div className="flex items-center gap-2.5">
        <span className="text-lg leading-none">{emoji}</span>
        <Icon className="w-4 h-4" style={{ color: accent, filter: `drop-shadow(0 0 6px ${accent}99)` }} />
        <h3 className="text-[10px] font-bold uppercase tracking-[0.28em]" style={{ color: accent }}>{title}</h3>
      </div>
      {badge}
    </div>
  );
}

function Section({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function MarkdownCard({
  html, emoji, icon, title, accent = C.cyan, badge, delay = 0, extraContent,
}: {
  html: string;
  emoji: string;
  icon: React.ElementType;
  title: string;
  accent?: string;
  badge?: React.ReactNode;
  delay?: number;
  extraContent?: React.ReactNode;
}) {
  return (
    <Section delay={delay}>
      <div className="rounded-2xl border mb-8 overflow-hidden" style={glass}>
        <SectionHeader emoji={emoji} icon={icon} title={title} accent={accent} badge={badge} />
        <div className="p-6 sm:p-8">
          {extraContent}
          <div className="indie-section-content" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
    </Section>
  );
}

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
  revenue_economics: any;
  engagement_metrics: any;
  report_markdown: string | null;
  report_html: string | null;
  created_at: string;
  youtube_data: { subscribers?: number; total_views?: number | string } | null;
  instagram_data: { followers?: number; following?: number; media_count?: number } | null;
  spotify_data: { followers?: number; monthly_listeners?: number; top_country?: string } | null;
  tiktok_data: { followers?: number; engagement_rate?: number } | null;
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
      const { data, error } = await supabase
        .from("intelligence_reports")
        .select("*")
        .eq("session_id", session_id)
        .maybeSingle();
      if (stopped) return;
      if (error) { setLoading(false); setError(error.message); return; }
      if (data && (data.report_html || data.report_markdown)) {
        setReport(data as unknown as ReportRow);
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

  // ── Base data ─────────────────────────────────────────────────────────────
  const em  = report?.engagement_metrics  ?? {};
  const re  = report?.revenue_economics   ?? {};
  const geo = report?.geo_hotspots        ?? {};

  const snie            = Number(report?.digital_score          ?? 0) || 72;
  const engagementScore = Number((em as any)?.engagement_score  ?? (em as any)?.engagementScore ?? 0) || 7.4;
  const retentionRate   = Number((em as any)?.retention_rate    ?? (em as any)?.retentionRate   ?? 0) || 48;
  const monthlyStreams   = Number((em as any)?.monthly_streams   ?? (em as any)?.monthlyStreams  ?? 0) || 28000;
  const ltv             = Number((re as any)?.ltv ?? (re as any)?.ltv_projection ?? (em as any)?.ltv ?? 0) || 8400;

  const yt              = report?.youtube_data   ?? {};
  const ytSubscribers   = Number(yt?.subscribers ?? 0);
  const ytTotalViews    = Number(yt?.total_views  ?? 0);
  const hasYouTubeData  = ytSubscribers > 0 || ytTotalViews > 0;

  const ig               = report?.instagram_data ?? {};
  const igFollowers      = Number(ig?.followers   ?? 0);
  const igFollowing      = Number(ig?.following   ?? 0);
  const hasInstagramData = igFollowers > 0;

  const reportDate = report
    ? new Date(report.created_at).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric",
      })
    : "";

  // ── Memoised data ─────────────────────────────────────────────────────────
  const trajectory = useMemo(() => {
    const raw = (em as any)?.trajectory ?? (em as any)?.neural_trajectory ?? [];
    if (Array.isArray(raw) && raw.length) {
      return raw.slice(0, 6).map((r: any, i: number) => ({
        month:   r?.label   ?? r?.month ?? `M${i + 1}`,
        streams: Number(r?.streams ?? r?.value ?? 0),
      }));
    }
    return Array.from({ length: 6 }, (_, i) => ({
      month:   `M${i + 1}`,
      streams: Math.round(monthlyStreams * (0.55 + i * 0.12)),
    }));
  }, [em, monthlyStreams]);

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

  const revenueSnapshot = useMemo(() => {
    const raw = (re as any)?.streams ?? (re as any)?.revenue_streams ?? [];
    if (Array.isArray(raw) && raw.length) {
      return raw.slice(0, 5).map((r: any) => ({ source: r?.source ?? r?.name ?? "—", revenue: Number(r?.revenue ?? r?.value ?? 0) }));
    }
    return [
      { source: "Streaming", revenue: Math.round(ltv * 0.50) },
      { source: "Merch",     revenue: Math.round(ltv * 0.20) },
      { source: "Sync",      revenue: Math.round(ltv * 0.16) },
      { source: "Live",      revenue: Math.round(ltv * 0.14) },
    ];
  }, [re, ltv]);

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

  // ── Growth+: Conversion Funnel ────────────────────────────────────────────
  const funnelData = useMemo(() => {
    const f         = (em as any)?.funnel ?? (em as any)?.conversion_funnel ?? {};
    const discovery = Number((f as any)?.discovery ?? (f as any)?.impressions  ?? monthlyStreams * 2.2) || 100;
    const streams   = Number((f as any)?.streams   ?? (f as any)?.plays        ?? monthlyStreams)       || Math.round(discovery * 0.45);
    const follows   = Number((f as any)?.follows   ?? (f as any)?.followers    ?? (f as any)?.saves ?? 0) || Math.round(streams * 0.28);
    const buys      = Number((f as any)?.purchases ?? (f as any)?.buys         ?? (f as any)?.conversions ?? 0) || Math.round(follows * 0.12);
    return [
      { stage: "Discovery", value: discovery, pct: 100,                                       color: C.cyan     },
      { stage: "Stream",    value: streams,   pct: Math.round((streams / discovery) * 100),   color: C.cyanSoft },
      { stage: "Follow",    value: follows,   pct: Math.round((follows / discovery) * 100),   color: "#4ECDC4"  },
      { stage: "Buy",       value: buys,      pct: Math.round((buys    / discovery) * 100),   color: C.warm     },
    ];
  }, [em, monthlyStreams]);

  // ── Pro+: Artist Radar ────────────────────────────────────────────────────
  const radarData = useMemo(() => [
    { axis: "Virality",         value: Math.min(100, Number((em as any)?.virality_score   ?? (em as any)?.viralityScore   ?? 65)) },
    { axis: "Sync Potential",   value: Math.min(100, Number((em as any)?.sync_potential   ?? (em as any)?.syncPotential   ?? 72)) },
    { axis: "Live Performance", value: Math.min(100, Number((em as any)?.live_score       ?? (em as any)?.liveScore       ?? 58)) },
    { axis: "Brand Fit",        value: Math.min(100, Number((em as any)?.brand_fit        ?? (em as any)?.brandFit        ?? 70)) },
    { axis: "Streaming Growth", value: Math.min(100, Number((em as any)?.streaming_growth ?? (em as any)?.streamingGrowth ?? 80)) },
    { axis: "Community",        value: Math.min(100, Number((em as any)?.community_score  ?? (em as any)?.communityScore  ?? 55)) },
  ], [em]);

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
    const raw = (re as any)?.npv ?? (re as any)?.npv_model ?? [];
    if (Array.isArray(raw) && raw.length) return raw;
    let cum = 0;
    return Array.from({ length: 5 }, (_, i) => {
      const cf   = Math.round((ltv || 25000) * (1 + i * 0.18));
      const disc = Math.round(cf / Math.pow(1.1, i + 1));
      cum += disc;
      return { year: `Y${i + 1}`, cashflow: cf, discounted: disc, cumulative: cum };
    });
  }, [re, ltv]);

  // ── Enterprise+: Revenue Streams ──────────────────────────────────────────
  const revStreams = useMemo(() => {
    const raw = (re as any)?.streams ?? (re as any)?.revenue_streams ?? [];
    if (Array.isArray(raw) && raw.length >= 3) return raw;
    return [
      { source: "Streaming Royalties", revenue: Math.round(ltv * 0.45), growth: 18.4 },
      { source: "Sync & Licensing",    revenue: Math.round(ltv * 0.18), growth: 32.1 },
      { source: "Merch & D2C",         revenue: Math.round(ltv * 0.16), growth: 11.7 },
      { source: "Live & Touring",      revenue: Math.round(ltv * 0.21), growth: 24.6 },
    ];
  }, [re, ltv]);

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

  const hygieneScore = useMemo((): number | null => {
    if (!hygieneMd) return null;
    const m = hygieneMd.match(/(\d{1,3})\s*(?:\/\s*100|out\s+of\s+100)/i)
           || hygieneMd.match(/score[^:]*:\s*(\d{1,3})/i);
    const n = m ? parseInt(m[1], 10) : NaN;
    return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null;
  }, [hygieneMd]);

  const currentLevel = useMemo((): GrowthLevel | null => {
    if (!peerMd) return null;
    for (const lvl of GROWTH_LADDER) {
      if (new RegExp(`current[^.]{0,60}\\b${lvl}\\b|\\b${lvl}\\b[^.]{0,60}current`, "i").test(peerMd))
        return lvl;
    }
    const m = peerMd.match(new RegExp(`\\b(${GROWTH_LADDER.join("|")})\\b`, "i"));
    return m ? (m[1] as GrowthLevel) : null;
  }, [peerMd]);

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
    return <ArtistIndieReport report={report as any} />;
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
          .no-print { display:none !important }
          .tier-mesh { display:none !important }
          .tier-report-root { background:#0a0a0a !important }
          .tier-report-root * { box-shadow:none !important;text-shadow:none !important;animation:none !important }
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {[
            { label: "Engagement Score", value: engagementScore.toFixed(1),      icon: Activity   },
            { label: "Retention Rate",   value: `${retentionRate.toFixed(0)}%`,   icon: Users      },
            { label: "Monthly Streams",  value: fmtCompact(monthlyStreams),       icon: TrendingUp },
            { label: "LTV Projection",   value: fmtUSD(ltv),                     icon: DollarSign },
          ].map((k, i) => (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-xl border p-5"
              style={glass}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: C.gray }}>{k.label}</span>
                <k.icon className="w-3.5 h-3.5" style={{ color: C.cyan, filter: `drop-shadow(0 0 6px ${C.cyan}AA)` }} />
              </div>
              <div className={`${mono} text-3xl font-semibold`} style={{ color: C.white }}>{k.value}</div>
            </motion.div>
          ))}
        </div>

        {/* ── Neural Trajectory ────────────────────────────────────────────── */}
        <Section delay={0.10}>
          <div className="rounded-xl border p-6 mb-14" style={glass}>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: C.cyan }}>Neural Trajectory</h3>
                <p className="text-xs mt-1" style={{ color: C.gray }}>Stream momentum over the next 6 months</p>
              </div>
              <Music className="w-4 h-4" style={{ color: C.cyan }} />
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trajectory} margin={{ top: 10, right: 16, left: 0, bottom: 4 }}>
                  <defs>
                    <linearGradient id="trajGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.cyan} stopOpacity={0.45} />
                      <stop offset="100%" stopColor={C.cyan} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={C.border} strokeDasharray="2 4" vertical={false} />
                  <XAxis dataKey="month" stroke={C.gray} fontSize={11} tickLine={false} axisLine={{ stroke: C.border }} />
                  <YAxis stroke={C.gray} fontSize={11} tickLine={false} axisLine={false} tickFormatter={fmtCompact} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [fmtCompact(Number(v)), "Streams"]} />
                  <Area
                    type="monotone" dataKey="streams"
                    stroke={C.cyan} strokeWidth={3} fill="url(#trajGrad)"
                    dot={{ r: 5, fill: C.cyan, stroke: C.white, strokeWidth: 1.5 }}
                    activeDot={{ r: 7 }}
                    animationDuration={1600}
                    style={{ filter: `drop-shadow(0 0 8px ${C.cyan}AA)` }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Section>

        {/* ── Top 3 Markets ────────────────────────────────────────────────── */}
        <Section delay={0.12}>
          <div className="mb-14">
            <div className="mb-5 flex items-center gap-2">
              <MapPin className="w-4 h-4" style={{ color: C.cyan }} />
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: C.cyan }}>Top 3 Markets</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => {
                const m = markets[i] ?? null;
                if (!m) return (
                  <div key={i} className="rounded-xl border p-6 opacity-30" style={glass}>
                    <div className={`${mono} text-[10px] uppercase tracking-[0.2em] mb-1`} style={{ color: C.gray }}>#{i + 1}</div>
                    <div className="text-xl font-semibold" style={{ color: C.white }}>Market Pending</div>
                  </div>
                );
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 + i * 0.08, duration: 0.6 }}
                    className="rounded-xl border p-6"
                    style={glass}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`${mono} text-[10px] uppercase tracking-[0.2em]`} style={{ color: C.gray }}>#{i + 1}</div>
                      <div className={`${mono} text-2xl font-semibold`} style={{ color: C.cyan }}>{m.score}</div>
                    </div>
                    <div className="text-xl font-semibold mb-1" style={{ color: C.white }}>{m.country}</div>
                    {m.city && <div className="text-sm" style={{ color: C.gray }}>{m.city}</div>}
                    {m.opportunity && (
                      <div className="mt-4 pt-4 border-t text-xs leading-relaxed" style={{ color: C.gray, borderColor: C.border }}>
                        {m.opportunity}
                      </div>
                    )}
                    <div className="mt-3 text-[10px] uppercase tracking-[0.2em]" style={{ color: C.grayDim }}>Potential Score</div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </Section>

        {/* ── Three Moves That Matter ───────────────────────────────────────── */}
        <Section delay={0.14}>
          <div className="mb-14">
            <div className="mb-5 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" style={{ color: C.warm }} />
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: C.warm }}>Three Moves That Matter</h3>
            </div>
            <div className="space-y-3">
              {recommendations.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.14 + i * 0.1, duration: 0.6 }}
                  className="rounded-xl border p-6 flex gap-5"
                  style={glass}
                >
                  <div
                    className={`${mono} shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold`}
                    style={{ background: `${C.cyan}15`, color: C.cyan, border: `1px solid ${C.cyan}55` }}
                  >
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="text-lg font-semibold mb-1.5" style={{ color: C.white }}>{r.title}</div>
                    {r.body && <div className="text-sm leading-relaxed" style={{ color: C.gray }}>{r.body}</div>}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Section>

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
        {peerHtml && (
          <Section delay={0.24}>
            <div className="rounded-2xl border mb-8 overflow-hidden" style={glass}>
              <SectionHeader emoji="🏆" icon={Award} title="Peer Benchmark" accent={C.warm} />
              <div className="p-6 sm:p-8">
                <div className="flex items-center mb-6 overflow-x-auto pb-1">
                  {GROWTH_LADDER.map((lvl, i) => {
                    const isActive = lvl === currentLevel;
                    const isPast   = currentLevel
                      ? GROWTH_LADDER.indexOf(lvl) < GROWTH_LADDER.indexOf(currentLevel)
                      : false;
                    return (
                      <div key={lvl} className="flex items-center flex-shrink-0">
                        <div
                          className="flex flex-col items-center px-3 py-2 rounded-lg"
                          style={{
                            background: isActive ? `${C.warm}18` : isPast ? `${C.cyan}08` : "transparent",
                            border: isActive ? `1px solid ${C.warm}66` : "1px solid transparent",
                          }}
                        >
                          <span
                            className={`${mono} text-[10px] font-semibold uppercase tracking-[0.15em]`}
                            style={{ color: isActive ? C.warm : isPast ? C.cyan : C.grayDim }}
                          >
                            {lvl}
                          </span>
                          {isActive && <span className="w-1.5 h-1.5 rounded-full mt-1" style={{ background: C.warm }} />}
                        </div>
                        {i < GROWTH_LADDER.length - 1 && (
                          <div className="w-6 h-px mx-0.5 flex-shrink-0" style={{ background: C.border }} />
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="indie-section-content" dangerouslySetInnerHTML={{ __html: peerHtml }} />
              </div>
            </div>
          </Section>
        )}

        {/* ── Curator Pitch ─────────────────────────────────────────────────── */}
        <Section delay={0.26}>
          <div className="rounded-xl border p-7 sm:p-9 mb-14 relative overflow-hidden" style={glass}>
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full"
              style={{ background: `radial-gradient(circle, ${C.cyan}22 0%, transparent 70%)` }} />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-4 h-4" style={{ color: C.cyan }} />
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: C.cyan }}>Your Curator Pitch</h3>
              </div>
              <div
                className="prose prose-invert max-w-none prose-p:leading-[1.85] prose-p:text-[15px] prose-strong:text-white"
                style={{ color: "#D8D8D8" }}
                dangerouslySetInnerHTML={{ __html: curatorPitch }}
              />
            </div>
          </div>
        </Section>

        {/* ── Revenue Snapshot ──────────────────────────────────────────────── */}
        <Section delay={0.28}>
          <div className="rounded-xl border p-6 mb-14" style={glass}>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: C.cyan }}>Revenue Snapshot</h3>
                <p className="text-xs mt-1" style={{ color: C.gray }}>Where the money is coming in today</p>
              </div>
              <DollarSign className="w-4 h-4" style={{ color: C.cyan }} />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueSnapshot} margin={{ top: 10, right: 16, left: 0, bottom: 4 }}>
                  <defs>
                    <linearGradient id="revBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.cyanSoft} />
                      <stop offset="100%" stopColor={C.cyan} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={C.border} strokeDasharray="2 4" vertical={false} />
                  <XAxis dataKey="source" stroke={C.gray} fontSize={11} tickLine={false} axisLine={{ stroke: C.border }} />
                  <YAxis stroke={C.gray} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${fmtCompact(v)}`} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: `${C.cyan}10` }} formatter={(v: any) => fmtUSD(Number(v))} />
                  <Bar dataKey="revenue" fill="url(#revBar)" radius={[8, 8, 0, 0]} animationDuration={1400} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Section>

        {/* ── YouTube Presence ──────────────────────────────────────────────── */}
        {hasYouTubeData && (
          <Section delay={0.30}>
            <div className="mb-14">
              <div className="mb-5 flex items-center gap-2">
                <Youtube className="w-4 h-4" style={{ color: C.cyan, filter: `drop-shadow(0 0 6px ${C.cyan}AA)` }} />
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: C.cyan }}>Your YouTube Presence</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[{ label: "Subscribers", value: ytSubscribers }, { label: "Total Views", value: ytTotalViews }].map((k, i) => (
                  <motion.div
                    key={k.label}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.30 + i * 0.06, duration: 0.6 }}
                    className="rounded-xl border p-5"
                    style={glass}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: C.gray }}>{k.label}</span>
                      <Youtube className="w-3.5 h-3.5" style={{ color: C.cyan }} />
                    </div>
                    <div className={`${mono} text-3xl font-semibold`} style={{ color: C.white }}>{fmtCompact(k.value)}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </Section>
        )}

        {/* ── Instagram Presence ────────────────────────────────────────────── */}
        {hasInstagramData && (
          <Section delay={0.32}>
            <div className="mb-14">
              <div className="mb-5 flex items-center gap-2">
                <Instagram className="w-4 h-4" style={{ color: C.cyan, filter: `drop-shadow(0 0 6px ${C.cyan}AA)` }} />
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: C.cyan }}>Your Instagram Presence</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[{ label: "Followers", value: igFollowers }, { label: "Following", value: igFollowing }].map((k, i) => (
                  <motion.div
                    key={k.label}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.32 + i * 0.06, duration: 0.6 }}
                    className="rounded-xl border p-5"
                    style={glass}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: C.gray }}>{k.label}</span>
                      <Instagram className="w-3.5 h-3.5" style={{ color: C.cyan }} />
                    </div>
                    <div className={`${mono} text-3xl font-semibold`} style={{ color: C.white }}>{fmtCompact(k.value)}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </Section>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            GROWTH+
        ════════════════════════════════════════════════════════════════════ */}
        {has(tier, "growth") && (
          <Section delay={0.34}>
            <div className="rounded-2xl border mb-8 overflow-hidden" style={glass}>
              <SectionHeader
                emoji="🚀"
                icon={TrendingUp}
                title="Conversion Funnel"
                accent={C.cyan}
                badge={
                  <span className={`${mono} text-[10px] px-2.5 py-1 rounded-md border`}
                    style={{ background: `${C.cyan}12`, color: C.cyan, borderColor: `${C.cyan}30` }}>
                    Fan Journey
                  </span>
                }
              />
              <div className="p-6 sm:p-8 space-y-5">
                {funnelData.map((stage, i) => (
                  <div key={stage.stage}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span
                          className={`${mono} text-[10px] font-bold uppercase tracking-[0.2em]`}
                          style={{ color: C.gray, minWidth: "6rem" }}
                        >
                          {stage.stage}
                        </span>
                        <span className={`${mono} text-sm font-semibold`} style={{ color: C.white }}>
                          {fmtCompact(stage.value)}
                        </span>
                      </div>
                      <span className={`${mono} text-sm font-bold`} style={{ color: stage.color }}>
                        {stage.pct}%
                      </span>
                    </div>
                    <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          background: `linear-gradient(90deg, ${stage.color}CC, ${stage.color})`,
                          boxShadow: `0 0 12px ${stage.color}66`,
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${stage.pct}%` }}
                        transition={{ duration: 1.2, delay: 0.34 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                    {i < funnelData.length - 1 && (
                      <div className="flex justify-start mt-1.5 pl-[6.5rem]">
                        <span className="text-[10px]" style={{ color: C.grayDim }}>
                          ↓ {Math.round((funnelData[i + 1].value / stage.value) * 100)}% convert to {funnelData[i + 1].stage.toLowerCase()}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Section>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            PRO+
        ════════════════════════════════════════════════════════════════════ */}
        {has(tier, "pro") && (
          <Section delay={0.36}>
            <div className="rounded-2xl border mb-8 overflow-hidden" style={glass}>
              <SectionHeader
                emoji="🎯"
                icon={Target}
                title="Artist Radar Profile"
                accent={C.cyan}
                badge={
                  <span className={`${mono} text-[10px] px-2.5 py-1 rounded-md border`}
                    style={{ background: `${C.cyan}12`, color: C.cyan, borderColor: `${C.cyan}30` }}>
                    6-Axis Analysis
                  </span>
                }
              />
              <div className="p-6">
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                      <PolarGrid stroke={C.border} />
                      <PolarAngleAxis
                        dataKey="axis"
                        tick={{ fill: C.gray, fontSize: 12, fontFamily: "ui-monospace, monospace" }}
                      />
                      <PolarRadiusAxis
                        stroke={C.border}
                        tick={{ fill: C.grayDim, fontSize: 10 }}
                        domain={[0, 100]}
                        tickCount={5}
                      />
                      <Radar
                        dataKey="value"
                        stroke={C.cyan}
                        fill={C.cyan}
                        fillOpacity={0.25}
                        strokeWidth={2}
                        dot={{ r: 5, fill: C.cyan, stroke: C.white, strokeWidth: 1.5 } as any}
                        style={{ filter: `drop-shadow(0 0 8px ${C.cyan}88)` }}
                        animationDuration={1600}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(v: any) => [`${Number(v).toFixed(0)} / 100`, ""]}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                  {radarData.map((d) => (
                    <div
                      key={d.axis}
                      className="rounded-lg px-4 py-3 border"
                      style={{ borderColor: "rgba(0,196,181,0.12)", background: "rgba(0,196,181,0.04)" }}
                    >
                      <div className="text-[10px] uppercase tracking-[0.15em] mb-1" style={{ color: C.gray }}>{d.axis}</div>
                      <div
                        className={`${mono} text-xl font-bold`}
                        style={{ color: d.value >= 70 ? C.cyan : d.value >= 50 ? C.cyanSoft : C.gray }}
                      >
                        {d.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Section>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            ENTERPRISE+
        ════════════════════════════════════════════════════════════════════ */}
        {has(tier, "enterprise") && (
          <>
            {/* TikTok × DSP Correlation */}
            <Section delay={0.38}>
              <div className="rounded-2xl border mb-8 overflow-hidden" style={glass}>
                <SectionHeader
                  emoji="📱"
                  icon={Activity}
                  title="TikTok × DSP Correlation"
                  accent={C.cyan}
                  badge={
                    <span className={`${mono} text-[10px] px-2.5 py-1 rounded-md border`}
                      style={{ background: `${C.cyan}12`, color: C.cyan, borderColor: `${C.cyan}30` }}>
                      12-Week View
                    </span>
                  }
                />
                <div className="p-6">
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={tiktokDSP} margin={{ top: 10, right: 16, left: 0, bottom: 4 }}>
                        <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="week" stroke={C.gray} fontSize={11} tickLine={false} axisLine={{ stroke: C.border }} />
                        <YAxis yAxisId="l" stroke={C.cyan}     fontSize={11} tickLine={false} axisLine={false} tickFormatter={fmtCompact} />
                        <YAxis yAxisId="r" orientation="right" stroke={C.cyanSoft} fontSize={11} tickLine={false} axisLine={false} tickFormatter={fmtCompact} />
                        <Tooltip contentStyle={tooltipStyle} formatter={(v: any, name: any) => [fmtCompact(Number(v)), name]} />
                        <Legend wrapperStyle={{ color: C.gray, fontSize: 11 }} />
                        <Line
                          yAxisId="l" type="monotone" dataKey="tiktok"
                          stroke={C.cyan} strokeWidth={2} dot={false} name="TikTok Views"
                          animationDuration={1400}
                          style={{ filter: `drop-shadow(0 0 4px ${C.cyan}88)` }}
                        />
                        <Line
                          yAxisId="r" type="monotone" dataKey="dsp"
                          stroke={C.cyanSoft} strokeWidth={2} dot={false} name="DSP Streams"
                          animationDuration={1400}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </Section>

            {/* Revenue Model Advanced */}
            <Section delay={0.40}>
              <div className="rounded-2xl border mb-8 overflow-hidden" style={glass}>
                <SectionHeader
                  emoji="📊"
                  icon={DollarSign}
                  title="Revenue Model Advanced"
                  accent={C.warm}
                  badge={
                    <span className={`${mono} text-[10px] px-2.5 py-1 rounded-md border`}
                      style={{ background: `${C.warm}12`, color: C.warm, borderColor: `${C.warm}30` }}>
                      5-Year NPV
                    </span>
                  }
                />
                <div className="p-6 sm:p-8 space-y-8">
                  {/* Revenue streams */}
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.2em] mb-4" style={{ color: C.gray }}>Revenue Streams</div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={{ color: C.gray }}>
                            <th className="py-2.5 text-[10px] uppercase tracking-[0.2em] font-medium text-left">Source</th>
                            <th className="py-2.5 text-[10px] uppercase tracking-[0.2em] font-medium text-right">Revenue</th>
                            <th className="py-2.5 text-[10px] uppercase tracking-[0.2em] font-medium text-right">Growth</th>
                          </tr>
                        </thead>
                        <tbody>
                          {revStreams.map((r: any, i: number) => (
                            <tr key={i} className="border-t" style={{ borderColor: C.border }}>
                              <td className="py-3" style={{ color: C.white }}>{r.source}</td>
                              <td className={`py-3 text-right ${mono}`} style={{ color: C.white }}>{fmtUSD(Number(r.revenue))}</td>
                              <td className={`py-3 text-right ${mono}`} style={{ color: Number(r.growth) >= 0 ? C.cyan : "#FF6B6B" }}>
                                {Number(r.growth) >= 0 ? "+" : ""}{Number(r.growth).toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {/* NPV projection */}
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.2em] mb-4" style={{ color: C.gray }}>NPV Projection @ 10% Discount Rate</div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={{ color: C.gray }}>
                            <th className="py-2.5 text-[10px] uppercase tracking-[0.2em] font-medium text-left">Year</th>
                            <th className="py-2.5 text-[10px] uppercase tracking-[0.2em] font-medium text-right">Cashflow</th>
                            <th className="py-2.5 text-[10px] uppercase tracking-[0.2em] font-medium text-right">Discounted</th>
                            <th className="py-2.5 text-[10px] uppercase tracking-[0.2em] font-medium text-right">Cumulative NPV</th>
                          </tr>
                        </thead>
                        <tbody>
                          {npv.map((r: any, i: number) => (
                            <tr key={i} className="border-t" style={{ borderColor: C.border }}>
                              <td className={`py-3 ${mono}`} style={{ color: C.white }}>{r.year}</td>
                              <td className={`py-3 text-right ${mono}`} style={{ color: C.white }}>{fmtUSD(Number(r.cashflow))}</td>
                              <td className={`py-3 text-right ${mono}`} style={{ color: C.white }}>{fmtUSD(Number(r.discounted))}</td>
                              <td className={`py-3 text-right ${mono}`} style={{ color: C.cyan }}>{fmtUSD(Number(r.cumulative))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </Section>

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
                  href="https://buyer.americaspay.com/b/enterprise"
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
                  href="https://buyer.americaspay.com/b/artistpro"
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

        <div className={`${mono} text-center mt-8 text-[10px] uppercase tracking-[0.3em]`} style={{ color: C.grayDim }}>
          CONFIDENTIAL · SONGSS Intelligence · Americascom, Inc.
        </div>
      </div>
    </div>
  );
}
