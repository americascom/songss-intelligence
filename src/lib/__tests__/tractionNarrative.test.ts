// Plain-assertion test script for generateTractionNarrative -- no vitest/
// jest exists in this repo, so this runs via:
//   node_modules/.bin/esbuild src/lib/__tests__/tractionNarrative.test.ts
//     --bundle --platform=node --format=cjs --alias:@=./src
//     --outfile=/tmp/tractionNarrative.test.cjs && node /tmp/tractionNarrative.test.cjs
// Same "no new test framework, plain assertions" discipline as the SQL
// acceptance tests for get_current_traction/get_observed_growth.
import assert from "node:assert/strict";
import { generateTractionNarrative } from "../tractionNarrative";
import type { CurrentTraction, ObservedGrowth } from "@/components/report/shared";

function baseTraction(overrides: Partial<CurrentTraction> = {}): CurrentTraction {
  return {
    assessment_type: "current_snapshot",
    status: "available",
    current_traction_score: 92,
    traction_level: "high",
    artist_stage: "established",
    discovery_signal: "high",
    cross_platform_presence: "strong",
    viral_momentum_signal: "moderate",
    signals_used: [
      { signal: "spotify_monthly_listeners", source: "spotify", weight: 25, raw_value: 78447683, sub_score: 98 },
      { signal: "spotify_followers", source: "spotify", weight: 20, raw_value: 128902054, sub_score: 100 },
      { signal: "youtube_subscribers", source: "youtube", weight: 15, raw_value: 58400000, sub_score: 96 },
      { signal: "tiktok_followers", source: "tiktok", weight: 10, raw_value: 75200000, sub_score: 98 },
    ],
    missing_sources: [],
    confidence: "high",
    generated_at: "2026-09-06T15:00:00Z",
    ...overrides,
  };
}

function observedGrowth(overrides: Partial<ObservedGrowth> = {}): ObservedGrowth {
  return {
    metric: "spotify_monthly_listeners_growth_30d",
    value: 12.8,
    unit: "percent",
    status: "observed",
    assessment_type: "observed_growth",
    period_days: 30,
    baseline_value: 11118,
    current_value: 12540,
    confidence: "high",
    ...overrides,
  };
}

function collectingGrowth(overrides: Partial<ObservedGrowth> = {}): ObservedGrowth {
  return {
    metric: "spotify_monthly_listeners_growth_30d",
    value: null,
    unit: "percent",
    status: "collecting_history",
    assessment_type: "observed_growth",
    minimum_required_snapshots: 2,
    available_snapshots: 1,
    target_period_days: 30,
    confidence: "unavailable",
    ...overrides,
  };
}

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`PASS: ${name}`);
}

// ── Scenario 1: high traction, observed growth ──────────────────────────────
check("high traction + observed growth reflects strength and real growth", () => {
  const narrative = generateTractionNarrative({
    artistName: "Billie Eilish",
    traction: baseTraction(),
    growth: observedGrowth(),
  });
  assert.match(narrative, /92\/100/);
  assert.match(narrative, /\+12\.8%/);
  assert.match(narrative, /real, measured performance/i);
  assert.doesNotMatch(narrative, /collecting/i);
  const paragraphs = narrative.split("\n\n");
  assert.ok(paragraphs.length >= 3 && paragraphs.length <= 5, `expected 3-5 paragraphs, got ${paragraphs.length}`);
});

// ── Scenario 2: emerging traction, collecting history ───────────────────────
check("emerging traction + collecting_history explains data integrity, no percentage", () => {
  const narrative = generateTractionNarrative({
    artistName: "New Artist",
    traction: baseTraction({
      current_traction_score: 48,
      traction_level: "emerging",
      cross_platform_presence: "developing",
      viral_momentum_signal: "unavailable",
      missing_sources: ["tiktok_followers", "tiktok_engagement_rate", "instagram_followers"],
      confidence: "medium",
    }),
    growth: collectingGrowth(),
  });
  assert.match(narrative, /48\/100/);
  assert.match(narrative, /currently being collected/i);
  assert.match(narrative, /intentional data-integrity measure/i);
  assert.doesNotMatch(narrative, /%,/); // no "N%," growth-value pattern anywhere
  assert.match(narrative, /TikTok/); // missing source named transparently
});

