import { useEffect, useState } from "react";
import { DollarSign, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Section, SectionHeader, C, mono, glass, fmtUSD, LimitedChartState,
  CurrentTractionCard, ObservedGrowthCard, type CurrentTraction, type ObservedGrowth,
} from "./shared";

interface RevenueStream {
  source: string;
  revenue: number;
  growth: number;
}

interface RevenueModelAdvancedProps {
  revStreams: RevenueStream[] | null;
  sessionId?: string;
  delay?: number;
}

export function RevenueModelAdvanced({ revStreams, sessionId, delay = 0.40 }: RevenueModelAdvancedProps) {
  // Current Traction / Observed Growth own their own fetch rather than being
  // pre-computed props like their siblings -- this component only mounts for
  // Enterprise+ viewers in the first place, so a lower tier never triggers
  // the RPC calls at all. Replaces the old NPV Projection block, which
  // applied an undisclosed fixed 18%/yr growth assumption to the one real
  // ltv number -- see CLAUDE.md §4 2026-09-05/06.
  const [traction, setTraction] = useState<CurrentTraction | null>(null);
  const [growth, setGrowth]     = useState<ObservedGrowth | null>(null);

  useEffect(() => {
    if (!sessionId?.trim()) return;
    let stopped = false;
    (async () => {
      const [{ data: tData }, { data: gData }] = await Promise.all([
        supabase.rpc("get_current_traction" as any, { p_session_id: sessionId }) as any,
        supabase.rpc("get_observed_growth" as any, { p_session_id: sessionId }) as any,
      ]);
      if (stopped) return;
      if (tData) setTraction(tData as CurrentTraction);
      if (gData) setGrowth(gData as ObservedGrowth);
    })();
    return () => { stopped = true; };
  }, [sessionId]);

  return (
    <Section delay={delay}>
      <div className="rounded-2xl border mb-8 overflow-hidden" style={glass}>
        <SectionHeader
          emoji="📊"
          icon={DollarSign}
          title="Revenue Model Advanced"
          accent={C.warm}
        />
        <div className="p-6 sm:p-8 space-y-8">
          {/* Revenue streams */}
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] mb-4" style={{ color: C.gray }}>Revenue Streams</div>
            {!revStreams ? (
              <LimitedChartState />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ color: C.gray }}>
                      <th className="py-2.5 text-[10px] uppercase tracking-[0.2em] font-medium text-left">Source</th>
                      <th className="py-2.5 text-[10px] uppercase tracking-[0.2em] font-medium text-right">Revenue</th>
                      <th className="py-2.5 text-[10px] uppercase tracking-[0.2em] font-medium text-right">Growth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revStreams.map((r: any, i: number) => (
                      <tr key={i} className="border-t" style={{ borderColor: C.border }}>
                        <td className="py-3" style={{ color: C.white }}>{r.source}</td>
                        <td className={`py-3 text-right ${mono}`} style={{ color: C.white }}>{fmtUSD(Number(r.revenue))}</td>
                        <td className={`py-3 text-right ${mono}`} style={{ color: Number(r.growth) >= 0 ? C.cyan : "#FF6B6B" }}>
                          {Number(r.growth) >= 0 ? "+" : ""}{Number(r.growth).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {/* NPV projection removed entirely (2026-09-05): it applied two
              undisclosed, made-up constants (18%/yr cashflow growth, 10%
              discount rate) to the one real ltv number and presented the
              result as "NPV financial modeling" -- no real per-artist
              growth-rate/discount-rate data source has ever existed for
              this. Replaced (2026-09-06) with Current Traction (real,
              available from the first report) + Observed Growth (a real
              30-day delta, only once genuine snapshot history exists --
              never a fabricated or estimated percentage in the meantime).
              See get_current_traction()/get_observed_growth() RPCs. */}
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] mb-4" style={{ color: C.gray }}>Current Traction</div>
            <CurrentTractionCard traction={traction} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-3.5 h-3.5" style={{ color: C.gray }} />
              <div className="text-[10px] uppercase tracking-[0.2em]" style={{ color: C.gray }}>
                {growth?.status === "observed" ? "Observed Growth (30 Days)" : "History Collection in Progress"}
              </div>
            </div>
            <ObservedGrowthCard growth={growth} />
          </div>
        </div>
      </div>
    </Section>
  );
}
