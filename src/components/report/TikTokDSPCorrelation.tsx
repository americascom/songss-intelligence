import { Activity } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Section, SectionHeader, C, mono, glass, tooltipStyle, fmtCompact } from "./shared";

interface TikTokDSPData {
  week: string;
  tiktok: number;
  dsp: number;
}

interface TikTokDSPCorrelationProps {
  tiktokDSP: TikTokDSPData[];
  delay?: number;
}

export function TikTokDSPCorrelation({ tiktokDSP, delay = 0.38 }: TikTokDSPCorrelationProps) {
  return (
    <Section delay={delay}>
      <div className="rounded-2xl border mb-8 overflow-hidden" style={glass}>
        <SectionHeader
          emoji="📱"
          icon={Activity}
          title="TikTok × DSP Correlation"
          accent={C.cyan}
          badge={
            <span className={`${mono} text-[10px] px-2.5 py-1 rounded-md border`}
              style={{ background: `${C.cyan}12`, color: C.cyan, borderColor: `${C.cyan}30` }}>
              12-Week View
            </span>
          }
        />
        <div className="p-6">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
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
                  animationDuration={1400}
                  style={{ filter: `drop-shadow(0 0 4px ${C.cyan}88)` }}
                />
                <Line
                  yAxisId="r" type="monotone" dataKey="dsp"
                  stroke={C.cyanSoft} strokeWidth={2} dot={false} name="DSP Streams"
                  animationDuration={1400}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Section>
  );
}
