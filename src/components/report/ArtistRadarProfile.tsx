import * as React from "react";
import { Target } from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { Section, SectionHeader, C, mono, glass, tooltipStyle } from "./shared";
import { useIsPrinting, PRINT_CHART_WIDTH } from "@/hooks/useIsPrinting";

interface RadarDataPoint {
  axis: string;
  value: number;
  pending: boolean;
}

interface ArtistRadarProfileProps {
  radarData: RadarDataPoint[];
  delay?: number;
}

const CHART_HEIGHT = 384; // matches the h-96 container below

export function ArtistRadarProfile({ radarData, delay = 0.36 }: ArtistRadarProfileProps) {
  const isPrinting = useIsPrinting();
  const chart = (
    <RadarChart data={radarData} margin={{ top: 20, right: 72, bottom: 20, left: 72 }}>
      <PolarGrid stroke={C.border} />
      <PolarAngleAxis
        dataKey="axis"
        tick={{ fill: C.gray, fontSize: 12, fontFamily: "ui-monospace, monospace" }}
      />
      <PolarRadiusAxis
        stroke={C.border}
        tick={{ fill: C.grayDim, fontSize: 10 }}
        domain={[0, 100]}
        tickCount={5}
      />
      <Radar
        dataKey="value"
        stroke={C.cyan}
        fill={C.cyan}
        fillOpacity={0.25}
        strokeWidth={2}
        dot={{ r: 5, fill: C.cyan, stroke: C.white, strokeWidth: 1.5 } as any}
        style={{ filter: `drop-shadow(0 0 8px ${C.cyan}88)` }}
        isAnimationActive={!isPrinting}
        animationDuration={1600}
      />
      <Tooltip
        contentStyle={tooltipStyle}
        formatter={(v: any, _n: any, props: any) => [
          props?.payload?.pending ? "Pending Data" : `${Number(v).toFixed(0)} / 100`,
          "",
        ]}
      />
    </RadarChart>
  );
  return (
    <Section delay={delay}>
      <div className="rounded-2xl border mb-8 overflow-hidden" style={glass}>
        <SectionHeader
          emoji="🎯"
          icon={Target}
          title="Artist Radar Profile"
          accent={C.cyan}
          badge={
            <span className={`${mono} text-[10px] px-2.5 py-1 rounded-md border`}
              style={{ background: `${C.cyan}12`, color: C.cyan, borderColor: `${C.cyan}30` }}>
              6-Axis Analysis
            </span>
          }
        />
        <div className="p-6">
          <div className="h-96">
            {isPrinting
              ? React.cloneElement(chart, { width: PRINT_CHART_WIDTH, height: CHART_HEIGHT })
              : (
                <ResponsiveContainer width="100%" height="100%">
                  {chart}
                </ResponsiveContainer>
              )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
            {radarData.map((d) => (
              <div
                key={d.axis}
                className="rounded-lg px-4 py-3 border"
                style={{ borderColor: "rgba(0,196,181,0.12)", background: "rgba(0,196,181,0.04)" }}
              >
                <div className="text-[10px] uppercase tracking-[0.15em] mb-1" style={{ color: C.gray }}>{d.axis}</div>
                {d.pending ? (
                  <span
                    className={`${mono} text-[10px] font-semibold px-2 py-0.5 rounded-md border`}
                    style={{ color: C.grayDim, borderColor: "rgba(154,154,154,0.25)", background: "rgba(154,154,154,0.06)" }}
                    title="No data source yet for this axis — coming in a future release"
                  >
                    Pending Data
                  </span>
                ) : (
                  <div
                    className={`${mono} text-xl font-bold`}
                    style={{ color: d.value >= 70 ? C.cyan : d.value >= 50 ? C.cyanSoft : C.gray }}
                  >
                    {d.value.toFixed(0)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
