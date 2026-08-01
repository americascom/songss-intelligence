import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";
import { Section, C, mono, glass } from "./shared";

interface Recommendation {
  title: string;
  body: string;
}

interface ThreeMovesCardProps {
  recommendations: Recommendation[];
  delay?: number;
}

export function ThreeMovesCard({ recommendations, delay = 0.14 }: ThreeMovesCardProps) {
  return (
    <Section delay={delay}>
      <div className="mb-14">
        <div className="mb-5 flex items-center gap-2">
          <Lightbulb className="w-4 h-4" style={{ color: C.warm }} />
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: C.warm }}>Three Moves That Matter</h3>
        </div>
        <div className="space-y-3">
          {recommendations.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.14 + i * 0.1, duration: 0.6 }}
              className="rounded-xl border p-6 flex gap-5"
              style={glass}
            >
              <div
                className={`${mono} shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold`}
                style={{ background: `${C.cyan}15`, color: C.cyan, border: `1px solid ${C.cyan}55` }}
              >
                {i + 1}
              </div>
              <div className="min-w-0">
                <div className="text-lg font-semibold mb-1.5" style={{ color: C.white }}>{r.title}</div>
                {r.body && <div className="text-sm leading-relaxed" style={{ color: C.gray }}>{r.body}</div>}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}
