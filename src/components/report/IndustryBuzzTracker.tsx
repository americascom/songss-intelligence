import { Newspaper } from "lucide-react";
import { Section, SectionHeader, C, mono, glass } from "./shared";

interface IndustryBuzz {
  sentiment: string | null;
  summary: string | null;
  notable_mentions: string[];
  citations: string[];
  search_context_size: string | null;
}

interface IndustryBuzzTrackerProps {
  industryBuzz: IndustryBuzz | null;
  summaryHtml: string;
  buzzBadge: { label: string; color: string } | null;
  delay?: number;
}

export function IndustryBuzzTracker({ industryBuzz, summaryHtml, buzzBadge, delay = 0.33 }: IndustryBuzzTrackerProps) {
  if (!industryBuzz?.summary) return null;

  return (
    <Section delay={delay}>
      <div className="rounded-2xl border mb-14 overflow-hidden" style={glass}>
        <SectionHeader
          emoji="📰"
          icon={Newspaper}
          title="Industry Buzz Tracker"
          accent={buzzBadge?.color || C.cyan}
          badge={
            buzzBadge && (
              <span
                className={`${mono} text-[10px] px-2.5 py-1 rounded-md border`}
                style={{ background: `${buzzBadge.color}12`, color: buzzBadge.color, borderColor: `${buzzBadge.color}30` }}
              >
                {buzzBadge.label}
              </span>
            )
          }
        />
        <div className="p-6 sm:p-8">
          <p className="text-[10px] italic mb-5" style={{ color: C.grayDim }}>
            Sourced from recent press and industry coverage — not a live scan of social media posts.
          </p>
          <div
            className="prose prose-invert max-w-none prose-p:leading-[1.85] prose-p:text-[15px] prose-strong:text-white mb-5"
            style={{ color: "#D8D8D8" }}
            dangerouslySetInnerHTML={{ __html: summaryHtml }}
          />
          {!!industryBuzz?.notable_mentions?.length && (
            <div className="mb-5">
              <div className="text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: C.gray }}>Notable Mentions</div>
              <ul className="list-disc pl-5 space-y-1">
                {industryBuzz.notable_mentions.map((m, i) => (
                  <li key={i} className="text-sm" style={{ color: "#D8D8D8" }}>{m}</li>
                ))}
              </ul>
            </div>
          )}
          {!!industryBuzz?.citations?.length && (
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: C.gray }}>Sources</div>
              <ul className="space-y-1">
                {industryBuzz.citations.map((url, i) => (
                  <li key={i}>
                    <a
                      href={url} target="_blank" rel="noopener noreferrer"
                      className={`${mono} text-xs break-all hover:underline`}
                      style={{ color: C.cyan }}
                    >
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
