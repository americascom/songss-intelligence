import * as React from "react";
import { flushSync } from "react-dom";

/**
 * Recharts' ResponsiveContainer measures its box exclusively via
 * ResizeObserver, which Chromium's print layout pass never services --
 * charts render blank, or size themselves off a stale on-screen
 * measurement, unless they're handed explicit dimensions instead of "100%".
 *
 * Rather than measuring the real box at print time (getBoundingClientRect
 * inside beforeprint proved racy against Recharts' own internal resize
 * handling -- see git history, 2026-08-09), report charts render at a
 * fixed width sized for A4 print, bypassing ResponsiveContainer entirely
 * during print so there's no residual ResizeObserver measurement at all.
 *
 * setIsPrinting is wrapped in flushSync so the branch swap (ResponsiveContainer
 * -> fixed-size chart) commits synchronously within this same beforeprint
 * dispatch, rather than relying on React's default async/batched scheduling
 * to land before Chromium captures the page.
 */
export function useIsPrinting() {
  const [isPrinting, setIsPrinting] = React.useState(false);

  React.useEffect(() => {
    const onBeforePrint = () => flushSync(() => setIsPrinting(true));
    const onAfterPrint = () => setIsPrinting(false);
    window.addEventListener("beforeprint", onBeforePrint);
    window.addEventListener("afterprint", onAfterPrint);
    return () => {
      window.removeEventListener("beforeprint", onBeforePrint);
      window.removeEventListener("afterprint", onAfterPrint);
    };
  }, []);

  return isPrinting;
}

// A4 (210mm) minus the report's @page margin (12mm each side) minus each
// chart card's own p-6 padding (24px each side) and a small safety margin
// for border/rounding -- see Report.tsx's `@page { size:A4; margin:12mm }`
// and each chart card's `p-6`. Deliberately shared/conservative rather than
// tuned per card: Peer Benchmark's card uses `p-6 sm:p-8`, which would leave
// a bit less room if that breakpoint applies during print, but it isn't one
// of the reported-broken charts and its content (2-5 short bars) is far
// less width-sensitive than the others.
export const PRINT_CHART_WIDTH = 650;
