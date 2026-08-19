import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { Section, SectionHeader, C, mono, glass } from "./shared";

interface PyramidTier {
  tier: string;
  value: string;
  valueTitle?: string;
  color: string;
  badge?: string;
  badgeTitle?: string;
}

interface EngagementPyramidProps {
  engagementPyramid: PyramidTier[];
  delay?: number;
}

export function EngagementPyramid({ engagementPyramid, delay = 0.34 }: EngagementPyramidProps) {
  return (
    <Section delay={delay}>
      <div className="rounded-2xl border mb-8 overflow-hidden" style={glass}>
        <SectionHeader
          emoji="🔺"
          icon={TrendingUp}
          title="Engagement Pyramid"
          accent={C.cyan}
          badge={
            <span className={`${mono} text-[10px] px-2.5 py-1 rounded-md border`}
              style={{ background: `${C.cyan}12`, color: C.cyan, borderColor: `${C.cyan}30` }}>
              Audience Depth
            </span>
          }
        />
        <div className="p-6 sm:p-8 space-y-4">
          {engagementPyramid.map((t, i) => (
            <motion.div
              key={t.tier}
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.34 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto rounded-xl border p-4 sm:p-5"
              style={{
                width: `${100 - i * 22}%`,
                borderColor: `${t.color}30`,
                background: `${t.color}0C`,
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: C.gray }}>{t.tier}</div>
                  <div className={`${mono} text-lg sm:text-xl font-bold`} style={{ color: C.white }} title={t.valueTitle}>{t.value}</div>
                </div>
                {t.badge && (
                  <span
                    className={`${mono} text-xs font-semibold px-2.5 py-1 rounded-md border shrink-0`}
                    style={{ color: t.color, borderColor: `${t.color}40`, background: `${t.color}14` }}
                    title={t.badgeTitle}
                  >
                    {t.badge}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}