// ── Scenario 3: strong traction, missing sources ────────────────────────────
check("strong traction + missing sources acknowledges gaps without undermining confidence", () => {
  const narrative = generateTractionNarrative({
    artistName: "Rising Artist",
    traction: baseTraction({
      current_traction_score: 78,
      traction_level: "strong",
      discovery_signal: "moderate",
      cross_platform_presence: "developing",
      viral_momentum_signal: "unavailable",
      missing_sources: ["instagram_followers"],
      confidence: "high",
    }),
    growth: collectingGrowth({ available_snapshots: 0 }),
  });
  assert.match(narrative, /78\/100/);
  assert.match(narrative, /Instagram/);
  assert.match(narrative, /transparently excluded/i);
  assert.doesNotMatch(narrative, /should be treated as directional/i); // high confidence -> no hedge
});

// ── Scenario 4: low confidence uses more cautious language ──────────────────
check("low confidence produces cautious hedging language", () => {
  const narrative = generateTractionNarrative({
    artistName: "Small Artist",
    traction: baseTraction({
      current_traction_score: 22,
      traction_level: "low",
      confidence: "low",
      signals_used: [{ signal: "spotify_followers", source: "spotify", weight: 20, raw_value: 800, sub_score: 5 }],
      missing_sources: ["spotify_monthly_listeners", "youtube_subscribers", "youtube_channel_views", "tiktok_followers", "tiktok_engagement_rate", "instagram_followers"],
      discovery_signal: "unavailable",
      cross_platform_presence: "limited",
      viral_momentum_signal: "unavailable",
    }),
    growth: collectingGrowth({ available_snapshots: 0 }),
  });
  assert.match(narrative, /treated as directional rather than definitive/i);
});

// ── Scenario 5: market context present, labeled as macro only ──────────────
check("market context is labeled macro-only, never blended into artist growth", () => {
  const narrative = generateTractionNarrative({
    artistName: "Global Artist",
    traction: baseTraction(),
    growth: observedGrowth({
      market_context: {
        benchmark_type: "market_context",
        benchmark_id: "ifpi_gmr_2026_latam_2025",
        benchmarks_used: ["ifpi_gmr_2026_latam_17.1%"],
        source: "IFPI Global Music Report 2026",
        region_growth_percent: 17.1,
        global_growth_percent: 6.4,
        applicability: "recorded_music_revenue_market_level",
        not_artist_growth: true,
        note: "Macro recorded-music-revenue context only.",
      },
    }),
  });
  assert.match(narrative, /17\.1%/);
  assert.match(narrative, /macro industry context only/i);
  assert.match(narrative, /not a comparison to this artist's own performance/i);
});

// ── Edge case: traction unavailable -- must not fabricate a score ──────────
check("unavailable traction does not fabricate a score", () => {
  const narrative = generateTractionNarrative({
    artistName: "No Data Artist",
    traction: baseTraction({ status: "unavailable", current_traction_score: null, signals_used: [], missing_sources: ["spotify_followers"] }),
    growth: null,
  });
  assert.match(narrative, /not yet available/i);
  assert.doesNotMatch(narrative, /\/100/);
});

// ── Edge case: data_quality_flag on an observed anomalous drop ─────────────
check("data_quality_flag produces a caution sentence, still reports the real (flagged) value", () => {
  const narrative = generateTractionNarrative({
    artistName: "Anomaly Artist",
    traction: baseTraction(),
    growth: observedGrowth({ value: -62.4, baseline_value: 100000, current_value: 37600, data_quality_flag: true, confidence: "low" }),
  });
  assert.match(narrative, /-62\.4%/);
  assert.match(narrative, /flagged for review/i);
});

console.log(`\n=== ALL ${passed} SCENARIOS PASSED ===`);
