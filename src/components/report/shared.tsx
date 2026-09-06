import { motion } from "framer-motion";
import React from "react";

// ── Constants ────────────────────────────────────────────────────────────────
export const C = {
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

export const mono = "font-mono tabular-nums";

export const glass: React.CSSProperties = {
  background: "linear-gradient(135deg, rgba(14,14,14,0.85) 0%, rgba(28,28,28,0.68) 100%)",
  borderColor: "rgba(0,196,181,0.18)",
  backdropFilter: "blur(22px) saturate(150%)",
  WebkitBackdropFilter: "blur(22px) saturate(150%)",
  boxShadow: "0 12px 48px -16px rgba(0,196,181,0.18), inset 0 1px 0 rgba(255,255,255,0.04)",
};

export const tooltipStyle: React.CSSProperties = {
  background: "rgba(11,11,11,0.94)",
  border: "1px solid rgba(0,196,181,0.35)",
  borderRadius: 8,
  color: C.white,
  fontSize: 12,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace",
  backdropFilter: "blur(8px)",
};

// ── Utilities ────────────────────────────────────────────────────────────────
export function fmtCompact(n: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export function fmtUSD(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

// ── "Limited" state (retention_rate / ltv_projection / growth_trajectory) ──
// These 3 fields are code-computed from real Spotify data and go `null`
// (never a fabricated fallback) whenever that data couldn't be trusted --
// including the artist-identity mismatch guard (e.g. MaLu/Maluma), where
// Apify resolved a different real artist entirely. Distinct from the
// softer "—" / native-tooltip convention used for social_engagement_index /
// fan_loyalty_index / industry_buzz (which just means "not enough source
// data yet") -- this is a louder, amber warning specifically for cases
// where a data-quality guard had to suppress an otherwise-computed number.
export const LIMITED_TOOLTIP = "This data could not be confirmed for this artist or period.";
export const LIMITED_LABEL = "⚠️ Limited";

// retention_rate/fan_loyalty_index are weighted-average ratio signals that
// clamp at 100 -- real for legacy/global-superstar artists whose cumulative
// Spotify followers exceed current monthly listeners (confirmed via a real
// Billie Eilish report landing on exactly 100 for both). The clamp is
// correct math, but a bare "100%" reads as a suspicious fabricated round
// number for exactly the artists most likely to hit it. "100%+" plus this
// tooltip makes the ceiling visible instead of silent.
export const CEILING_TOOLTIP = "This artist's cross-platform following has surpassed our measurement ceiling — a very strong loyalty signal, not a data error.";

export function LimitedBadge({ size = "sm" }: { size?: "sm" | "md" } = {}) {
  return (
    <span
      className={`${mono} ${size === "md" ? "text-xs px-3 py-1.5 gap-1.5" : "text-[10px] px-2 py-0.5 gap-1"} font-semibold rounded-md border inline-flex items-center`}
      style={{ color: C.warm, borderColor: `${C.warm}40`, background: `${C.warm}14` }}
      title={LIMITED_TOOLTIP}
    >
      {LIMITED_LABEL}
    </span>
  );
}

export function LimitedChartState() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-3 text-center px-6">
      <LimitedBadge size="md" />
      <p className="text-xs max-w-xs" style={{ color: C.grayDim }}>{LIMITED_TOOLTIP}</p>
    </div>
  );
}

// "Pending Data" (gray) is semantically distinct from "⚠️ Limited" (amber):
// Limited means a data-quality guard suppressed an otherwise-real, working
// signal (e.g. the Spotify identity-mismatch guard); Pending means the
// feature itself has no real data source implemented yet -- there was never
// a real number to suppress. Matches ArtistRadarProfile's existing
// pending-axis styling. Introduced 2026-09-05 replacing the TikTok x DSP
// Correlation and NPV Projection fabricated-data fallbacks.
export function PendingDataState({ message }: { message: string }) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-3 text-center px-6">
      <span
        className={`${mono} text-xs px-3 py-1.5 font-semibold rounded-md border inline-flex items-center gap-1.5`}
        style={{ color: C.grayDim, borderColor: "rgba(154,154,154,0.25)", background: "rgba(154,154,154,0.06)" }}
        title={message}
      >
        Pending Data
      </span>
      <p className="text-xs max-w-xs" style={{ color: C.grayDim }}>{message}</p>
    </div>
  );
}

// ── Current Traction / Observed Growth (real artist-performance model) ──────
// Types for get_current_traction()/get_observed_growth() RPCs. Current
// Traction is a classification of the artist's LATEST real signals -- never
// "growth". Observed Growth is only ever a real delta between two real
// snapshots ~30 days apart; before that history exists it honestly reports
// "collecting_history", never a fabricated or estimated percentage.
export interface TractionSignal {
  signal: string;
  source: string;
  weight: number;
  raw_value: number;
  sub_score: number;
}

export interface CurrentTraction {
  assessment_type: "current_snapshot";
  status: "available" | "unavailable" | "not_found";
  current_traction_score: number | null;
  traction_level?: "low" | "emerging" | "developing" | "strong" | "high";
  artist_stage?: "early" | "building" | "established" | "unknown";
  discovery_signal?: "low" | "moderate" | "high" | "unavailable";
  cross_platform_presence?: "limited" | "developing" | "strong" | "unavailable";
  viral_momentum_signal?: "low" | "moderate" | "high" | "unavailable";
  signals_used: TractionSignal[];
  missing_sources: string[];
  confidence: "low" | "medium" | "high" | "unavailable";
  generated_at?: string;
}

