import { useMemo } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart,
} from "recharts";
import {
  Download, Sparkles, Heart, TrendingUp, Users, DollarSign,
  Activity, MapPin, Lightbulb, Music, ArrowUpRight,
} from "lucide-react";
import { Link } from "react-router-dom";

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

interface ReportRow {
  id: string;
  session_id: string;
  artist_name: string | null;
  plan_name: string | null;
  digital_score: number | null;
  geo_hotspots: any;
  revenue_economics: any;
  engagement_metrics: any;
  report_markdown: string | null;
  created_at: string;
}

export default function ArtistIndieReport({ report }: { report: ReportRow }) {
  const em = report.engagement_metrics || {};
  const re = report.revenue_economics || {};
  const geo = report.geo_hotspots || {};

  const snie = Number(report.digital_score ?? 0) || 72;
  const engagementScore = Number(em.engagement_score ?? em.engagementScore ?? 0) || 7.4;
  const retentionRate = Number(em.retention_rate ?? em.retentionRate ?? 0) || 48;
  const monthlyStreams = Number(em.monthly_streams ?? em.monthlyStreams ?? 0) || 12500;
  const ltv = Number(re.ltv ?? re.ltv_projection ?? em.ltv ?? 0) || 4200;

  // 6-month neural trajectory
  const trajectory = useMemo(() => {
    const raw = em.trajectory ?? em.neural_trajectory ?? [];
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

  // Top 3 markets
  const markets = useMemo(() => {
    // geo_hotspots is a JSONB array of { city, country, opportunity, value }
    const raw = Array.isArray(geo)
      ? geo
      : (geo.top_cities ?? geo.cities ?? geo.top ?? geo.hotspots ?? []);
    const list = Array.isArray(raw) ? raw : [];

    // parse a score from possibly-string values like "1.2M", "85", 85
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

    // collect raw values to normalize stream-like numbers into a 0–100 score
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

  // Revenue snapshot
  const revenueSnapshot = useMemo(() => {
    const raw = re.streams ?? re.revenue_streams ?? [];
    if (Array.isArray(raw) && raw.length) {
      return raw.slice(0, 5).map((r: any) => ({
        source: r.source ?? r.name ?? "—",
        revenue: Number(r.revenue ?? r.value ?? 0),
      }));
    }
    return [
      { source: "Streaming", revenue: Math.round(ltv * 0.55) },
      { source: "Merch", revenue: Math.round(ltv * 0.18) },
      { source: "Sync", revenue: Math.round(ltv * 0.15) },
      { source: "Live", revenue: Math.round(ltv * 0.12) },
    ];
  }, [re, ltv]);

  // Recommendations
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

  // Curator pitch from markdown
  const curatorPitch = useMemo(() => {
    const md = report.report_markdown || "";
    const re1 = /##\s*Curator\s*Pitch[\s\S]*?(?=\n##\s|\n#\s|$)/i;
    const m = md.match(re1);
    if (m) return m[0].replace(/^##\s*Curator\s*Pitch\s*/i, "").trim();
    // Fallback: first paragraph
    const firstPara = md.split("\n\n").find((p) => p.trim().length > 40);
    return firstPara || "Your sound bridges intimacy and momentum — a rare combination that resonates with playlist curators looking for authentic voices with crossover appeal.";
  }, [report.report_markdown]);

  const reportDate = new Date(report.created_at).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: C.bg, color: C.white }}>
      <style>{`
        @keyframes indieGlow { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.08)} }
        @keyframes indieMesh { 0%{transform:translate3d(0,0,0)} 50%{transform:translate3d(1%,-1%,0) scale(1.04)} 100%{transform:translate3d(0,0,0)} }
        .indie-mesh{position:absolute;inset:-10%;background:radial-gradient(45% 35% at 25% 30%,rgba(0,196,181,.10) 0%,transparent 60%),radial-gradient(40% 30% at 75% 70%,rgba(245,200,75,.06) 0%,transparent 60%);filter:blur(40px);pointer-events:none;animation:indieMesh 28s ease-in-out infinite;z-index:0}
        .indie-glow{animation:indieGlow 2.6s ease-in-out infinite}
        @media print { .no-print{display:none!important} body{background:white!important} }
      `}</style>
      <div className="indie-mesh" aria-hidden />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Top bar with download */}
        <div className="flex items-center justify-between mb-8 no-print">
          <div className={`${mono} text-[10px] uppercase tracking-[0.35em] flex items-center gap-2`} style={{ color: C.cyan }}>
            <span className="w-1.5 h-1.5 rounded-full indie-glow" style={{ background: C.cyan, boxShadow: `0 0 10px ${C.cyan}` }} />
            SONGSS Intelligence · Artist Indie
          </div>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] border transition-all hover:scale-[1.02]"
            style={{ borderColor: C.cyan, color: C.cyan, background: "rgba(0,196,181,0.06)" }}
          >
            <Download className="w-3.5 h-3.5" />
            Download PDF
          </button>
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

          {/* Large SNIE Score */}
          <div className="inline-flex flex-col items-center">
            <div className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: C.cyan }}>SNIE™ Score</div>
            <div className="relative">
              <div
                className={`${mono} text-[120px] sm:text-[180px] font-bold leading-none`}
                style={{
                  color: C.white,
                  textShadow: `0 0 40px ${C.cyan}66, 0 0 80px ${C.cyan}33`,
                }}
              >
                {snie}
              </div>
              <div className="text-xs mt-2" style={{ color: C.gray }}>out of 100</div>
            </div>
          </div>

          <p className="mt-8 text-base max-w-xl mx-auto leading-relaxed" style={{ color: C.gray }}>
            A warm read on where you are, what's working, and the next moves that matter most.
          </p>
        </motion.header>

        {/* 4 Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {[
            { label: "Engagement Score", value: engagementScore.toFixed(1), icon: Activity },
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
          <div className="mb-5 flex items-center gap-2">
            <MapPin className="w-4 h-4" style={{ color: C.cyan }} />
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: C.cyan }}>Top 3 Markets</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {markets.map((m: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1, duration: 0.6 }}
                className="rounded-xl border p-6"
                style={glass}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`${mono} text-[10px] uppercase tracking-[0.2em]`} style={{ color: C.gray }}>
                    #{i + 1}
                  </div>
                  <div className={`${mono} text-2xl font-semibold`} style={{ color: C.cyan }}>
                    {m.score}
                  </div>
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
            ))}
          </div>
        </div>

        {/* Recommendations */}
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

        {/* Curator Pitch */}
        <div className="rounded-xl border p-7 sm:p-9 mb-14 relative overflow-hidden" style={glass}>
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full" style={{ background: `radial-gradient(circle, ${C.cyan}22 0%, transparent 70%)` }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-4 h-4" style={{ color: C.cyan }} />
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: C.cyan }}>Your Curator Pitch</h3>
            </div>
            <div
              className="prose prose-invert max-w-none prose-p:leading-[1.85] prose-p:text-[15px] prose-strong:text-white prose-a:text-[#00C4B5]"
              style={{ color: "#D8D8D8" }}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{curatorPitch}</ReactMarkdown>
            </div>
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

        <div className={`${mono} text-center mt-8 text-[10px] uppercase tracking-[0.3em]`} style={{ color: C.grayDim }}>
          Confidential · Session {report.session_id.slice(0, 8)}
        </div>
      </div>
    </div>
  );
}
