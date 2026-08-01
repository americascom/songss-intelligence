import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Music } from "lucide-react";
import { Section, C, mono, glass, tooltipStyle, fmtCompact } from "./shared";

interface NeuralTrajectoryProps {
  trajectory: Array<{ month: string; streams: number }>;
  delay?: number;
}

export function NeuralTrajectory({ trajectory, delay = 0.10 }: NeuralTrajectoryProps) {
  return (
    <Section delay={delay}>
      <div className="rounded-xl border p-6 mb-14" style={glass}>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: C.cyan }}>Neural Trajectory</h3>
            <p className="text-xs mt-1" style={{ color: C.gray }}>Stream momentum over the next 6 months</p>
            <p className="text-[10px] mt-1 italic" style={{ color: C.grayDim }} title="Projected using a baseline 2%/month growth assumption, scaled by audience loyalty.">
              Projected using a baseline 2%/month growth assumption, scaled by audience loyalty.
            </p>
          </div>
          <Music className="w-4 h-4" style={{ color: C.cyan }} />
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trajectory} margin={{ top: 10, right: 16, left: 0, bottom: 4 }}>
              <defs>
                <linearGradient id="trajGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.cyan} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={C.cyan} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={C.border} strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="month" stroke={C.gray} fontSize={11} tickLine={false} axisLine={{ stroke: C.border }} />
              <YAxis stroke={C.gray} fontSize={11} tickLine={false} axisLine={false} tickFormatter={fmtCompact} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [fmtCompact(Number(v)), "Streams"]} />
              <Area
                type="monotone" dataKey="streams"
                stroke={C.cyan} strokeWidth={3} fill="url(#trajGrad)"
                dot={{ r: 5, fill: C.cyan, stroke: C.white, strokeWidth: 1.5 }}
                activeDot={{ r: 7 }}
                animationDuration={1600}
                style={{ filter: `drop-shadow(0 0 8px ${C.cyan}AA)` }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Section>
  );
}
