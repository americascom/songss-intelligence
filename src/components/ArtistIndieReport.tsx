import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Download, Sparkles, Heart, TrendingUp, Users, DollarSign,
  Activity, MapPin, Lightbulb, Music, ArrowUpRight, Youtube, Instagram,
  ShieldCheck, Radio, Calculator, Film, Award, AlertTriangle,
} from "lucide-react";
import { Link } from "react-router-dom";
import PeerBenchmarkChart, { type PeerBenchmarkData } from "@/components/PeerBenchmarkChart";

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
  border: `1px solid rgba(0,196,181,0.35)`,
  borderRadius: 8,
  color: C.white,
  fontSize: 12,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace",
  backdropFilter: "blur(8px)",
};

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

  function inline(t: string): string {
    return t
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");
  }

  const lines = md.split("\n");
  const out: string[] = [];
  let inTable = false;
  let tableRows = 0;
  let inList = false;

  const flushList = () => { if (inList) { out.push("</ul>"); inList = false; } };
  const flushTable = () => {
    if (inTable) { out.push("</tbody></table>"); inTable = false; tableRows = 0; }
  };

  for (const raw of lines) {
    const line = raw.trim();

    if (line.startsWith("|")) {
      if (/^\|[-|\s:]+\|$/.test(line)) continue; // separator row
      flushList();
      if (!inTable) {
        out.push('<table>');
        inTable = true;
        tableRows = 0;
      }
      const cells = line.split("|").slice(1, -1).map((c) => c.trim());
      if (tableRows === 0) {
        out.push(
          "<thead><tr>" +
            cells.map((c) => `<th>${inline(c)}</th>`).join("") +
          "</tr></thead><tbody>"
        );
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
    if (inList && line) { flushList(); }

    if (line.startsWith("> ")) {
      out.push(`<blockquote>${inline(line.slice(2))}</blockquote>`);
      continue;
    }

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
    const m2 = content.match(h2);
    if (m2) return m2[1].trim();
    const md = new RegExp(`##\\s*[^\\n]*${kw}[^\\n]*\\n([\\s\\S]*?)(?=\\n##\\s|\\n#\\s|$)`, "i");
    const mm = content.match(md);
    if (mm) return mm[1].trim();
  }
  return null;
}

interface ReportRow {
  id: string;
  session_id: string;
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
  peer_benchmark_data: PeerBenchmarkData | null;
}

// ── Shared section card header ───────────────────────────────────────────────
function SectionHeader({
  emoji,
  icon: Icon,
  title,
  accent,
  badge,
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
      style={{
        borderColor: `${accent}22`,
        background: `linear-gradient(135deg, ${accent}0f 0%, transparent 70%)`,
      }}
    >
      <div className="flex items-center gap-2.5">
        <span className="text-lg leading-none">{emoji}</span>
        <Icon className="w-4 h-4" style={{ color: accent, filter: `drop-shadow(0 0 6px ${accent}99)` }} />
        <h3
          className="text-[10px] font-bold uppercase tracking-[0.28em]"
          style={{ color: accent }}
        >
          {title}
        </h3>
      </div>
      {badge}
    </div>
  );
}

export default function ArtistIndieReport({ report, isSample = false }: { report: ReportRow; isSample?: boolean }) {
  const em = report.engagement_metrics || {};
  const geo = report.geo_hotspots || {};

  const yt = report.youtube_data || {};
  const ytSubscribers = Number(yt.subscribers ?? 0);
  const ytTotalViews = Number(yt.total_views ?? 0);
  const hasYouTubeData = ytSubscribers > 0 || ytTotalViews > 0;

  const ig = report.instagram_data || {};
  const igFollowers = Number(ig.followers ?? 0);
  const igFollowing = Number(ig.following ?? 0);
  const hasInstagramData = igFollowers > 0;

  const snie = Number(report.digital_score ?? 0) || 72;
  const rawSEI = em.social_engagement_index;
  const engagementScore: number | null = rawSEI == null ? null : Number(rawSEI);
  const retentionRate = Number(em.retention_rate ?? em.retentionRate ?? 0) || 48;
  const monthlyStreams = Number(em.monthly_streams ?? em.monthlyStreams ?? 0) || 12500;
  const ltv = Number(em.ltv_projection ?? em.ltv ?? 0) || 4200;

  const trajectory = useMemo(() => {
    const raw = em.growth_trajectory ?? em.trajectory ?? em.neural_trajectory ?? [];
    if (Array.isArray(raw) && raw.length) {
      return raw.slice(0, 6).map((r: any, i: number) => ({
        month: r.label ?? r.month ?? `M${i + 1}`,
        streams: Number(r.streams ?? r.value ?? 0),
      }));
    }
    return Array.from({ length: 6 }, (_, i) => ({
      month: `M${i + 1}`,
      streams: Math.round(monthlyStreams * (0.55 + i * 0.12)),
    }));
  }, [em, monthlyStreams]);

  const markets = useMemo(() => {
    const raw = Array.isArray(geo)
      ? geo
      : (geo.top_cities ?? geo.cities ?? geo.top ?? geo.hotspots ?? []);
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
      parseNum(r?.score ?? r?.potential ?? r?.potential_score ?? r?.velocity ?? r?.value)
    );
    const maxScore = Math.max(0, ...rawScores.filter((n): n is number => n != null));
    const normalize = (n: number | null, idx: number): number => {
      if (n == null) return [82, 76, 71][idx] ?? 70;
      if (n <= 100) return Math.round(n);
      if (maxScore > 0) return Math.max(40, Math.round((n / maxScore) * 100));
      return 70;
    };

    const arr = list.slice(0, 3).map((r: any, i: number) => ({
      country: r?.country ?? r?.name ?? r?.city ?? "—",
      city: r?.city && r?.country && r.city !== r.country ? r.city : null,
      score: normalize(rawScores[i], i),
      opportunity: r?.opportunity ?? r?.insight ?? r?.note ?? null,
    }));
    if (arr.length) return arr;
    return [
      { country: "United States", city: "Los Angeles", score: 82, opportunity: "Strong sync potential" },
      { country: "Brazil", city: "São Paulo", score: 76, opportunity: "Growing playlist traction" },
      { country: "United Kingdom", city: "London", score: 71, opportunity: "Editorial radar candidate" },
    ];
  }, [geo]);

  const revenueSnapshot = useMemo(() => [
    { source: "Streaming", revenue: Math.round(ltv * 0.55) },
    { source: "Merch", revenue: Math.round(ltv * 0.18) },
    { source: "Sync", revenue: Math.round(ltv * 0.15) },
    { source: "Live", revenue: Math.round(ltv * 0.12) },
  ], [ltv]);

  const recommendations = useMemo(() => {
    const raw = em.recommendations ?? em.actions ?? [];
    if (Array.isArray(raw) && raw.length >= 3) {
      return raw.slice(0, 3).map((r: any) =>
        typeof r === "string" ? { title: r, body: "" } : { title: r.title ?? r.action ?? "Next step", body: r.body ?? r.description ?? "" }
      );
    }
    return [
      {
        title: "Lean into your top market",
        body: `Your strongest signal is in ${markets[0]?.country}. Plan one release event or playlist push focused there in the next 30 days.`,
      },
      {
        title: "Show up consistently for fans",
        body: "Retention climbs when fans hear from you weekly. Try one short video and one story post per week for the next month.",
      },
      {
        title: "Open a second revenue door",
        body: "Streaming is paying, but a small merch drop or a sync pitch can meaningfully lift your LTV. Pick one and ship it.",
      },
    ];
  }, [em, markets]);

  const cleanMd = useMemo(
    () => stripCodeFence(report.report_markdown || report.report_html || ""),
    [report.report_markdown, report.report_html]
  );

  // Raw markdown (for score/level extraction) + rendered HTML
  const hygieneMd = useMemo(() => extractSection(cleanMd, "DIGITAL HYGIENE"), [cleanMd]);
  const microMd   = useMemo(() => extractSection(cleanMd, "MICRO-INFLUENCE", "MICRO INFLUENCE"), [cleanMd]);
  const investMd  = useMemo(() => extractSection(cleanMd, "NEXT STEP INVESTMENT", "INVESTMENT CALCULATOR"), [cleanMd]);
  const syncMd    = useMemo(() => extractSection(cleanMd, "SYNC-READINESS", "SYNC READINESS", "SYNC-READY"), [cleanMd]);
  const peerMd    = useMemo(() => extractSection(cleanMd, "PEER BENCHMARK"), [cleanMd]);

  const hygieneHtml = useMemo(() => hygieneMd ? renderMarkdown(hygieneMd) : null, [hygieneMd]);
  const microHtml   = useMemo(() => microMd   ? renderMarkdown(microMd)   : null, [microMd]);
  const investHtml  = useMemo(() => investMd  ? renderMarkdown(investMd)  : null, [investMd]);
  const syncHtml    = useMemo(() => syncMd    ? renderMarkdown(syncMd)    : null, [syncMd]);
  const peerHtml    = useMemo(() => peerMd    ? renderMarkdown(peerMd)    : null, [peerMd]);

  // Grounded peer_benchmark_data can exist independent of whether the AI's
  // markdown happened to include a parseable "## PEER BENCHMARK" section —
  // the section must not disappear just because peerHtml extraction failed.
  const hasPeerBenchmarkData = !!(report.peer_benchmark_data?.peer_benchmark?.length);

  const hygieneScore = useMemo((): number | null => {
    if (!hygieneMd) return null;
    const m = hygieneMd.match(/(\d{1,3})\s*(?:\/\s*100|out\s+of\s+100)/i)
           || hygieneMd.match(/score[^:]*:\s*(\d{1,3})/i);
    const n = m ? parseInt(m[1], 10) : NaN;
    return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null;
  }, [hygieneMd]);

  const curatorPitch = useMemo(() => {
    const content = stripCodeFence(cleanMd);

    const isTableParagraph = (p: string): boolean => {
      const lines = p.split("\n");
      const tableLines = lines.filter((l) => l.includes("|---|") || l.trimStart().startsWith("|"));
      return tableLines.length / lines.length > 0.2;
    };

    const mdToHtml = (text: string) =>
      text
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .split("\n\n")
        .filter((p) => p.trim().length > 0 && !isTableParagraph(p))
        .map((p) => `<p>${p.trim()}</p>`)
        .join("");

    const pitchMatch = content.match(/##\s*Curator\s*Pitch\s*([\s\S]*?)(?=\n##\s|\n#\s|$)/i);
    if (pitchMatch) return mdToHtml(pitchMatch[1].trim());

    const execMatch = content.match(/##\s*Executive\s*Summary\s*([\s\S]*?)(?=\n##\s|\n#\s|$)/i);
    if (execMatch) {
      const paras = execMatch[1]
        .trim()
        .split("\n\n")
        .filter((p) => p.trim().length > 20 && !isTableParagraph(p))
        .slice(0, 2)
        .join("\n\n");
      return mdToHtml(paras);
    }

    const firstPara = content
      .split("\n\n")
      .find((p) => {
        const t = p.trim();
        return t.length > 40 && !t.startsWith("<") && !t.startsWith("#") && !t.startsWith("`") && !isTableParagraph(t);
      });
    if (firstPara) return mdToHtml(firstPara.trim());

    return "Your sound bridges intimacy and momentum — a rare combination that resonates with playlist curators looking for authentic voices with crossover appeal.";
  }, [cleanMd]);

  const reportDate = new Date(report.created_at).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });

  return (
    <div className="indie-report-root min-h-screen relative overflow-hidden" style={{ background: C.bg, color: C.white }}>
      <style>{`
        @keyframes indieGlow { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.08)} }
        @keyframes indieMesh { 0%{transform:translate3d(0,0,0)} 50%{transform:translate3d(1%,-1%,0) scale(1.04)} 100%{transform:translate3d(0,0,0)} }
        .indie-mesh{position:absolute;inset:-10%;background:radial-gradient(45% 35% at 25% 30%,rgba(0,196,181,.10) 0%,transparent 60%),radial-gradient(40% 30% at 75% 70%,rgba(245,200,75,.06) 0%,transparent 60%);filter:blur(40px);pointer-events:none;animation:indieMesh 28s ease-in-out infinite;z-index:0}
        .indie-glow{animation:indieGlow 2.6s ease-in-out infinite}

        /* ── Section content ── */
        .indie-section-content { font-size:13px; line-height:1.65; }

        /* Tables */
        .indie-section-content table { width:100%;border-collapse:collapse;font-size:12px;border-radius:8px;overflow:hidden }
        .indie-section-content thead { background:rgba(0,196,181,0.07) }
        .indie-section-content th { color:#00C4B5;text-transform:uppercase;letter-spacing:.12em;font-size:10px;padding:10px 14px;border-bottom:1px solid rgba(0,196,181,0.18);text-align:left;font-weight:700;white-space:nowrap }
        .indie-section-content td { padding:10px 14px;border-bottom:1px solid #1A1A1A;color:#D4D4D4;vertical-align:top;font-size:12px;line-height:1.55 }
        .indie-section-content tbody tr:last-child td { border-bottom:none }
        .indie-section-content tbody tr:hover td { background:rgba(255,255,255,0.018);transition:background 0.15s }

        /* Lists */
        .indie-section-content ul,.indie-section-content ol { padding:0;margin:4px 0 8px;list-style:none }
        .indie-section-content li { color:#C4C4C4;font-size:13px;margin-bottom:7px;line-height:1.65;padding-left:18px;position:relative }
        .indie-section-content li::before { content:'›';position:absolute;left:2px;top:0;color:rgba(0,196,181,0.7);font-weight:700;font-size:15px;line-height:1.4 }

        /* Inline */
        .indie-section-content strong { color:#F0F0F0;font-weight:600 }
        .indie-section-content em { color:#9A9A9A;font-style:italic }
        .indie-section-content p { color:#9A9A9A;font-size:13px;line-height:1.75;margin-bottom:8px }

        /* Blockquotes — Golden Insights */
        .indie-section-content blockquote { border-left:3px solid #00C4B5;padding:10px 16px;margin:10px 0;background:rgba(0,196,181,0.06);border-radius:0 8px 8px 0;color:#D4D4D4;font-size:13px;font-style:italic }

        /* Print */
        @media print {
          @page { size: A4; margin: 12mm; }
          html, body { background: #0a0a0a !important; color: #f5f5f5 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print, header[role="banner"], footer, nav { display: none !important; }
          .indie-mesh { display: none !important; }
          .indie-report-root { background: #0a0a0a !important; color: #f5f5f5 !important; }
          .indie-report-root * { box-shadow: none !important; text-shadow: none !important; animation: none !important; }
          .indie-report-root .snie-number { color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; opacity: 1 !important; text-shadow: none !important; }
          .indie-report-root .recharts-wrapper, .indie-report-root .recharts-surface { overflow: visible !important; }
          .indie-report-root .curator-pitch-content, .indie-report-root .curator-pitch-content * { color: #e8e8e8 !important; opacity: 1 !important; }
          .indie-report-root .curator-pitch-content { display: block !important; }
          .indie-report-root .mb-14 { margin-bottom: 1.25rem !important; }
          .indie-report-root .mb-8 { margin-bottom: 0.75rem !important; }
          .indie-report-root .py-10 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
          .indie-report-root .pb-10 { padding-bottom: 0.75rem !important; }
          .indie-report-root section, .indie-report-root .rounded-xl, .indie-report-root .rounded-2xl { page-break-inside: avoid; break-inside: avoid; }
        }
      `}</style>
      <div className="indie-mesh" aria-hidden />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8 no-print">
          <div className={`${mono} text-[10px] uppercase tracking-[0.35em] flex items-center gap-2`} style={{ color: C.cyan }}>
            <span className="w-1.5 h-1.5 rounded-full indie-glow" style={{ background: C.cyan, boxShadow: `0 0 10px ${C.cyan}` }} />
            SONGSS Intelligence · Artist Indie
          </div>
          {!isSample && (
          <button
            onClick={() => {
              const prev = document.title;
              const safe = (report.artist_name || "Artist-Indie-Report").replace(/[^\w\- ]+/g, "").trim() || "Artist-Indie-Report";
              document.title = `${safe} — SONGSS Intelligence`;
              const restore = () => {
                document.title = prev;
                window.removeEventListener("afterprint", restore);
              };
              window.addEventListener("afterprint", restore);
              setTimeout(() => window.print(), 50);
            }}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] border transition-all hover:scale-[1.02]"
            style={{ borderColor: C.cyan, color: C.cyan, background: "rgba(0,196,181,0.06)" }}
          >
            <Download className="w-3.5 h-3.5" />
            Download PDF
          </button>
          )}
        </div>

        {/* Hero */}
        <motion.header
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-14 pb-10 border-b"
          style={{ borderColor: "rgba(0,196,181,0.15)" }}
        >
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border" style={{ borderColor: C.cyan, color: C.cyan }}>
            <Sparkles className="w-3.5 h-3.5" />
            <span className={`${mono} text-[10px] uppercase tracking-[0.25em]`}>Artist Indie · {reportDate}</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.05] mb-8" style={{ color: C.white }}>
            {report.artist_name || "Your Artist Report"}
          </h1>

          <div className="inline-flex flex-col items-center">
            <div className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: C.cyan }}>SNIE™ Score</div>
            <div className="relative">
              <div
                className={`${mono} snie-number text-[120px] sm:text-[180px] font-bold leading-none`}
                style={{
                  color: C.white,
                  WebkitTextFillColor: C.white,
                  textShadow: `0 0 40px ${C.cyan}66, 0 0 80px ${C.cyan}33`,
                }}
              >
                {snie}
              </div>
              <div className="text-xs mt-2" style={{ color: C.gray }}>out of 100</div>
            </div>
          </div>

          <p className="mt-6 text-[11px] max-w-md mx-auto leading-relaxed italic" style={{ color: C.grayDim }}>
            SNIE™ Score reflects real-time streaming and market data at the moment of analysis. Scores may vary between reports as platform data and market conditions update continuously.
          </p>

          <p className="mt-8 text-base max-w-xl mx-auto leading-relaxed" style={{ color: C.gray }}>
            A warm read on where you are, what's working, and the next moves that matter most.
          </p>
        </motion.header>

        {/* 4 Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {[
            { label: "Social Engagement Index", value: engagementScore === null ? "—" : engagementScore.toFixed(0), icon: Activity, title: engagementScore === null ? "Not enough TikTok data yet to compute this" : "Cumulative engagement relative to audience size" },
            { label: "Retention Rate", value: `${retentionRate.toFixed(0)}%`, icon: Users },
            { label: "Monthly Streams", value: fmtCompact(monthlyStreams), icon: TrendingUp },
            { label: "LTV Projection", value: fmtUSD(ltv), icon: DollarSign },
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
              <div className={`${mono} text-3xl font-semibold`} style={{ color: C.white }}>{k.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Neural Trajectory */}
        <div className="rounded-xl border p-6 mb-14" style={glass}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: C.cyan }}>Neural Trajectory</h3>
              <p className="text-xs mt-1" style={{ color: C.gray }}>Where your streams are heading over the next 6 months</p>
            </div>
            <Music className="w-4 h-4" style={{ color: C.cyan }} />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trajectory} margin={{ top: 10, right: 16, left: 0, bottom: 4 }}>
                <defs>
                  <linearGradient id="indieLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={C.cyanSoft} />
                    <stop offset="100%" stopColor={C.cyan} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={C.border} strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="month" stroke={C.gray} fontSize={11} tickLine={false} axisLine={{ stroke: C.border }} />
                <YAxis stroke={C.gray} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => fmtCompact(v)} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [fmtCompact(Number(v)), "Streams"]} />
                <Line
                  type="monotone" dataKey="streams"
                  stroke="url(#indieLine)" strokeWidth={3}
                  dot={{ r: 5, fill: C.cyan, stroke: C.white, strokeWidth: 1.5 }}
                  activeDot={{ r: 7 }}
                  animationDuration={1600}
                  style={{ filter: `drop-shadow(0 0 8px ${C.cyan}AA)` }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 3 Markets */}
        <div className="mb-14">
          <div className="mb-5 flex items-center gap-2 flex-wrap">
            <MapPin className="w-4 h-4" style={{ color: C.cyan }} />
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: C.cyan }}>Top 3 Markets</h3>
            <span
              className={`${mono} text-[9px] px-2.5 py-1 rounded-md border normal-case tracking-normal`}
              style={{ background: "rgba(154,154,154,0.08)", color: C.gray, borderColor: "rgba(154,154,154,0.25)" }}
            >
              AI-generated directional insight — not verified market data
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => {
              const m = markets[i] || null;
              if (!m) {
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.1, duration: 0.6 }}
                    className="rounded-xl border p-6 opacity-30"
                    style={glass}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`${mono} text-[10px] uppercase tracking-[0.2em]`} style={{ color: C.gray }}>#{i + 1}</div>
                    </div>
                    <div className="text-xl font-semibold mb-1" style={{ color: C.white }}>Market Pending</div>
                    <div className="mt-3 text-[10px] uppercase tracking-[0.2em]" style={{ color: C.grayDim }}>Potential Score</div>
                  </motion.div>
                );
              }
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.1, duration: 0.6 }}
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

        {/* Three Moves That Matter */}
        <div className="mb-14">
          <div className="mb-5 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" style={{ color: C.warm }} />
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: C.warm }}>Three Moves That Matter</h3>
          </div>
          <div className="space-y-3">
            {recommendations.map((r: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.1, duration: 0.6 }}
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

        {/* ── DIGITAL HYGIENE INDEX ─────────────────────────────────────── */}
        {hygieneHtml && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="rounded-2xl border mb-8 overflow-hidden"
            style={glass}
          >
            <SectionHeader
              emoji="🛡️"
              icon={ShieldCheck}
              title="Digital Hygiene Index"
              accent={C.cyan}
              badge={
                hygieneScore !== null ? (
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`${mono} text-3xl font-bold`}
                      style={{ color: hygieneScore < 60 ? "#FF6B6B" : C.cyan }}
                    >
                      {hygieneScore}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.15em]" style={{ color: C.grayDim }}>/100</span>
                  </div>
                ) : undefined
              }
            />
            <div className="p-6 sm:p-8">
              {hygieneScore !== null && hygieneScore < 60 && (
                <div
                  className="flex items-start gap-3 rounded-xl px-4 py-3 mb-6 border"
                  style={{ background: "rgba(255,107,107,0.07)", borderColor: "rgba(255,107,107,0.28)" }}
                >
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#FF6B6B" }} />
                  <p className="text-sm font-semibold leading-snug" style={{ color: "#FF6B6B" }}>
                    Stop everything. Fix your ISRC registration first. You are losing royalty money.
                  </p>
                </div>
              )}
              <div className="indie-section-content" dangerouslySetInnerHTML={{ __html: hygieneHtml }} />
            </div>
          </motion.div>
        )}

        {/* ── MICRO-INFLUENCE MAP ───────────────────────────────────────── */}
        {microHtml && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.6 }}
            className="rounded-2xl border mb-8 overflow-hidden"
            style={glass}
          >
            <SectionHeader
              emoji="🎯"
              icon={Radio}
              title="Micro-Influence Map"
              accent={C.cyan}
            />
            <div className="p-6 sm:p-8">
              <div className="indie-section-content" dangerouslySetInnerHTML={{ __html: microHtml }} />
            </div>
          </motion.div>
        )}

        {/* ── NEXT STEP INVESTMENT ──────────────────────────────────────── */}
        {investHtml && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14, duration: 0.6 }}
            className="rounded-2xl border mb-8 overflow-hidden"
            style={glass}
          >
            <SectionHeader
              emoji="💰"
              icon={Calculator}
              title="Next Step Investment"
              accent={C.warm}
              badge={
                <span
                  className={`${mono} text-[10px] px-2.5 py-1 rounded-md border`}
                  style={{ background: `${C.warm}12`, color: C.warm, borderColor: `${C.warm}30` }}
                >
                  $100 Budget
                </span>
              }
            />
            <div className="p-6 sm:p-8">
              <div className="indie-section-content" dangerouslySetInnerHTML={{ __html: investHtml }} />
            </div>
          </motion.div>
        )}

        {/* ── SYNC-READINESS SCORE ─────────────────────────────────────── */}
        {syncHtml && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, duration: 0.6 }}
            className="rounded-2xl border mb-8 overflow-hidden"
            style={glass}
          >
            <SectionHeader
              emoji="🎬"
              icon={Film}
              title="Sync-Readiness Score"
              accent={C.cyan}
            />
            <div className="p-6 sm:p-8">
              <div className="indie-section-content" dangerouslySetInnerHTML={{ __html: syncHtml }} />
            </div>
          </motion.div>
        )}

        {/* ── PEER BENCHMARK ───────────────────────────────────────────── */}
        {(peerHtml || hasPeerBenchmarkData) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.6 }}
            className="rounded-2xl border mb-14 overflow-hidden"
            style={glass}
          >
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
          </motion.div>
        )}

        {/* Curator Pitch */}
        <div className="rounded-xl border p-7 sm:p-9 mb-14 relative overflow-hidden" style={glass}>
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full" style={{ background: `radial-gradient(circle, ${C.cyan}22 0%, transparent 70%)` }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-4 h-4" style={{ color: C.cyan }} />
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: C.cyan }}>Your Curator Pitch</h3>
            </div>
            <div
              className="curator-pitch-content prose prose-invert max-w-none prose-p:leading-[1.85] prose-p:text-[15px] prose-strong:text-white prose-a:text-[#00C4B5]"
              style={{ color: "#D8D8D8" }}
              dangerouslySetInnerHTML={{ __html: curatorPitch }}
            />
          </div>
        </div>

        {/* Revenue Snapshot */}
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
                  <linearGradient id="indieBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.cyanSoft} />
                    <stop offset="100%" stopColor={C.cyan} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={C.border} strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="source" stroke={C.gray} fontSize={11} tickLine={false} axisLine={{ stroke: C.border }} />
                <YAxis stroke={C.gray} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${fmtCompact(v)}`} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: `${C.cyan}10` }} formatter={(v: any) => fmtUSD(Number(v))} />
                <Bar dataKey="revenue" fill="url(#indieBar)" radius={[8, 8, 0, 0]} animationDuration={1400} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* YouTube Presence */}
        {hasYouTubeData && (
          <div className="mb-14">
            <div className="mb-5 flex items-center gap-2">
              <Youtube className="w-4 h-4" style={{ color: C.cyan, filter: `drop-shadow(0 0 6px ${C.cyan}AA)` }} />
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: C.cyan }}>Your YouTube Presence</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Subscribers", value: ytSubscribers },
                { label: "Total Views", value: ytTotalViews },
              ].map((k, i) => (
                <motion.div
                  key={k.label}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-xl border p-5"
                  style={glass}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: C.gray }}>{k.label}</span>
                    <Youtube className="w-3.5 h-3.5" style={{ color: C.cyan, filter: `drop-shadow(0 0 6px ${C.cyan}AA)` }} />
                  </div>
                  <div className={`${mono} text-3xl font-semibold`} style={{ color: C.white }}>
                    {fmtCompact(k.value)}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Instagram Presence */}
        {hasInstagramData && (
          <div className="mb-14">
            <div className="mb-5 flex items-center gap-2">
              <Instagram className="w-4 h-4" style={{ color: C.cyan, filter: `drop-shadow(0 0 6px ${C.cyan}AA)` }} />
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: C.cyan }}>Your Instagram Presence</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Followers", value: igFollowers },
                { label: "Following", value: igFollowing },
              ].map((k, i) => (
                <motion.div
                  key={k.label}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-xl border p-5"
                  style={glass}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: C.gray }}>{k.label}</span>
                    <Instagram className="w-3.5 h-3.5" style={{ color: C.cyan, filter: `drop-shadow(0 0 6px ${C.cyan}AA)` }} />
                  </div>
                  <div className={`${mono} text-3xl font-semibold`} style={{ color: C.white }}>
                    {fmtCompact(k.value)}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Upgrade CTA */}
        <div
          className="rounded-2xl border p-8 sm:p-12 text-center relative overflow-hidden no-print"
          style={{
            background: `linear-gradient(135deg, rgba(0,196,181,0.08) 0%, rgba(14,14,14,0.9) 100%)`,
            borderColor: C.cyan,
          }}
        >
          <div className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(60% 80% at 50% 0%, ${C.cyan}22 0%, transparent 70%)` }} />
          <div className="relative">
            <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full" style={{ background: `${C.cyan}15`, color: C.cyan }}>
              <Sparkles className="w-3.5 h-3.5" />
              <span className={`${mono} text-[10px] uppercase tracking-[0.25em]`}>Ready for more?</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-semibold mb-4" style={{ color: C.white }}>
              Upgrade your plan for deeper insights
            </h2>
            <p className="text-sm sm:text-base mb-8 max-w-lg mx-auto leading-relaxed" style={{ color: C.gray }}>
              Unlock TikTok × DSP correlation, NPV financial modeling, full revenue stream breakdowns, and regional velocity radars with Growth, Pro, and beyond.
            </p>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 rounded-lg px-7 py-4 text-xs font-bold uppercase tracking-[0.2em] transition-all hover:scale-[1.02]"
              style={{ background: C.cyan, color: C.bg, boxShadow: `0 0 30px ${C.cyan}55` }}
            >
              Explore Plans
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

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
