import * as React from "react";
import { Activity } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Section, SectionHeader, C, mono, glass, tooltipStyle, fmtCompact, PendingDataState } from "./shared";
import { useIsPrinting, PRINT_CHART_WIDTH } from "@/hooks/useIsPrinting";

interface TikTokDSPData {
  week: string;
  tiktok: number;
  dsp: number;
}

interface TikTokDSPCorrelationProps {
  // null when no real per-artist TikTok-to-DSP correlation data exists yet
  // (currently always, since nothing in the n8n pipeline sets this field) --
  // previously fabricated a fake 12-week Math.sin()-noise dataset instead of
  // ever showing null. Removed 2026-09-05; renders Pending Data below.
  tiktokDSP: TikTokDSPData[] | null;
  delay?: number;
}

const CHART_HEIGHT = 288; // matches the h-72 container below

export function TikTokDSPCorrelation({ tiktokDSP, delay = 0.38 }: TikTokDSPCorrelationProps) {
  const isPrinting = useIsPrinting();
  const chart = tiktokDSP && (
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
        isAnimationActive={!isPrinting}
        animationDuration={1400}
        style={{ filter: `drop-shadow(0 0 4px ${C.cyan}88)` }}
      />
      <Line
        yAxisId="r" type="monotone" dataKey="dsp"
        stroke={C.cyanSoft} strokeWidth={2} dot={false} name="DSP Streams"
        isAnimationActive={!isPrinting}
        animationDuration={1400}
      />
    </LineChart>
  );
  return (
    <Section delay={delay}>
      <div className="rounded-2xl border mb-8 overflow-hidden" style={glass}>
        <SectionHeader
          emoji="📱"
          icon={Activity}
          title="TikTok × DSP Correlation"
          accent={C.cyan}
          badge={
            chart ? (
              <span className={`${mono} text-[10px] px-2.5 py-1 rounded-md border`}
                style={{ background: `${C.cyan}12`, color: C.cyan, borderColor: `${C.cyan}30` }}>
                12-Week View
              </span>
            ) : undefined
          }
        />
        <div className="p-6">
          <div className="h-72">
            {!chart
              ? (
                <PendingDataState message="Real per-artist TikTok-to-streaming correlation modeling is in development and not yet available." />
              )
              : isPrinting
              ? React.cloneElement(chart, { width: PRINT_CHART_WIDTH, height: CHART_HEIGHT })
              : (
                <ResponsiveContainer width="100%" height="100%">
                  {chart}
                </ResponsiveContainer>
              )}
          </div>
        </div>
      </div>
    </Section>
  );
}
