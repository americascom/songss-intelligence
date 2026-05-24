import { useEffect, useState, FormEvent } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Sparkles, ShieldCheck, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const C = {
  bg: "#050505",
  surface: "#0B0B0B",
  card: "#0D0D0D",
  border: "#1A1A1A",
  cyan: "#00C4B5",
  white: "#F5F5F5",
  gray: "#7A7A7A",
};

function planTier(plan?: string | null): "indie" | "growth" | "pro" | "team" | "enterprise" | "opus" {
  const p = (plan || "").toLowerCase();
  if (p.includes("opus")) return "opus";
  if (p.includes("enterprise")) return "enterprise";
  if (p.includes("team")) return "team";
  if (p.includes("pro")) return "pro";
  if (p.includes("growth")) return "growth";
  return "indie";
}
const rank = { indie: 0, growth: 1, pro: 2, team: 2, enterprise: 3, opus: 4 } as const;
const atLeast = (t: ReturnType<typeof planTier>, min: keyof typeof rank) => rank[t] >= rank[min];

type ReportRow = {
  id: string;
  session_id: string;
  plan_name: string | null;
  customer_email: string | null;
  artist_name: string | null;
  engagement_metrics: Record<string, unknown> | null;
};

const MARKETS = ["Global", "Latin America", "North America", "Europe", "Asia"];
const CONTEXTS = ["Catalog Acquisition", "A&R Decision", "Tour Planning", "Publishing Deal"];

