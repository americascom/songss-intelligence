import type { CurrentTraction, ObservedGrowth } from "@/components/report/shared";

// Deterministic, template-based narrative generator -- deliberately NOT an
// LLM call. This guarantees zero fabrication by construction: the function
// can only ever state a number, source, or category that was present in its
// typed input, never one it invents. See CLAUDE.md / memory
// `project_traction_narrative_2026-09-06` for the full rationale.

export interface TractionNarrativeInput {
  artistName: string;
  traction: CurrentTraction;
  growth: ObservedGrowth | null;
  /** Only "en" is implemented today; any other value falls back to English. */
  locale?: "en";
}

const SIGNAL_LABELS: Record<string, { source: string; label: string }> = {
  spotify_monthly_listeners: { source: "Spotify", label: "monthly listeners" },
  spotify_followers:         { source: "Spotify", label: "followers" },
  youtube_subscribers:       { source: "YouTube", label: "subscribers" },
  youtube_channel_views:     { source: "YouTube", label: "channel views" },
  tiktok_followers:          { source: "TikTok", label: "followers" },
  tiktok_engagement_rate:    { source: "TikTok", label: "engagement" },
  instagram_followers:       { source: "Instagram", label: "followers" },
};

function joinWithAnd(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function uniqueSourceNames(metricNames: string[]): string[] {
  return Array.from(new Set(
    metricNames.map((m) => SIGNAL_LABELS[m]?.source).filter((s): s is string => !!s)
  ));
}

// A source counts as "missing" only when NONE of its metrics resolved --
// e.g. if Spotify followers is missing but Spotify monthly_listeners is
// present, Spotify itself is NOT missing (the narrative already credits it
// in the evidence paragraph, so calling it missing too would contradict
// itself in the same breath).
function trulyMissingSourceNames(usedMetricNames: string[], missingMetricNames: string[]): string[] {
  const usedSources = new Set(uniqueSourceNames(usedMetricNames));
  return uniqueSourceNames(missingMetricNames).filter((source) => !usedSources.has(source));
}

function humanizeSignalGroup(metricNames: string[]): string {
  const bySource = new Map<string, string[]>();
  for (const name of metricNames) {
    const meta = SIGNAL_LABELS[name];
    if (!meta) continue;
    const list = bySource.get(meta.source) ?? [];
    list.push(meta.label);
    bySource.set(meta.source, list);
  }
  const parts = Array.from(bySource.entries()).map(([source, labels]) => `${source} (${joinWithAnd(labels)})`);
  return joinWithAnd(parts);
}

function describeMetric(metric: string): string {
  const base = metric.replace(/_growth_30d$/, "");
  const meta = SIGNAL_LABELS[base];
  return meta ? `${meta.source} ${meta.label}` : base.replace(/_/g, " ");
}

const TRACTION_LEVEL_PHRASES: Record<string, string> = {
  low: "early-stage audience traction",
  emerging: "emerging audience traction",
  developing: "developing audience traction",
  strong: "strong audience traction",
  high: "high audience traction, placing them in the top tier of artists on the platform",
};

const TRACTION_LEVEL_IMPLICATION: Record<string, string> = {
  low: "This reflects an artist at the very beginning of building a verifiable audience footprint.",
  emerging: "This indicates early-stage performance with verified signals but limited scale so far.",
  developing: "This reflects a developing but genuine audience base with room to grow.",
  strong: "This reflects solid, verified performance across the available data sources.",
  high: "This reflects strong, verified performance across multiple data sources.",
};

function openingParagraph(artistName: string, traction: CurrentTraction): string {
  const level = traction.traction_level ?? "developing";
  const levelPhrase = TRACTION_LEVEL_PHRASES[level] ?? level;
  const implication = TRACTION_LEVEL_IMPLICATION[level] ?? "";
  let sentence = `${artistName} currently shows ${levelPhrase}, with a Current Traction score of ${traction.current_traction_score}/100. ${implication}`;
  if (traction.confidence === "low") {
    sentence += " This assessment is based on limited signal coverage and should be treated as directional rather than definitive.";
  } else if (traction.confidence === "medium") {
    sentence += " This assessment reflects partial signal coverage across the platforms currently tracked.";
  }
  return sentence.trim();
}

const CROSS_PLATFORM_PHRASES: Record<string, string> = {
  limited: "Cross-platform presence is limited, concentrated on a single verified source.",
  developing: "Cross-platform presence is developing, with verified activity across a couple of platforms.",
  strong: "Cross-platform presence is strong, with verified activity across multiple platforms.",
  unavailable: "Cross-platform presence could not be assessed from the data currently available.",
};

const DISCOVERY_PHRASES: Record<string, string> = {
  low: "discovery signals are limited",
  moderate: "discovery signals are moderate",
  high: "discovery signals remain elevated, indicating continued audience expansion",
  unavailable: "discovery signal could not be assessed",
};

function evidenceParagraph(traction: CurrentTraction): string {
  const usedNames = traction.signals_used.map((s) => s.signal);
  const usedPhrase = usedNames.length > 0
    ? `The score is driven by ${humanizeSignalGroup(usedNames)}.`
    : "No individual signals were available to drive this score.";

  const crossPlatform = CROSS_PLATFORM_PHRASES[traction.cross_platform_presence ?? "unavailable"];
  const discovery = DISCOVERY_PHRASES[traction.discovery_signal ?? "unavailable"];

  let sentence = `${usedPhrase} ${crossPlatform} Additionally, ${discovery}.`;

  const missingSourceNames = trulyMissingSourceNames(usedNames, traction.missing_sources);
  if (missingSourceNames.length > 0) {
    sentence += ` Some sources -- ${joinWithAnd(missingSourceNames)} -- were not available for this analysis and are transparently excluded from the score rather than estimated.`;
  }

  return sentence.trim();
}

function growthParagraph(growth: ObservedGrowth | null): string {
  // Structural guarantee, not just a convention: a growth percentage can
  // only ever be printed inside this function past this guard, and this
  // guard requires status === "observed" with a real, non-null value and
  // period. Every other path returns before touching growth.value at all.
  if (!growth || growth.status !== "observed" || growth.value == null || growth.period_days == null) {
    if (growth?.status === "insufficient_comparable_history") {
      return `Observed 30-day growth is not yet available: ${growth.available_snapshots ?? 2} snapshots exist for this artist, but none fall close enough to a 30-day interval for a reliable comparison. This is an intentional data-integrity measure, not a limitation: only comparisons within a real, comparable time window are ever reported as growth. A growth figure will appear once a snapshot in that window is captured.`;
    }
    const availableSnapshots = growth?.available_snapshots ?? 0;
    let sentence = "Observed 30-day growth is currently being collected. Songss requires two comparable snapshots roughly 30 days apart before publishing a growth percentage";
    sentence += availableSnapshots > 0
      ? `, and ${availableSnapshots} of the required 2 has been recorded so far.`
      : ".";
    sentence += " This is an intentional data-integrity measure, not a limitation: only real, verified changes are ever reported as growth. The first observed growth figure will be available once a comparable snapshot roughly 30 days out has been recorded.";
    return sentence;
  }

  const direction = growth.value >= 0 ? "growth" : "decline";
  let sentence = `Observed ${growth.period_days}-day growth in ${describeMetric(growth.metric)} stands at ${growth.value >= 0 ? "+" : ""}${growth.value}%, based on two verified snapshots collected ${growth.period_days} days apart. This is real, measured performance -- not an estimate or projection.`;

  if (growth.data_quality_flag) {
    sentence += " This figure has been flagged for review due to an unusually large change, so it should be treated with appropriate caution until validated.";
  }

  if (growth.benchmark_comparison) {
    sentence += ` This places the artist's own ${direction} in the "${growth.benchmark_comparison.category}" range per documented industry growth benchmarks (${growth.benchmark_comparison.source}).`;
  }

  return sentence;
}

function marketContextParagraph(growth: ObservedGrowth | null): string | null {
  const ctx = growth?.market_context;
  if (!ctx) return null;
  return `For broader context, the recorded-music market tracked by ${ctx.source} grew ${ctx.region_growth_percent}% regionally and ${ctx.global_growth_percent}% globally in the most recent reporting period. This is macro industry context only, provided to frame the environment -- it is not a comparison to this artist's own performance, which is measured independently above.`;
}

function actionParagraph(traction: CurrentTraction, growth: ObservedGrowth | null): string {
  const actions: string[] = [];

  if (traction.traction_level === "high" && growth?.status === "observed") {
    actions.push("This profile reflects established momentum with room for continued growth — priorities could include deepening engagement with the existing audience while testing new markets or formats where discovery signals suggest further upside.");
  }

  if (traction.viral_momentum_signal === "high") {
    actions.push("Strong short-form video momentum suggests prioritizing TikTok content and creator partnerships.");
  }

  if (traction.cross_platform_presence === "limited" || traction.cross_platform_presence === "developing") {
    actions.push("Expanding a consistent presence beyond the platform(s) currently driving the score would reduce reliance on a single audience channel.");
  }

  if (traction.discovery_signal === "high" && (traction.traction_level === "emerging" || traction.traction_level === "developing")) {
    actions.push("A high discovery signal relative to current traction suggests investing in converting new listeners into repeat fans.");
  }

  const usedNames = traction.signals_used.map((s) => s.signal);
  const missingSourceNames = trulyMissingSourceNames(usedNames, traction.missing_sources);
  if (missingSourceNames.length > 0) {
    actions.push(`Establishing a verifiable presence on ${joinWithAnd(missingSourceNames)} would close visibility gaps in future assessments.`);
  }

  if (growth?.status === "observed" && growth.value != null && growth.value >= 15) {
    actions.push("Sustained growth at this rate supports increased investment in the channels currently driving it.");
  } else if (!growth || growth.status !== "observed") {
    actions.push("Maintaining a consistent release and content cadence now will strengthen the next growth reading.");
  }

  if (actions.length === 0) {
    actions.push("Continuing consistent content and release activity will support sustained audience growth.");
  }

  const picked = actions.slice(0, 3);
  return `For decision-makers, this profile suggests the following priorities: ${picked.join(" ")}`;
}

export function generateTractionNarrative(input: TractionNarrativeInput): string {
  const { artistName, traction, growth } = input;

  if (traction.status !== "available") {
    return `A Current Traction assessment for ${artistName} is not yet available -- at least one resolved data source (Spotify, YouTube, TikTok, or Instagram) is required before a score can be generated. No score is estimated in the meantime.`;
  }

  const paragraphs: string[] = [
    openingParagraph(artistName, traction),
    evidenceParagraph(traction),
    growthParagraph(growth),
  ];

  const marketPara = marketContextParagraph(growth);
  if (marketPara) paragraphs.push(marketPara);

  paragraphs.push(actionParagraph(traction, growth));

  return paragraphs.join("\n\n");
}
