import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, useInView, useMotionValue, animate } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  AreaChart, Area,
  ComposedChart, ReferenceLine, Scatter,
} from "recharts";
import { Lock, Loader2, Activity, Mail, Calendar, ShieldCheck, Zap, TrendingUp, Users, DollarSign, Youtube } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import NeuralWorldMap, { normalizeHotspots } from "@/components/NeuralWorldMap";
import ArtistIndieReport from "@/components/ArtistIndieReport";

// --- Executive Obsidian Theme ---
const C = {
  bg: "#050505",
  surface: "#0B0B0B",
  card: "#0D0D0D",
  border: "#1A1A1A",
  cyan: "#00C4B5",
  cyanDim: "#0E847B",
  white: "#F5F5F5",
  gray: "#7A7A7A",
  grayDim: "#3A3A3A",
};

const mono = "font-mono tabular-nums";

// ---------- helpers ----------
const isValidSessionId = (v?: string) => !!v && v.trim().length > 0;

function fmtNum(n: number, opts: Intl.NumberFormatOptions = {}) {
  return new Intl.NumberFormat("en-US", opts).format(n);
}
function fmtCompact(n: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}
function fmtUSD(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function planTier(plan?: string | null): "indie" | "growth" | "pro" | "enterprise" | "opus" {
  const p = (plan || "").toLowerCase();
  if (p.includes("opus")) return "opus";
  if (p.includes("enterprise")) return "enterprise";
  if (p.includes("pro")) return "pro";
  if (p.includes("growth")) return "growth";
  return "indie";
}
const tierRank = { indie: 0, growth: 1, pro: 2, enterprise: 3, opus: 4 } as const;
const has = (t: ReturnType<typeof planTier>, min: keyof typeof tierRank) => tierRank[t] >= tierRank[min];

// ---------- Reveal ----------
function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ---------- Count up ----------
function CountUp({
  to, decimals = 0, duration = 1.8, format,
}: { to: number; decimals?: number; duration?: number; format?: (n: number) => string }) {
  const mv = useMotionValue(0);
  const [val, setVal] = useState(format ? format(0) : (0).toFixed(decimals));
  useEffect(() => {
    const controls = animate(mv, to, {
      duration, ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setVal(format ? format(v) : v.toFixed(decimals)),
    });
    return () => controls.stop();
  }, [to, duration]);
  return <span className={mono}>{val}</span>;
}

// ---------- Scramble / Decrypt ----------
const SCRAMBLE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789!@#$%&*+=/<>";
function Scramble({ value, duration = 800, className = "" }: { value: string; duration?: number; className?: string }) {
  const [out, setOut] = useState(value);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const lockedCount = Math.floor(t * value.length);
      let s = "";
      for (let i = 0; i < value.length; i++) {
        const ch = value[i];
        if (i < lockedCount || /[\s.,$%+\-/:]/.test(ch)) s += ch;
        else s += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      }
      setOut(s);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setOut(value);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span className={`${mono} ${className}`}>{out}</span>;
}

// ---------- Typewriter (on scroll) ----------
function Typewriter({ text, cps = 220, children }: { text: string; cps?: number; children: (shown: string) => React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const total = text.length;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;
      const k = Math.min(total, Math.floor(elapsed * cps));
      setN(k);
      if (k < total) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, text, cps]);
  return <div ref={ref}>{children(text.slice(0, n))}</div>;
}

// ---------- Score Ring ----------
function ScoreRing({ score }: { score: number }) {
  const size = 180;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const target = Math.max(0, Math.min(100, score));
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const ctrl = animate(0, target, {
      duration: 2.0, ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setProgress(v),
    });
    return () => ctrl.stop();
  }, [target]);
  const offset = c - (progress / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={C.border} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={C.cyan} strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 12px ${C.cyan}AA) drop-shadow(0 0 4px ${C.cyan})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className={`${mono} text-5xl font-bold`} style={{ color: C.white }}>
          <Scramble value={String(target)} duration={800} />
        </div>
        <div className="text-[10px] uppercase tracking-[0.3em] mt-1" style={{ color: C.cyan }}>SNIE™ Score</div>
      </div>
    </div>
  );
}

// ---------- Card chrome (glassmorphism) ----------
const glassStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, rgba(5,5,5,0.78) 0%, rgba(26,26,26,0.62) 100%)",
  borderColor: "rgba(0,196,181,0.15)",
  backdropFilter: "blur(22px) saturate(150%)",
  WebkitBackdropFilter: "blur(22px) saturate(150%)",
  boxShadow: "0 12px 48px -16px rgba(0,196,181,0.12), inset 0 1px 0 rgba(255,255,255,0.03)",
};

