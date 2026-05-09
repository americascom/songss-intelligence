import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  AreaChart, Area, ReferenceLine,
} from "recharts";
import { Download, Lock, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// --- Theme constants ---
const C = {
  bg: "#0A0A0A",
  card: "#1A1A2E",
  cyan: "#00C4B5",
  cyan2: "#00E0CF",
  cyan3: "#0099A0",
  white: "#FFFFFF",
  gray: "#A0AEC0",
};

// --- Dummy chart data ---
const sourceData = [
  { name: "Organic", value: 60 },
  { name: "Algorithmic", value: 25 },
  { name: "Editorial", value: 15 },
];
const sourceColors = [C.cyan, C.cyan3, "#4A5568"];

const funnelData = [
  { stage: "Streams", value: 1240000 },
  { stage: "Unique", value: 480000 },
  { stage: "Saves", value: 96000 },
  { stage: "Adds", value: 21500 },
];

const viralData = Array.from({ length: 12 }, (_, i) => ({
  week: `W${i + 1}`,
  tiktok: Math.round(2000 + Math.random() * 8000 + i * 600),
  spotify: Math.round(40000 + Math.random() * 20000 + i * 4500),
}));

const radarData = [
  { city: "São Paulo", velocity: 92 },
  { city: "Mexico City", velocity: 78 },
  { city: "Los Angeles", velocity: 84 },
  { city: "London", velocity: 67 },
  { city: "Lisbon", velocity: 73 },
];

const royaltyData = Array.from({ length: 12 }, (_, i) => {
  const cumulative = Math.round(1200 * (i + 1) * (1 + i * 0.08));
  return { month: `M${i + 1}`, revenue: cumulative };
});
const breakEven = 18000;

// --- Reveal wrapper ---
function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ type: "spring", stiffness: 80, damping: 18, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// --- Chart Card ---
function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Reveal className="group">
      <div
        className="rounded-2xl border p-5 h-full transition-all duration-300 hover:[filter:drop-shadow(0_0_15px_rgba(0,196,181,0.3))]"
        style={{ background: C.card, borderColor: "rgba(0,196,181,0.15)" }}
      >
        <div className="mb-4">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: C.cyan }}>{title}</h3>
          {subtitle && <p className="text-xs mt-1" style={{ color: C.gray }}>{subtitle}</p>}
        </div>
        <div className="h-64">{children}</div>
      </div>
    </Reveal>
  );
}

// --- Typewriter ---
function Typewriter({ text, speed = 18 }: { text: string; speed?: number }) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    let i = 0;
    setShown("");
    const id = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return <span>{shown}<span className="inline-block w-[2px] h-4 ml-0.5 animate-pulse" style={{ background: C.cyan }} /></span>;
}

// --- Vault Gate ---
function VaultGate({ expectedEmail, onUnlock }: { expectedEmail?: string; onUnlock: () => void }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) { setError(error.message); return; }
    if (expectedEmail && email.toLowerCase() !== expectedEmail.toLowerCase()) {
      setError("This account does not match the report's authorized email.");
      return;
    }
    onUnlock();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: C.bg }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 80, damping: 18 }}
        className="w-full max-w-md rounded-2xl border p-8"
        style={{ background: C.card, borderColor: "rgba(0,196,181,0.25)" }}
      >
        <div className="flex items-center gap-3 mb-6">
          <Lock className="w-5 h-5" style={{ color: C.cyan }} />
          <span className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: C.cyan }}>Vault Access</span>
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: C.white }}>SONGSS Intelligence Deep Dive</h1>
        <p className="text-sm mb-6" style={{ color: C.gray }}>Confirm your credentials to decrypt the report.</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
            className="w-full rounded-lg px-4 py-3 text-sm outline-none focus:ring-2"
            style={{ background: "#0F0F1F", border: "1px solid rgba(0,196,181,0.2)", color: C.white }}
          />
          <input
            type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password"
            className="w-full rounded-lg px-4 py-3 text-sm outline-none focus:ring-2"
            style={{ background: "#0F0F1F", border: "1px solid rgba(0,196,181,0.2)", color: C.white }}
          />
          {error && <p className="text-xs" style={{ color: "#FF6B6B" }}>{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full rounded-lg py-3 text-sm font-bold uppercase tracking-wider transition-all hover:scale-[1.01] disabled:opacity-50"
            style={{ background: C.cyan, color: C.bg }}
          >
            {loading ? "Decrypting…" : "Decrypt Report"}
          </button>
        </form>
        <div className="flex items-center gap-2 mt-6 text-xs" style={{ color: C.gray }}>
          <ShieldCheck className="w-3.5 h-3.5" /> End-to-end secured · Americascom Neural Intelligence
        </div>
      </motion.div>
    </div>
  );
}

