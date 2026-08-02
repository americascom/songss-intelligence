import * as React from "react";
import { flushSync } from "react-dom";

/**
 * Recharts' ResponsiveContainer measures its box exclusively via
 * ResizeObserver, which Chromium's print layout pass never services --
 * charts render blank (stale on-screen pixel dimensions clipped to a
 * narrower print-page box) unless handed explicit numbers instead of "100%".
 *
 * beforeprint fires after the browser has already reflowed the live DOM
 * under @media print, so getBoundingClientRect() at that moment reflects
 * the real print-page dimensions. Pass the returned size as
 * ResponsiveContainer's width/height (falling back to "100%" on screen).
 *
 * setPrintSize is wrapped in flushSync so the resulting DOM/SVG update
 * commits synchronously within this same beforeprint dispatch, rather than
 * relying on React's default async/batched scheduling to land before
 * Chromium captures the page -- inconsistent across sibling chart
 * components was traced to this exact race (2026-08-03).
 */
export function usePrintSize<T extends HTMLElement>() {
  const ref = React.useRef<T>(null);
  const [printSize, setPrintSize] = React.useState<{ width: number; height: number } | null>(null);

  React.useEffect(() => {
    const applyPrintSize = () => {
      if (!ref.current) return;
      // Force a synchronous layout flush before measuring -- getBoundingClientRect()
      // inside a beforeprint handler can otherwise race Chromium's own print-page
      // reflow for some elements, returning stale (pre-print) dimensions.
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      document.body.offsetHeight;
      const rect = ref.current.getBoundingClientRect();
      flushSync(() => {
        setPrintSize({ width: rect.width, height: rect.height });
      });
    };
    const clearPrintSize = () => setPrintSize(null);
    window.addEventListener("beforeprint", applyPrintSize);
    window.addEventListener("afterprint", clearPrintSize);
    return () => {
      window.removeEventListener("beforeprint", applyPrintSize);
      window.removeEventListener("afterprint", clearPrintSize);
    };
  }, []);

  return [ref, printSize] as const;
}