function Panel({ title, subtitle, children, className = "" }: { title?: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border p-5 h-full ${className}`} style={glassStyle}>
      {title && (
        <div className="mb-4">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: C.cyan }}>{title}</h3>
          {subtitle && <p className="text-xs mt-1" style={{ color: C.gray }}>{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

function ChartPanel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Reveal>
      <Panel title={title} subtitle={subtitle}>
        <div className="h-64">{children}</div>
      </Panel>
    </Reveal>
  );
}

// ---------- Tooltip styling ----------
const tooltipStyle: React.CSSProperties = {
  background: "rgba(11,11,11,0.92)",
  border: `1px solid rgba(0,196,181,0.35)`,
  borderRadius: 8,
  color: C.white,
  fontSize: 12,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace",
  backdropFilter: "blur(8px)",
  boxShadow: `0 0 24px rgba(0,196,181,0.15)`,
};

// ---------- 401 ----------
function Classified({ message }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: C.bg }}>
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="text-center max-w-md"
      >
        <Lock className="w-8 h-8 mx-auto mb-6" style={{ color: C.cyan }} />
        <div className={`${mono} text-xs uppercase tracking-[0.4em] mb-3`} style={{ color: C.cyan }}>401 — Classified</div>
        <h1 className="text-2xl font-semibold mb-3" style={{ color: C.white }}>This dossier does not exist.</h1>
        <p className="text-sm" style={{ color: C.gray }}>{message || "The session ID is invalid or has been revoked. Contact your strategy lead for access."}</p>
      </motion.div>
    </div>
  );
}

// ---------- types ----------
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
  spotify_data: { followers?: number; monthly_listeners?: number; top_country?: string } | null;
  tiktok_data: { followers?: number; engagement_rate?: number } | null;
}

// ---------- main ----------
export default function Report() {
  const { session_id } = useParams<{ session_id: string }>();
  const [report, setReport] = useState<ReportRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isValidSessionId(session_id)) { setLoading(false); setError("invalid"); return; }
    (async () => {
      const { data, error } = await supabase
        .from("intelligence_reports")
        .select("*")
        .eq("session_id", session_id!)
        .maybeSingle();
      setLoading(false);
      if (error) { setError(error.message); return; }
      if (!data) { setError("notfound"); return; }
      setReport(data as unknown as ReportRow);
    })();
  }, [session_id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-6 relative overflow-hidden" style={{ background: C.bg }}>
        <style>{`
          @keyframes obsBreatheLoad { 0%,100%{opacity:.55;transform:scale(1)} 50%{opacity:1;transform:scale(1.35)} }
          @keyframes obsSonarLoad { 0%{transform:scale(1);opacity:.7} 100%{transform:scale(3.6);opacity:0} }
          .obs-load-mesh{position:absolute;inset:-10%;background:radial-gradient(45% 35% at 30% 40%,rgba(0,196,181,.10) 0%,transparent 60%),radial-gradient(40% 30% at 70% 60%,rgba(14,132,123,.12) 0%,transparent 60%);filter:blur(40px);pointer-events:none}
          .obs-load-breathe{animation:obsBreatheLoad 2.6s ease-in-out infinite;box-shadow:0 0 12px ${C.cyan},0 0 28px ${C.cyan}80}
          .obs-load-sonar{animation:obsSonarLoad 2s cubic-bezier(.22,1,.36,1) infinite;box-shadow:0 0 0 1px ${C.cyan}80}
        `}</style>
        <div className="obs-load-mesh" aria-hidden />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="relative flex w-3 h-3">
            <span className="absolute inline-flex h-full w-full rounded-full obs-load-sonar" style={{ background: C.cyan }} />
            <span className="relative inline-flex rounded-full h-3 w-3 obs-load-breathe" style={{ background: C.cyan }} />
          </div>
          <div className={`${mono} text-xs uppercase tracking-[0.4em]`} style={{ color: C.cyan }}>
            <Scramble value="Decrypting Intelligence..." duration={1200} />
          </div>
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: C.cyan }} />
        </div>
      </div>
    );
  }

  if (error || !report) return <Classified />;

  // Artist Indie plan gets a warm, encouraging template
  if ((report.plan_name || "").trim().toLowerCase() === "artist indie") {
    return <ArtistIndieReport report={report as any} />;
  }

  const tier = planTier(report.plan_name);
  const em = report.engagement_metrics || {};
  const re = report.revenue_economics || {};
  const geo = report.geo_hotspots || {};

  // ---- YouTube presence
  const yt = report.youtube_data || {};
  const ytSubscribers = Number(yt.subscribers ?? 0);
  const ytTotalViews = Number(yt.total_views ?? 0);
  const hasYouTubeData = ytSubscribers > 0 || ytTotalViews > 0;

  // ---- engagement KPIs
  const engagementScore = Number(em.engagement_score ?? em.engagementScore ?? 0);
  const retentionRate = Number(em.retention_rate ?? em.retentionRate ?? 0);
  const monthlyStreams = Number(em.monthly_streams ?? em.monthlyStreams ?? 0);
  const ltv = Number(re.ltv ?? re.ltv_projection ?? em.ltv ?? 0);

  // ---- monthly growth (bar)
  const monthlyGrowth: { month: string; value: number }[] =
    em.monthly_growth ?? em.monthlyGrowth ??
    Array.from({ length: 6 }, (_, i) => ({ month: `M${i + 1}`, value: Math.round(monthlyStreams * (0.6 + i * 0.1)) || (i + 1) * 1000 }));

  // ---- neural trajectory (multi-axis: streams area + SNIE line + social dots)
  const snieFinal = Number(report.digital_score ?? 0) || 72;
  const trajectoryRaw: any[] =
    em.trajectory ?? em.neural_trajectory ?? em.multi_axis ?? [];
  const trajectory: { label: string; streams: number; snie: number; social: number }[] =
    Array.isArray(trajectoryRaw) && trajectoryRaw.length
      ? trajectoryRaw.map((r: any, i: number) => ({
          label: r.label ?? r.month ?? r.week ?? `M${i + 1}`,
          streams: Number(r.streams ?? r.value ?? 0),
          snie: Number(r.snie ?? r.score ?? 0),
          social: Number(r.social ?? r.social_index ?? 0),
        }))
      : Array.from({ length: 8 }, (_, i) => {
          const base = (monthlyStreams || 850000) / 8;
          const wave = Math.sin(i / 1.6) * 0.25 + 1;
          return {
            label: `M${i + 1}`,
            streams: Math.round(base * (0.55 + i * 0.12) * wave),
            snie: Math.min(99, Math.round(snieFinal * (0.55 + i * 0.07))),
            social: Math.round(40 + i * 6 + Math.sin(i) * 8),
          };
        });
  const peakIdx = trajectory.reduce((best, p, i, a) => (p.streams > a[best].streams ? i : best), 0);
  const peakLabel = trajectory[peakIdx]?.label;


  // ---- consumption sources (doughnut)
  const sourcesObj = em.consumption_sources ?? em.sources ?? { organic: 60, algorithmic: 25, editorial: 15 };
  const sourceData = Object.entries(sourcesObj).map(([k, v]) => ({ name: k.charAt(0).toUpperCase() + k.slice(1), value: Number(v) }));
  const sourceColors = [C.cyan, C.cyanDim, "#2A2A2A", "#444", "#666"];

  // ---- revenue projection (area)
  const revProjection: { month: string; revenue: number }[] =
    re.projection ?? re.revenue_projection ??
    Array.from({ length: 12 }, (_, i) => ({ month: `M${i + 1}`, revenue: Math.round((ltv || 5000) * 0.08 * (i + 1) * (1 + i * 0.05)) }));

  // ---- conversion funnel
  const funnel = em.funnel ?? em.conversion_funnel ?? {
    streams: monthlyStreams || 1000000,
    listeners: Math.round((monthlyStreams || 1000000) * 0.38),
    saves: Math.round((monthlyStreams || 1000000) * 0.08),
    playlist_adds: Math.round((monthlyStreams || 1000000) * 0.018),
  };
  const funnelData = [
    { stage: "Streams", value: Number(funnel.streams) },
    { stage: "Listeners", value: Number(funnel.listeners ?? funnel.unique_listeners ?? 0) },
    { stage: "Saves", value: Number(funnel.saves ?? 0) },
    { stage: "Playlist Adds", value: Number(funnel.playlist_adds ?? funnel.adds ?? 0) },
  ];

  // ---- regional radar
  const regionsRaw: any[] = geo.top_cities ?? geo.cities ?? geo.top ?? geo.hotspots ?? [];
  const radarData = (Array.isArray(regionsRaw) ? regionsRaw : []).slice(0, 5).map((r: any) => ({
    region: r.name ?? r.city ?? r.country ?? "—",
    velocity: Number(r.velocity ?? r.score ?? r.value ?? 0),
  }));

  // ---- TikTok vs DSP correlation
  const correlation: { week: string; tiktok: number; dsp: number }[] =
    em.tiktok_dsp ?? em.viral_correlation ??
    Array.from({ length: 12 }, (_, i) => ({
      week: `W${i + 1}`,
      tiktok: Math.round(2000 + i * 800 + Math.random() * 1500),
      dsp: Math.round(20000 + i * 4500 + Math.random() * 3000),
    }));

  // ---- revenue streams table
  const revStreams: { source: string; revenue: number; growth: number }[] =
    re.streams ?? re.revenue_streams ?? [
      { source: "Streaming Royalties", revenue: 48200, growth: 18.4 },
      { source: "Sync & Licensing", revenue: 12400, growth: 32.1 },
      { source: "Merch & D2C", revenue: 8800, growth: 11.7 },
      { source: "Live & Touring", revenue: 31500, growth: 24.6 },
    ];

  // ---- NPV model
  const npv: { year: string; cashflow: number; discounted: number; cumulative: number }[] =
    re.npv ?? re.npv_model ?? (() => {
      const r = 0.1;
      let cum = 0;
      return Array.from({ length: 5 }, (_, i) => {
        const cf = Math.round((ltv || 25000) * (1 + i * 0.15));
        const disc = Math.round(cf / Math.pow(1 + r, i + 1));
        cum += disc;
        return { year: `Y${i + 1}`, cashflow: cf, discounted: disc, cumulative: cum };
      });
    })();

  const reportDate = new Date(report.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: C.bg, color: C.white }}>
      {/* Animated mesh background */}
      <style>{`
        @keyframes obsidianMesh {
          0%   { transform: translate3d(0,0,0) scale(1); }
          50%  { transform: translate3d(2%, -1%, 0) scale(1.05); }
          100% { transform: translate3d(0,0,0) scale(1); }
        }
        @keyframes obsidianBreathe {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50%      { opacity: 1;    transform: scale(1.35); }
        }
        .obs-mesh {
          position: absolute; inset: -10%;
          background:
            radial-gradient(45% 35% at 20% 30%, rgba(0,196,181,0.10) 0%, transparent 60%),
            radial-gradient(40% 30% at 80% 20%, rgba(14,132,123,0.12) 0%, transparent 60%),
            radial-gradient(50% 40% at 60% 80%, rgba(0,196,181,0.08) 0%, transparent 65%),
            radial-gradient(30% 25% at 10% 90%, rgba(14,132,123,0.10) 0%, transparent 60%);
          filter: blur(40px);
          animation: obsidianMesh 28s ease-in-out infinite;
          pointer-events: none;
          z-index: 0;
        }
        .obs-breathe {
          animation: obsidianBreathe 2.6s ease-in-out infinite;
          box-shadow: 0 0 12px ${C.cyan}, 0 0 28px ${C.cyan}80;
        }
        @keyframes obsidianSonar {
          0%   { transform: scale(1);   opacity: 0.7; }
          100% { transform: scale(3.6); opacity: 0; }
        }
        .obs-sonar {
          animation: obsidianSonar 2s cubic-bezier(0.22,1,0.36,1) infinite;
          box-shadow: 0 0 0 1px ${C.cyan}80;
        }
        .obs-chart-glow .recharts-line .recharts-curve,
        .obs-chart-glow .recharts-area-area,
        .obs-chart-glow .recharts-radar-polygon {
          filter: drop-shadow(0 0 6px ${C.cyan}AA);
        }
        .obs-chart-glow .recharts-bar-rectangle path {
          filter: drop-shadow(0 0 6px ${C.cyan}80);
        }
      `}</style>
      <div className="obs-mesh" aria-hidden />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ---------- Header ---------- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <header className="flex items-start justify-between gap-6 mb-12 pb-8 border-b" style={{ borderColor: "rgba(0,196,181,0.15)" }}>
            <div className="min-w-0 flex-1">
              <div className={`${mono} text-[10px] uppercase tracking-[0.35em] mb-4 flex items-center gap-2`} style={{ color: C.cyan }}>
                <span className="w-1.5 h-1.5 rounded-full obs-breathe" style={{ background: C.cyan }} />
                SONGSS Intelligence
              </div>
              <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.05] mb-5" style={{ color: C.white }}>
                {report.artist_name || "Untitled Artist"}
              </h1>
              <div className="flex flex-wrap items-center gap-2.5">
                {report.plan_name && (
                  <span className={`${mono} text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border`}
                    style={{ borderColor: C.cyan, color: C.cyan }}>
                    {report.plan_name}
                  </span>
                )}
                <span className={`${mono} text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border flex items-center gap-2`}
                  style={{ borderColor: "rgba(0,196,181,0.20)", color: C.gray }}>
                  <span className="relative flex w-2 h-2">
                    <span className="absolute inline-flex h-full w-full rounded-full obs-sonar" style={{ background: C.cyan }} />
                    <span className="absolute inline-flex h-full w-full rounded-full obs-breathe" style={{ background: C.cyan }} />
                    <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: C.cyan }} />
                  </span>
                  Neural Engine Active
                </span>
                <span className={`${mono} text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border flex items-center gap-1.5`}
                  style={{ borderColor: "rgba(0,196,181,0.20)", color: C.gray }}>
                  <Calendar className="w-3 h-3" /> {reportDate}
                </span>
              </div>
            </div>
            <div className="hidden sm:block shrink-0">
              <ScoreRing score={Number(report.digital_score ?? 0)} />
            </div>
          </header>
          <div className="sm:hidden mb-10 flex justify-center">
            <ScoreRing score={Number(report.digital_score ?? 0)} />
          </div>
        </motion.div>

        {/* ---------- KPI Cards ---------- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {[
              { label: "Engagement Score", value: engagementScore, suffix: "", icon: Activity, decimals: 1 },
              { label: "Retention Rate", value: retentionRate, suffix: "%", icon: Users, decimals: 1 },
              { label: "Monthly Streams", value: monthlyStreams, suffix: "", icon: TrendingUp, decimals: 0, compact: true },
              { label: "LTV Projection", value: ltv, suffix: "", icon: DollarSign, decimals: 0, currency: true },
            ].map((k, i) => (
              <motion.div
                key={k.label}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-xl border p-5"
                style={glassStyle}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: C.gray }}>{k.label}</span>
                  <k.icon className="w-3.5 h-3.5" style={{ color: C.cyan, filter: `drop-shadow(0 0 6px ${C.cyan}AA)` }} />
                </div>
                <div className={`${mono} text-3xl font-semibold`} style={{ color: C.white }}>
                  {k.currency ? <Scramble value={fmtUSD(k.value)} />
                    : k.compact ? <Scramble value={fmtCompact(k.value)} />
                    : <Scramble value={`${k.value.toFixed(k.decimals)}${k.suffix}`} />}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ---------- Charts ---------- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.30, ease: [0.22, 1, 0.36, 1] }}
          className="obs-chart-glow grid grid-cols-1 lg:grid-cols-2 gap-5 mb-12"
        >
          {/* Always: Neural Multi-Axis Trajectory */}
          <div className="lg:col-span-2">
            <ChartPanel title="Neural Trajectory" subtitle="Streams · SNIE™ Score · Social Index — multi-axis projection">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trajectory} margin={{ top: 16, right: 16, left: 0, bottom: 4 }}>
                  <defs>
                    <linearGradient id="ntStreams" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.cyan} stopOpacity={0.45} />
                      <stop offset="100%" stopColor={C.cyan} stopOpacity={0} />
                    </linearGradient>
                    <filter id="ntGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="3" result="b" />
                      <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid stroke={C.border} strokeDasharray="2 4" vertical={false} />
                  <XAxis dataKey="label" stroke={C.gray} fontSize={11} tickLine={false} axisLine={{ stroke: C.border }} />
                  <YAxis yAxisId="left" stroke={C.gray} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => fmtCompact(v)} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} stroke={C.gray} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ stroke: `${C.cyan}55`, strokeWidth: 1, strokeDasharray: "3 3" }}
                    formatter={(v: any, name: any) => {
                      if (name === "Streams") return [fmtNum(Number(v)), "Streams"];
                      if (name === "SNIE™") return [`${Number(v).toFixed(0)} / 100`, "SNIE™"];
                      if (name === "Social") return [`${Number(v).toFixed(0)}`, "Social Index"];
                      return [v, name];
                    }}
                  />
                  <ReferenceLine
                    yAxisId="left"
                    x={peakLabel}
                    stroke="#F5C84B"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{ value: "NIE™ Predictive Flag", position: "top", fill: "#F5C84B", fontSize: 10, fontFamily: "ui-monospace, monospace" }}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    name="Streams"
                    dataKey="streams"
                    stroke={C.cyan}
                    strokeWidth={2}
                    fill="url(#ntStreams)"
                    filter="url(#ntGlow)"
                    isAnimationActive
                    animationDuration={1600}
                    animationEasing="ease-out"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    name="SNIE™"
                    dataKey="snie"
                    stroke="#F5C84B"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    dot={false}
                    filter="url(#ntGlow)"
                    isAnimationActive
                    animationDuration={1800}
                    animationEasing="ease-out"
                  />
                  <Scatter
                    yAxisId="right"
                    name="Social"
                    dataKey="social"
                    fill={C.white}
                    shape={(props: any) => (
                      <circle cx={props.cx} cy={props.cy} r={4} fill={C.white} stroke={C.cyan} strokeWidth={1} style={{ filter: `drop-shadow(0 0 6px ${C.white}AA)` }} />
                    )}
                    isAnimationActive
                    animationDuration={1400}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartPanel>
          </div>

          {/* Growth+: Consumption Sources */}
          {has(tier, "growth") && (
            <ChartPanel title="Consumption Sources" subtitle="Organic vs algorithmic vs editorial">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sourceData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={92} paddingAngle={3} stroke="none" animationDuration={1200}>
                    {sourceData.map((_, i) => <Cell key={i} fill={sourceColors[i % sourceColors.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `${v}%`} />
                  <Legend wrapperStyle={{ color: C.gray, fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartPanel>
          )}

          {/* Growth+: Revenue Projection */}
          {has(tier, "growth") && (
            <ChartPanel title="Revenue Projection" subtitle="12-month modeled cashflow">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revProjection}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.cyan} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={C.cyan} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" stroke={C.gray} fontSize={11} tickLine={false} axisLine={{ stroke: C.border }} />
                  <YAxis stroke={C.gray} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${fmtCompact(v)}`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => fmtUSD(Number(v))} />
                  <Area type="monotone" dataKey="revenue" stroke={C.cyan} strokeWidth={2} fill="url(#revGrad)" animationDuration={1400} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartPanel>
          )}

          {/* Pro+: Conversion Funnel */}
          {has(tier, "pro") && (
            <ChartPanel title="Conversion Funnel" subtitle="Streams → Listeners → Saves → Playlist Adds">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid stroke={C.border} strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" stroke={C.gray} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => fmtCompact(v)} />
                  <YAxis type="category" dataKey="stage" stroke={C.gray} fontSize={11} tickLine={false} axisLine={false} width={90} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: `${C.cyan}10` }} formatter={(v: any) => fmtNum(Number(v))} />
                  <Bar dataKey="value" fill={C.cyan} radius={[0, 4, 4, 0]} animationDuration={1200} />
                </BarChart>
              </ResponsiveContainer>
            </ChartPanel>
          )}

          {/* Pro+: Regional Velocity */}
          {has(tier, "pro") && radarData.length > 0 && (
            <ChartPanel title="Regional Velocity" subtitle="Top 5 markets · momentum index">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke={C.border} />
                  <PolarAngleAxis dataKey="region" stroke={C.gray} tick={{ fill: C.gray, fontSize: 11 }} />
                  <PolarRadiusAxis stroke={C.border} tick={{ fill: C.gray, fontSize: 10 }} />
                  <Radar dataKey="velocity" stroke={C.cyan} fill={C.cyan} fillOpacity={0.3} animationDuration={1400} />
                  <Tooltip contentStyle={tooltipStyle} />
                </RadarChart>
              </ResponsiveContainer>
            </ChartPanel>
          )}

          {/* Pro+: Engagement Profile Radar */}
          {has(tier, "pro") && (() => {
            const engagementRadar = [
              { axis: "Engagement", value: Math.min(100, Number(engagementScore) || 0) },
              { axis: "Retention", value: Math.min(100, Number(retentionRate) || 0) },
              { axis: "Discovery", value: Math.min(100, Number(em.discovery_rate ?? em.discoveryRate ?? 62)) },
              { axis: "Virality", value: Math.min(100, Number(em.virality_score ?? em.viralityScore ?? 48)) },
              { axis: "Loyalty", value: Math.min(100, Number(em.loyalty_index ?? em.loyaltyIndex ?? 71)) },
              { axis: "Saves Rate", value: Math.min(100, Number(em.saves_rate ?? em.savesRate ?? 35)) },
            ];
            return (
              <ChartPanel title="Engagement Profile" subtitle="Multi-axis behavioral signature">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={engagementRadar}>
                    <PolarGrid stroke={C.border} />
                    <PolarAngleAxis dataKey="axis" stroke={C.gray} tick={{ fill: C.gray, fontSize: 11 }} />
                    <PolarRadiusAxis stroke={C.border} tick={{ fill: C.gray, fontSize: 10 }} domain={[0, 100]} />
                    <Radar dataKey="value" stroke={C.cyan} fill={C.cyan} fillOpacity={0.3} animationDuration={1400} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `${Number(v).toFixed(0)}`} />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartPanel>
            );
          })()}

          {/* Enterprise+: TikTok vs DSP */}
          {has(tier, "enterprise") && (
            <ChartPanel title="TikTok × DSP Correlation" subtitle="Viral signal vs streaming response">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={correlation}>
                  <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="week" stroke={C.gray} fontSize={11} tickLine={false} axisLine={{ stroke: C.border }} />
                  <YAxis yAxisId="left" stroke={C.cyan} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => fmtCompact(v)} />
                  <YAxis yAxisId="right" orientation="right" stroke={C.cyanDim} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => fmtCompact(v)} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => fmtNum(Number(v))} />
                  <Legend wrapperStyle={{ color: C.gray, fontSize: 11 }} />
                  <Line yAxisId="left" type="monotone" dataKey="tiktok" stroke={C.cyan} strokeWidth={2} dot={false} name="TikTok" animationDuration={1400} />
                  <Line yAxisId="right" type="monotone" dataKey="dsp" stroke={C.cyanDim} strokeWidth={2} dot={false} name="DSP Streams" animationDuration={1400} />
                </LineChart>
              </ResponsiveContainer>
            </ChartPanel>
          )}
        </motion.div>

        {/* ---------- YouTube Presence ---------- */}
        {hasYouTubeData && (
          <Reveal>
            <div className="mb-12">
              <div className="flex items-center gap-2.5 mb-5">
                <Youtube className="w-4 h-4" style={{ color: C.cyan, filter: `drop-shadow(0 0 6px ${C.cyan}AA)` }} />
                <span className={`${mono} text-[10px] uppercase tracking-[0.25em]`} style={{ color: C.cyan }}>
                  Your YouTube Presence
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Subscribers", value: ytSubscribers },
                  { label: "Total Views",  value: ytTotalViews  },
                ].map((k, i) => (
                  <motion.div
                    key={k.label}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="rounded-xl border p-5"
                    style={glassStyle}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: C.gray }}>{k.label}</span>
                      <Youtube className="w-3.5 h-3.5" style={{ color: C.cyan, filter: `drop-shadow(0 0 6px ${C.cyan}AA)` }} />
                    </div>
                    <div className={`${mono} text-3xl font-semibold`} style={{ color: C.white }}>
                      <Scramble value={fmtCompact(k.value)} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </Reveal>
        )}

        {/* Active Glocalization Strategy — Neural World Map */}
        <Reveal>
          <Panel
            title="Active Glocalization Strategy"
            subtitle="Neural world map · live geo-hotspot intelligence"
            className="mb-5"
          >
            <NeuralWorldMap hotspots={normalizeHotspots(report.geo_hotspots)} />
            <div className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: C.gray }}>
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: C.cyan, boxShadow: `0 0 10px ${C.cyan}` }} />
              <span style={{ color: C.cyan }}>{(normalizeHotspots(report.geo_hotspots).length || 3)} active markets</span>
              <span style={{ color: C.grayDim }}>·</span>
              <span>Hover any pulse for tactical opportunity</span>
            </div>
          </Panel>
        </Reveal>

        {/* Enterprise+: Revenue Streams Table */}
        {has(tier, "enterprise") && (
          <Reveal>
            <Panel title="Revenue Streams" subtitle="Source contribution and YoY growth" className="mb-5">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left" style={{ color: C.gray }}>
                      <th className="py-3 text-[10px] uppercase tracking-[0.2em] font-medium">Source</th>
                      <th className="py-3 text-[10px] uppercase tracking-[0.2em] font-medium text-right">Revenue</th>
                      <th className="py-3 text-[10px] uppercase tracking-[0.2em] font-medium text-right">Growth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revStreams.map((r, i) => (
                      <tr key={i} className="border-t" style={{ borderColor: C.border }}>
                        <td className="py-3.5" style={{ color: C.white }}>{r.source}</td>
                        <td className={`py-3.5 text-right ${mono}`} style={{ color: C.white }}>{fmtUSD(Number(r.revenue))}</td>
                        <td className={`py-3.5 text-right ${mono}`} style={{ color: Number(r.growth) >= 0 ? C.cyan : "#FF6B6B" }}>
                          {Number(r.growth) >= 0 ? "+" : ""}{Number(r.growth).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </Reveal>
        )}

        {/* Enterprise+: NPV Model Table */}
        {has(tier, "enterprise") && (
          <Reveal>
            <Panel title="NPV Financial Model" subtitle="5-year discounted cashflow @ 10%" className="mb-12">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left" style={{ color: C.gray }}>
                      <th className="py-3 text-[10px] uppercase tracking-[0.2em] font-medium">Year</th>
                      <th className="py-3 text-[10px] uppercase tracking-[0.2em] font-medium text-right">Cashflow</th>
                      <th className="py-3 text-[10px] uppercase tracking-[0.2em] font-medium text-right">Discounted</th>
                      <th className="py-3 text-[10px] uppercase tracking-[0.2em] font-medium text-right">Cumulative NPV</th>
                    </tr>
                  </thead>
                  <tbody>
                    {npv.map((r, i) => (
                      <tr key={i} className="border-t" style={{ borderColor: C.border }}>
                        <td className={`py-3.5 ${mono}`} style={{ color: C.white }}>{r.year}</td>
                        <td className={`py-3.5 text-right ${mono}`} style={{ color: C.white }}>{fmtUSD(Number(r.cashflow))}</td>
                        <td className={`py-3.5 text-right ${mono}`} style={{ color: C.white }}>{fmtUSD(Number(r.discounted))}</td>
                        <td className={`py-3.5 text-right ${mono}`} style={{ color: C.cyan }}>{fmtUSD(Number(r.cumulative))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </Reveal>
        )}

        {/* ---------- Markdown Analysis ---------- */}
        {report.report_markdown && (
          <Reveal>
            <Panel title="Executive Analysis" subtitle="Powered by Songss Neural Intelligence Engine™" className="mb-12">
              <div className="prose prose-invert max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-h1:text-3xl prose-h2:text-2xl prose-h2:mt-10 prose-h3:text-xl prose-p:leading-[1.9] prose-p:text-[15px] prose-li:leading-[1.8] prose-strong:text-white prose-a:text-[#00C4B5] prose-a:no-underline hover:prose-a:underline prose-blockquote:border-l-4 prose-blockquote:border-[#00C4B5] prose-blockquote:bg-[#0B0B0B] prose-blockquote:py-1 prose-blockquote:px-5 prose-blockquote:rounded-r-md prose-blockquote:not-italic prose-code:font-mono prose-code:text-[#00C4B5] prose-code:bg-[#0B0B0B] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-hr:border-[#1A1A1A] prose-th:text-[#00C4B5] prose-th:uppercase prose-th:tracking-wider prose-th:text-xs prose-td:font-mono"
                style={{ color: "#D4D4D4" }}>
                <Typewriter text={report.report_markdown} cps={260}>
                  {(shown) => (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {shown}
                    </ReactMarkdown>
                  )}
                </Typewriter>
              </div>
            </Panel>
          </Reveal>
        )}

        {/* ---------- Footer CTA ---------- */}
        <Reveal>
          <div className="rounded-xl border p-8 sm:p-10 text-center" style={{ background: C.card, borderColor: C.border }}>
            <div className="inline-flex items-center gap-2 mb-5">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex h-full w-full rounded-full obs-sonar" style={{ background: C.cyan }} />
                <span className="absolute inline-flex h-full w-full rounded-full obs-breathe" style={{ background: C.cyan }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: C.cyan }} />
              </span>
              <span className={`${mono} text-[10px] uppercase tracking-[0.3em]`} style={{ color: C.cyan }}>Neural Engine Active</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold mb-3" style={{ color: C.white }}>Ready to operationalize this intelligence?</h2>
            <p className="text-sm mb-7 max-w-md mx-auto" style={{ color: C.gray }}>
              Book a private session with our strategy team to translate this dossier into a 90-day execution plan.
            </p>
            <a
              href="mailto:hello@songssintelligence.com"
              className="inline-flex items-center gap-2 rounded-lg px-6 py-3.5 text-xs font-bold uppercase tracking-[0.2em] transition-all hover:scale-[1.02]"
              style={{ background: C.cyan, color: C.bg }}
            >
              <Mail className="w-4 h-4" />
              Schedule Strategy Session
            </a>
            <div className={`${mono} mt-8 text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-2`} style={{ color: C.grayDim }}>
              <ShieldCheck className="w-3 h-3" /> Confidential · Session {report.session_id.slice(0, 8)}
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
