import { motion } from "framer-motion";
import { Instagram } from "lucide-react";
import { Section, C, mono, glass, fmtCompact } from "./shared";

interface InstagramPresenceProps {
  igFollowers: number;
  igFollowing: number;
  delay?: number;
}

export function InstagramPresence({ igFollowers, igFollowing, delay = 0.32 }: InstagramPresenceProps) {
  return (
    <Section delay={delay}>
      <div className="mb-14">
        <div className="mb-5 flex items-center gap-2">
          <Instagram className="w-4 h-4" style={{ color: C.cyan, filter: `drop-shadow(0 0 6px ${C.cyan}AA)` }} />
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: C.cyan }}>Your Instagram Presence</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[{ label: "Followers", value: igFollowers }, { label: "Following", value: igFollowing }].map((k, i) => (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32 + i * 0.06, duration: 0.6 }}
              className="rounded-xl border p-5"
              style={glass}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: C.gray }}>{k.label}</span>
                <Instagram className="w-3.5 h-3.5" style={{ color: C.cyan }} />
              </div>
              <div className={`${mono} text-3xl font-semibold`} style={{ color: C.white }}>{fmtCompact(k.value)}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}
