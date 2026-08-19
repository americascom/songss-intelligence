import { DollarSign } from "lucide-react";
import { Section, SectionHeader, C, mono, glass, fmtUSD, LimitedChartState } from "./shared";

interface RevenueStream {
  source: string;
  revenue: number;
  growth: number;
}

interface NPVData {
  year: string;
  cashflow: number;
  discounted: number;
  cumulative: number;
}

interface RevenueModelAdvancedProps {
  revStreams: RevenueStream[] | null;
  npv: NPVData[] | null;
  delay?: number;
}

export function RevenueModelAdvanced({ revStreams, npv, delay = 0.40 }: RevenueModelAdvancedProps) {
  return (
    <Section delay={delay}>
      <div className="rounded-2xl border mb-8 overflow-hidden" style={glass}>
        <SectionHeader
          emoji="📊"
          icon={DollarSign}
          title="Revenue Model Advanced"
          accent={C.warm}
          badge={
            <span className={`${mono} text-[10px] px-2.5 py-1 rounded-md border`}
              style={{ background: `${C.warm}12`, color: C.warm, borderColor: `${C.warm}30` }}>
              5-Year NPV
            </span>
          }
        />
        {!revStreams || !npv ? (
          <div className="p-6 sm:p-8">
            <LimitedChartState />
          </div>
        ) : (
        <div className="p-6 sm:p-8 space-y-8">
          {/* Revenue streams */}
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] mb-4" style={{ color: C.gray }}>Revenue Streams</div>
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
          </div>
          {/* NPV projection */}
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] mb-4" style={{ color: C.gray }}>NPV Projection @ 10% Discount Rate</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ color: C.gray }}>
                    <th className="py-2.5 text-[10px] uppercase tracking-[0.2em] font-medium text-left">Year</th>
                    <th className="py-2.5 text-[10px] uppercase tracking-[0.2em] font-medium text-right">Cashflow</th>
                    <th className="py-2.5 text-[10px] uppercase tracking-[0.2em] font-medium text-right">Discounted</th>
                    <th className="py-2.5 text-[10px] uppercase tracking-[0.2em] font-medium text-right">Cumulative NPV</th>
                  </tr>
                </thead>
                <tbody>
                  {npv.map((r: any, i: number) => (
                    <tr key={i} className="border-t" style={{ borderColor: C.border }}>
                      <td className={`py-3 ${mono}`} style={{ color: C.white }}>{r.year}</td>
                      <td className={`py-3 text-right ${mono}`} style={{ color: C.white }}>{fmtUSD(Number(r.cashflow))}</td>
                      <td className={`py-3 text-right ${mono}`} style={{ color: C.white }}>{fmtUSD(Number(r.discounted))}</td>
                      <td className={`py-3 text-right ${mono}`} style={{ color: C.cyan }}>{fmtUSD(Number(r.cumulative))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        )}
      </div>
    </Section>
  );
}