interface ReportRow {
  id: string;
  session_id: string;
  email: string;
  artist_name: string | null;
  report_markdown: string;
}

export default function Report() {
  const { session_id } = useParams<{ session_id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [report, setReport] = useState<ReportRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expectedEmail, setExpectedEmail] = useState<string | undefined>(undefined);
  const reportContentRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  async function loadReport() {
    if (!session_id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("intelligence_reports")
      .select("*")
      .eq("session_id", session_id)
      .maybeSingle();
    setLoading(false);
    if (error) { setError(error.message); return; }
    if (!data) { setError("Report not found or access denied."); return; }
    setReport(data as ReportRow);
    setExpectedEmail(data.email);
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, session_id]);

  const markdown = report?.report_markdown?.trim() || `# Executive Summary\n\nAwaiting neural ingestion. The deep-dive report for this session is being assembled by Americascom Neural Intelligence.\n\n## Performance Overview\n\nMomentum is accelerating across viral and DSP surfaces. Editorial pickup remains the highest-leverage opportunity over the next 30 days.\n\n## Strategic Recommendations\n\n- Double down on TikTok seeding in LATAM\n- Pitch curators in the Indie Pop and Bedroom genres\n- Launch a regional micro-tour around the top 5 velocity cities`;

  const { firstParagraph, restMarkdown } = useMemo(() => {
    const lines = markdown.split("\n");
    let firstParaIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i].trim();
      if (l && !l.startsWith("#") && !l.startsWith("-") && !l.startsWith(">")) { firstParaIdx = i; break; }
    }
    if (firstParaIdx === -1) return { firstParagraph: "", restMarkdown: markdown };
    const before = lines.slice(0, firstParaIdx).join("\n");
    const para = lines[firstParaIdx];
    const after = lines.slice(firstParaIdx + 1).join("\n");
    return { firstParagraph: para, restMarkdown: `${before}\n\n${after}` };
  }, [markdown]);

  async function downloadPDF() {
    if (!reportContentRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(reportContentRef.current, { backgroundColor: C.bg, scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`songss-neural-dossier-${session_id}.pdf`);
    } finally {
      setExporting(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: C.cyan }} />
      </div>
    );
  }

  if (!user) return <VaultGate expectedEmail={expectedEmail} onUnlock={loadReport} />;
  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: C.bg }}>
        <div className="max-w-md text-center">
          <Lock className="w-8 h-8 mx-auto mb-4" style={{ color: C.cyan }} />
          <h1 className="text-xl font-bold mb-2" style={{ color: C.white }}>Access Denied</h1>
          <p className="text-sm" style={{ color: C.gray }}>{error || "This report is not authorized for your account."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: C.bg, color: C.white }}>
      {/* Sticky Action Bar */}
      <div
        className="sticky top-0 z-40 backdrop-blur-md border-b"
        style={{ background: "rgba(10,10,10,0.85)", borderColor: "rgba(0,196,181,0.15)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: C.cyan }} />
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.25em]" style={{ color: C.gray }}>Neural Dossier</div>
              <div className="text-sm font-semibold truncate" style={{ color: C.white }}>
                {report.artist_name || "Pro Analytics Report"} · <span style={{ color: C.cyan }}>{session_id}</span>
              </div>
            </div>
          </div>
          <button
            onClick={downloadPDF}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all hover:scale-[1.02] disabled:opacity-50"
            style={{ background: C.cyan, color: C.bg }}
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {exporting ? "Rendering…" : "Download Neural Dossier (PDF)"}
          </button>
        </div>
      </div>

      <div ref={reportContentRef} className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <Reveal>
          <div className="mb-10">
            <div className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: C.cyan }}>
              Pro Analytics · Deep Dive · Session {session_id}
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight" style={{ color: C.white }}>
              {report.artist_name || "Artist"} <span style={{ color: C.cyan }}>// Intelligence Report</span>
            </h1>
          </div>
        </Reveal>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-12">
          <ChartCard title="Source of Streams" subtitle="Traffic origin distribution">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sourceData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2} stroke="none">
                  {sourceData.map((_, i) => <Cell key={i} fill={sourceColors[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.cyan}40`, borderRadius: 8, color: C.white }} />
                <Legend wrapperStyle={{ color: C.gray, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Fan Conversion" subtitle="Streams → Adds funnel">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid stroke="#2A2A3E" strokeDasharray="3 3" />
                <XAxis type="number" stroke={C.gray} fontSize={11} />
                <YAxis type="category" dataKey="stage" stroke={C.gray} fontSize={11} />
                <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.cyan}40`, borderRadius: 8, color: C.white }} />
                <Bar dataKey="value" fill={C.cyan} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Viral vs DSP" subtitle="TikTok creations vs Spotify streams (12w)">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={viralData}>
                <CartesianGrid stroke="#2A2A3E" strokeDasharray="3 3" />
                <XAxis dataKey="week" stroke={C.gray} fontSize={11} />
                <YAxis yAxisId="left" stroke={C.cyan} fontSize={11} />
                <YAxis yAxisId="right" orientation="right" stroke={C.cyan3} fontSize={11} />
                <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.cyan}40`, borderRadius: 8, color: C.white }} />
                <Legend wrapperStyle={{ color: C.gray, fontSize: 11 }} />
                <Line yAxisId="left" type="monotone" dataKey="tiktok" stroke={C.cyan} strokeWidth={2} dot={false} name="TikTok" />
                <Line yAxisId="right" type="monotone" dataKey="spotify" stroke={C.cyan3} strokeWidth={2} dot={false} name="Spotify" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Regional Velocity" subtitle="Top 5 cities · growth index">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#2A2A3E" />
                <PolarAngleAxis dataKey="city" stroke={C.gray} fontSize={11} />
                <PolarRadiusAxis stroke="#2A2A3E" tick={{ fill: C.gray, fontSize: 10 }} />
                <Radar dataKey="velocity" stroke={C.cyan} fill={C.cyan} fillOpacity={0.35} />
                <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.cyan}40`, borderRadius: 8, color: C.white }} />
              </RadarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Royalty ROI Projection" subtitle="Cumulative revenue vs break-even">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={royaltyData}>
                <defs>
                  <linearGradient id="roi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.cyan} stopOpacity={0.6} />
                    <stop offset="100%" stopColor={C.cyan} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#2A2A3E" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke={C.gray} fontSize={11} />
                <YAxis stroke={C.gray} fontSize={11} />
                <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.cyan}40`, borderRadius: 8, color: C.white }} />
                <ReferenceLine y={breakEven} stroke="#FF6B6B" strokeDasharray="4 4" label={{ value: "Break-even", fill: "#FF6B6B", fontSize: 10, position: "insideTopRight" }} />
                <Area type="monotone" dataKey="revenue" stroke={C.cyan} strokeWidth={2} fill="url(#roi)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Neural Confidence" subtitle="Model conviction score">
            <div className="h-full flex flex-col items-center justify-center">
              <div className="text-6xl font-extrabold tracking-tight" style={{ color: C.cyan, filter: "drop-shadow(0 0 20px rgba(0,196,181,0.4))" }}>92<span className="text-2xl" style={{ color: C.gray }}>/100</span></div>
              <div className="text-xs uppercase tracking-[0.25em] mt-3" style={{ color: C.gray }}>High Conviction Signal</div>
            </div>
          </ChartCard>
        </div>

        {/* Neural Report Renderer */}
        <Reveal>
          <div
            className="rounded-2xl border p-6 sm:p-10"
            style={{ background: C.card, borderColor: "rgba(0,196,181,0.15)" }}
          >
            <div className="text-[10px] uppercase tracking-[0.3em] mb-6" style={{ color: C.cyan }}>
              Neural Report · Decrypted Output
            </div>

            {firstParagraph && (
              <p className="text-base sm:text-lg leading-relaxed mb-6" style={{ color: C.white }}>
                <Typewriter text={firstParagraph} />
              </p>
            )}

            <article
              className="prose prose-invert max-w-none
                prose-headings:uppercase prose-headings:tracking-wider
                prose-h1:text-[--cyan] prose-h2:text-[--cyan] prose-h3:text-[--cyan]
                prose-p:text-[color:#A0AEC0]
                prose-strong:text-white
                prose-a:text-[--cyan] prose-a:no-underline hover:prose-a:underline
                prose-li:text-[color:#A0AEC0]
                prose-blockquote:border-l-[--cyan] prose-blockquote:text-[color:#A0AEC0]
                prose-code:text-[--cyan] prose-code:bg-black/40 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                prose-hr:border-[color:rgba(0,196,181,0.2)]"
              style={{ ["--cyan" as string]: C.cyan } as React.CSSProperties}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{restMarkdown}</ReactMarkdown>
            </article>
          </div>
        </Reveal>

        <Reveal>
          <div className="mt-10 text-center text-xs" style={{ color: C.gray }}>
            Generated by Americascom Neural Intelligence · Session {session_id} · Confidential
          </div>
        </Reveal>
      </div>
    </div>
  );
}
