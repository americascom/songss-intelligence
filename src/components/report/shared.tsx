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
