import { DollarSign } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Section, C, mono, glass, tooltipStyle, fmtUSD, fmtCompact } from "./shared";

interface RevenueData {
  source: string;
  revenue: number;
}

interface RevenueSnapshotProps {
  revenueSnapshot: RevenueData[];
  delay?: number;
}

export function RevenueSnapshot({ revenueSnapshot, delay = 0.28 }: RevenueSnapshotProps) {
  return (
    <Section delay={delay}>
      <div className="rounded-xl border p-6 mb-14" style={glass}>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: C.cyan }}>Revenue Snapshot</h3>
            <p className="text-xs mt-1" style={{ color: C.gray }}>Where the money is coming in today</p>
          </div>
          <DollarSign className="w-4 h-4" style={{ color: C.cyan }} />
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueSnapshot} margin={{ top: 10, right: 16, left: 0, bottom: 4 }}>
              <defs>
                <linearGradient id="revBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.cyanSoft} />
                  <stop offset="100%" stopColor={C.cyan} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={C.border} strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="source" stroke={C.gray} fontSize={11} tickLine={false} axisLine={{ stroke: C.border }} />
              <YAxis stroke={C.gray} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${fmtCompact(v)}`} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: `${C.cyan}10` }} formatter={(v: any) => fmtUSD(Number(v))} />
              <Bar dataKey="revenue" fill="url(#revBar)" radius={[8, 8, 0, 0]} animationDuration={1400} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Section>
  );
}