export interface BenchmarkComparison {
  benchmark_type: "benchmark_comparison";
  benchmark_id: string;
  benchmarks_used: string[];
  source: string;
  category: "estavel" | "saudavel" | "forte" | "breakout";
  not_artist_growth: false;
  applicability: string;
  note: string;
}

export interface MarketContext {
  benchmark_type: "market_context";
  benchmark_id: string;
  benchmarks_used: string[];
  source: string;
  region_growth_percent: number;
  global_growth_percent: number;
  applicability: string;
  not_artist_growth: true;
  note: string;
}

export interface ObservedGrowth {
  metric: string;
  value: number | null;
  unit: "percent";
  status: "collecting_history" | "insufficient_comparable_history" | "observed" | "unsupported_metric" | "not_found";
  assessment_type: "observed_growth";
  minimum_required_snapshots?: number;
  available_snapshots?: number;
  target_period_days?: number;
  period_days?: number;
  baseline_value?: number;
  current_value?: number;
  captured_from?: string;
  captured_to?: string;
  baseline_snapshot_id?: string;
  current_snapshot_id?: string;
  data_quality_flag?: boolean;
  confidence: "unavailable" | "low" | "medium" | "high";
  message?: string;
  benchmark_comparison?: BenchmarkComparison | null;
  market_context?: MarketContext;
}

const TRACTION_LEVEL_LABEL: Record<string, string> = {
  low: "Low", emerging: "Emerging", developing: "Developing", strong: "Strong", high: "High",
};

export function CurrentTractionCard({ traction }: { traction: CurrentTraction | null }) {
  if (!traction || traction.status !== "available") {
    return <PendingDataState message="Current Traction needs at least one resolved data source (Spotify, YouTube, TikTok, or Instagram) for this artist." />;
  }
  const badges: Array<{ label: string; value?: string }> = [
    { label: "Artist Stage", value: traction.artist_stage },
    { label: "Discovery Signal", value: traction.discovery_signal },
    { label: "Cross-Platform Presence", value: traction.cross_platform_presence },
    { label: "Viral Momentum Signal", value: traction.viral_momentum_signal },
  ];
  return (
    <div>
      <div className="flex items-baseline gap-3 mb-4">
        <span className={`${mono} text-4xl font-bold`} style={{ color: C.cyan }}>{traction.current_traction_score}</span>
        <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: C.grayDim }}>/ 100 &middot; {TRACTION_LEVEL_LABEL[traction.traction_level ?? ""] ?? traction.traction_level}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {badges.map((b) => (
          <div key={b.label} className="rounded-lg border p-3" style={{ borderColor: C.border, background: "rgba(255,255,255,0.02)" }}>
            <div className="text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: C.grayDim }}>{b.label}</div>
            <div className="text-xs font-semibold capitalize" style={{ color: b.value === "unavailable" ? C.grayDim : C.white }}>{b.value ?? "Unavailable"}</div>
          </div>
        ))}
      </div>
      <div className="text-[11px]" style={{ color: C.grayDim }}>
        Based on {traction.signals_used.length} real signal{traction.signals_used.length === 1 ? "" : "s"}
        {traction.missing_sources.length > 0 && <> &middot; missing: {traction.missing_sources.join(", ")}</>}
        {" "}&middot; confidence: {traction.confidence}
      </div>
    </div>
  );
}

export function ObservedGrowthCard({ growth }: { growth: ObservedGrowth | null }) {
  if (!growth || growth.status === "collecting_history" || growth.status === "insufficient_comparable_history" || growth.status === "not_found" || growth.status === "unsupported_metric") {
    return (
      <div>
        <PendingDataState message={growth?.message ?? "Observed 30-day growth is being collected and will appear once Songss has two comparable snapshots for this artist."} />
        {growth?.market_context && (
          <p className="mt-3 text-[11px] leading-relaxed" style={{ color: C.grayDim }}>{growth.market_context.note}</p>
        )}
      </div>
    );
  }
  const positive = (growth.value ?? 0) >= 0;
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className={`${mono} text-4xl font-bold`} style={{ color: positive ? C.cyan : "#FF6B6B" }}>
          {positive ? "+" : ""}{growth.value}%
        </span>
        <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: C.grayDim }}>over {growth.period_days} days</span>
      </div>
      {growth.data_quality_flag && (
        <div className="mb-2 text-[11px] font-semibold" style={{ color: C.warm }}>
          ⚠️ Flagged for review — an unusually large change was detected; treat this figure with caution.
        </div>
      )}
      {growth.benchmark_comparison && (
        <div className="mb-2 text-[11px]" style={{ color: C.grayDim }}>
          Classified as <span className="capitalize font-semibold" style={{ color: C.white }}>{growth.benchmark_comparison.category}</span> growth per {growth.benchmark_comparison.source} — {growth.benchmark_comparison.note}
        </div>
      )}
      {growth.market_context && (
        <p className="text-[11px] leading-relaxed" style={{ color: C.grayDim }}>{growth.market_context.note}</p>
      )}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────
export function SectionHeader({
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

export function Section({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
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

export function MarkdownCard({
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
