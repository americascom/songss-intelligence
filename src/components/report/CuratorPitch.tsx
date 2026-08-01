import { Heart } from "lucide-react";
import { Section, C, glass } from "./shared";

interface CuratorPitchProps {
  curatorPitch: string;
  delay?: number;
}

export function CuratorPitch({ curatorPitch, delay = 0.26 }: CuratorPitchProps) {
  return (
    <Section delay={delay}>
      <div className="rounded-xl border p-7 sm:p-9 mb-14 relative overflow-hidden" style={glass}>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full"
          style={{ background: `radial-gradient(circle, ${C.cyan}22 0%, transparent 70%)` }} />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-4 h-4" style={{ color: C.cyan }} />
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: C.cyan }}>Your Curator Pitch</h3>
          </div>
          <div
            className="prose prose-invert max-w-none prose-p:leading-[1.85] prose-p:text-[15px] prose-strong:text-white"
            style={{ color: "#D8D8D8" }}
            dangerouslySetInnerHTML={{ __html: curatorPitch }}
          />
        </div>
      </div>
    </Section>
  );
}
