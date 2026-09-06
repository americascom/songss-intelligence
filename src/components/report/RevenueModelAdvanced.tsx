import { DollarSign } from "lucide-react";
import { Section, SectionHeader, C, mono, glass, fmtUSD, LimitedChartState, PendingDataState } from "./shared";

interface RevenueStream {
  source: string;
  revenue: number;
  growth: number;
}

interface RevenueModelAdvancedProps {
  revStreams: RevenueStream[] | null;
  delay?: number;
}

export function RevenueModelAdvanced({ revStreams, delay = 0.40 }: RevenueModelAdvancedProps) {
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
              this. Honest Pending Data state instead of fabricating one,
              same discipline as revStreams itself. */}
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] mb-4" style={{ color: C.gray }}>NPV Projection</div>
            <PendingDataState message="Real per-artist NPV financial modeling requires additional data infrastructure and is not yet available." />
          </div>
        </div>
      </div>
    </Section>
  );
}