export default function Submit() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ReportRow | null>(null);

  const [artistName, setArtistName] = useState("");
  const [songName, setSongName] = useState("");
  const [market, setMarket] = useState("");
  const [context, setContext] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!sessionId) return;
      const { data, error } = await supabase
        .from("intelligence_reports")
        .select("id, session_id, plan_name, customer_email, artist_name, engagement_metrics")
        .eq("session_id", sessionId)
        .maybeSingle();
      if (!active) return;
      if (error) setError(error.message);
      else if (!data) setError("Session not found.");
      else {
        setReport(data as ReportRow);
        if (data.artist_name) setArtistName(data.artist_name);
      }
      setLoading(false);
    })();
    return () => { active = false; };
  }, [sessionId]);

  const tier = planTier(report?.plan_name);
  const showProFields = atLeast(tier, "pro");
  const showEnterpriseFields = atLeast(tier, "enterprise");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!report || !artistName.trim()) return;
    setSubmitting(true);
    const intake = {
      artist_or_song_name: artistName.trim(),
      song_name: songName.trim() || null,
      market_focus: market || null,
      investment_context: context || null,
      additional_context: notes.trim() || null,
      submitted_at: new Date().toISOString(),
    };
    const merged = {
      ...(report.engagement_metrics || {}),
      intake,
    };
    const { error } = await supabase
      .from("intelligence_reports")
      .update({ artist_name: artistName.trim(), engagement_metrics: merged })
      .eq("id", report.id);
    setSubmitting(false);
    if (error) { setError(error.message); return; }
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen text-white" style={{ background: C.bg }}>
      {/* mesh background */}
      <div className="pointer-events-none fixed inset-0 opacity-40"
        style={{
          backgroundImage:
            `radial-gradient(circle at 20% 20%, rgba(0,196,181,0.08), transparent 40%),
             radial-gradient(circle at 80% 60%, rgba(0,196,181,0.06), transparent 45%)`,
        }} />

      <main className="relative max-w-2xl mx-auto px-6 py-16 md:py-24">
        {loading && (
          <div className="flex items-center gap-3 text-sm" style={{ color: C.gray }}>
            <Loader2 className="h-4 w-4 animate-spin" style={{ color: C.cyan }} />
            <span className="font-mono uppercase tracking-widest">Loading intake…</span>
          </div>
        )}

        {!loading && error && (
          <Panel>
            <h1 className="text-2xl font-semibold mb-2">Unable to load session</h1>
            <p className="text-sm" style={{ color: C.gray }}>{error}</p>
            <p className="mt-4 font-mono text-xs" style={{ color: C.gray }}>session_id: {sessionId}</p>
          </Panel>
        )}

        {!loading && report && !submitted && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center gap-2 mb-3 font-mono text-[10px] uppercase tracking-[0.3em]" style={{ color: C.cyan }}>
              <ShieldCheck className="h-3 w-3" /> Secure Intake · Classified
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              Welcome to <span style={{ color: C.cyan }}>{report.plan_name || "SONGSS Intelligence"}</span>
            </h1>
            <p className="mt-4 text-sm leading-relaxed" style={{ color: "#B8B8B8" }}>
              Provide the briefing details below. Our Neural Intelligence engine will compile your bespoke report and deliver it to your inbox within minutes.
            </p>

            <Panel className="mt-8">
              <form onSubmit={onSubmit} className="space-y-6">
                <Field label="Artist or Song Name" required>
                  <Input
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    placeholder="e.g. Ivan Lins"
                    required
                    maxLength={120}
                    className="bg-transparent border-white/10 focus-visible:ring-1"
                    style={{ borderColor: "rgba(255,255,255,0.08)" }}
                  />
                </Field>

                {showProFields && (
                  <>
                    <Field label="Song Name" hint="Optional">
                      <Input
                        value={songName}
                        onChange={(e) => setSongName(e.target.value)}
                        placeholder="e.g. Madalena"
                        maxLength={160}
                        className="bg-transparent border-white/10"
                      />
                    </Field>

                    <Field label="Market Focus">
                      <Select value={market} onValueChange={setMarket}>
                        <SelectTrigger className="bg-transparent border-white/10">
                          <SelectValue placeholder="Select a market" />
                        </SelectTrigger>
                        <SelectContent>
                          {MARKETS.map((m) => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </>
                )}

                {showEnterpriseFields && (
                  <>
                    <Field label="Investment Context">
                      <Select value={context} onValueChange={setContext}>
                        <SelectTrigger className="bg-transparent border-white/10">
                          <SelectValue placeholder="Select an objective" />
                        </SelectTrigger>
                        <SelectContent>
                          {CONTEXTS.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field label="Additional Context" hint="Optional">
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any constraints, deal stage, comparable artists, or specific questions…"
                        maxLength={2000}
                        rows={5}
                        className="bg-transparent border-white/10"
                      />
                    </Field>
                  </>
                )}

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={submitting || !artistName.trim()}
                    className="w-full h-12 font-mono uppercase tracking-[0.2em] text-xs"
                    style={{
                      background: `linear-gradient(180deg, ${C.cyan}, #009E92)`,
                      color: "#001514",
                      boxShadow: "0 0 30px rgba(0,196,181,0.25)",
                    }}
                  >
                    {submitting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Encrypting Brief…</>
                    ) : (
                      <><Sparkles className="h-4 w-4" /> Generate Intelligence Report</>
                    )}
                  </Button>
                  <p className="mt-3 text-[11px] font-mono text-center" style={{ color: C.gray }}>
                    Session · {report.session_id.slice(0, 22)}…
                  </p>
                </div>
              </form>
            </Panel>
          </motion.div>
        )}

        {submitted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <Panel className="text-center py-14">
              <div className="mx-auto mb-6 h-16 w-16 rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(0,196,181,0.12)",
                  border: `1px solid ${C.cyan}55`,
                  boxShadow: "0 0 40px rgba(0,196,181,0.35)",
                }}>
                <CheckCircle2 className="h-7 w-7" style={{ color: C.cyan }} />
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: C.cyan }}>
                Neural Engine Active
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold">Your report is being generated…</h2>
              <p className="mt-4 text-sm leading-relaxed max-w-md mx-auto" style={{ color: C.gray }}>
                We are compiling deep market intelligence for{" "}
                <span style={{ color: C.white }}>{artistName}</span>.
                You may safely close this window.
              </p>
              <div className="mt-8 inline-flex items-center gap-2 font-mono text-[11px]" style={{ color: C.gray }}>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ background: C.cyan }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: C.cyan }} />
                </span>
                Processing · {report?.plan_name}
              </div>
            </Panel>
          </motion.div>
        )}
      </main>
    </div>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative rounded-xl p-6 md:p-8 backdrop-blur-xl ${className}`}
      style={{
        background: "linear-gradient(180deg, rgba(13,13,13,0.85), rgba(5,5,5,0.85))",
        border: "1px solid rgba(0,196,181,0.18)",
        boxShadow: "0 30px 80px -40px rgba(0,196,181,0.25), inset 0 1px 0 rgba(255,255,255,0.03)",
      }}
    >
      {children}
    </div>
  );
}

function Field({
  label, hint, required, children,
}: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <Label className="flex items-center justify-between mb-2 font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: "#B8B8B8" }}>
        <span>{label}{required && <span style={{ color: "#00C4B5" }}> *</span>}</span>
        {hint && <span style={{ color: "#5A5A5A" }}>{hint}</span>}
      </Label>
      {children}
    </div>
  );
}
