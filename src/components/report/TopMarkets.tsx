import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { Section, C, mono, glass } from "./shared";

interface Market {
  country: string;
  city: string | null;
  score: number;
  opportunity: string | null;
}

interface TopMarketsProps {
  markets: Market[];
  delay?: number;
}

export function TopMarkets({ markets, delay = 0.12 }: TopMarketsProps) {
  return (
    <Section delay={delay}>
      <div className="mb-14">
        <div className="mb-5 flex items-center gap-2 flex-wrap">
          <MapPin className="w-4 h-4" style={{ color: C.cyan }} />
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: C.cyan }}>Top 3 Markets</h3>
          <span
            className={`${mono} text-[9px] px-2.5 py-1 rounded-md border normal-case tracking-normal`}
            style={{ background: "rgba(154,154,154,0.08)", color: C.gray, borderColor: "rgba(154,154,154,0.25)" }}
          >
            AI-generated directional insight — not verified market data
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => {
            const m = markets[i] ?? null;
            if (!m) return (
              <div key={i} className="rounded-xl border p-6 opacity-30" style={glass}>
                <div className={`${mono} text-[10px] uppercase tracking-[0.2em] mb-1`} style={{ color: C.gray }}>#{i + 1}</div>
                <div className="text-xl font-semibold" style={{ color: C.white }}>Market Pending</div>
              </div>
            );
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + i * 0.08, duration: 0.6 }}
                className="rounded-xl border p-6"
                style={glass}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`${mono} text-[10px] uppercase tracking-[0.2em]`} style={{ color: C.gray }}>#{i + 1}</div>
                  <div className={`${mono} text-2xl font-semibold`} style={{ color: C.cyan }}>{m.score}</div>
                </div>
                <div className="text-xl font-semibold mb-1" style={{ color: C.white }}>{m.country}</div>
                {m.city && <div className="text-sm" style={{ color: C.gray }}>{m.city}</div>}
                {m.opportunity && (
                  <div className="mt-4 pt-4 border-t text-xs leading-relaxed" style={{ color: C.gray, borderColor: C.border }}>
                    {m.opportunity}
                  </div>
                )}
                <div className="mt-3 text-[10px] uppercase tracking-[0.2em]" style={{ color: C.grayDim }}>Potential Score</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
