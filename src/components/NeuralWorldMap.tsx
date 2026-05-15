import { useState } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { motion, AnimatePresence } from "framer-motion";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const C = {
  cyan: "#00C4B5",
  white: "#F5F5F5",
  gray: "#7A7A7A",
};

export type Hotspot = {
  name: string;
  country?: string;
  lat: number;
  lng: number;
  opportunity?: string;
  streams?: number | string;
  score?: number;
};

const KNOWN: Record<string, [number, number]> = {
  london: [-0.1276, 51.5074],
  "new york": [-74.006, 40.7128],
  newyork: [-74.006, 40.7128],
  nyc: [-74.006, 40.7128],
  tokyo: [139.6917, 35.6895],
  "los angeles": [-118.2437, 34.0522],
  paris: [2.3522, 48.8566],
  berlin: [13.405, 52.52],
  "são paulo": [-46.6333, -23.5505],
  "sao paulo": [-46.6333, -23.5505],
  "mexico city": [-99.1332, 19.4326],
  toronto: [-79.3832, 43.6532],
  sydney: [151.2093, -33.8688],
  seoul: [126.978, 37.5665],
  mumbai: [72.8777, 19.076],
  lagos: [3.3792, 6.5244],
  "buenos aires": [-58.3816, -34.6037],
  madrid: [-3.7038, 40.4168],
  amsterdam: [4.9041, 52.3676],
  stockholm: [18.0686, 59.3293],
  dubai: [55.2708, 25.2048],
  singapore: [103.8198, 1.3521],
  "hong kong": [114.1694, 22.3193],
  miami: [-80.1918, 25.7617],
  chicago: [-87.6298, 41.8781],
  atlanta: [-84.388, 33.749],
};

function compact(n: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export function normalizeHotspots(raw: any): Hotspot[] {
  let arr: any[] = [];
  if (Array.isArray(raw)) arr = raw;
  else if (raw && typeof raw === "object") {
    arr = raw.hotspots ?? raw.top_cities ?? raw.cities ?? raw.top ?? raw.points ?? [];
  }
  const out: Hotspot[] = [];
  for (const r of arr) {
    if (!r) continue;
    const name = r.name ?? r.city ?? r.location ?? r.country ?? "Unknown";
    let lat = Number(r.lat ?? r.latitude);
    let lng = Number(r.lng ?? r.lon ?? r.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      const k = String(name).toLowerCase().trim();
      if (KNOWN[k]) { lng = KNOWN[k][0]; lat = KNOWN[k][1]; }
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    out.push({
      name,
      country: r.country,
      lat, lng,
      opportunity: r.opportunity ?? r.insight ?? r.note ?? r.strategy,
      streams: r.streams ?? r.value,
      score: r.score ?? r.velocity,
    });
  }
  return out;
}

export const FALLBACK_HOTSPOTS: Hotspot[] = [
  { name: "London", country: "UK", lat: 51.5074, lng: -0.1276, opportunity: "Late-night radio sync window. Peak Spotify saves 22:00–02:00 GMT.", streams: 2400000, score: 92 },
  { name: "New York", country: "USA", lat: 40.7128, lng: -74.006, opportunity: "Editorial playlist pickup probability 87%. Push pre-save campaign.", streams: 3100000, score: 95 },
  { name: "Tokyo", country: "JP", lat: 35.6895, lng: 139.6917, opportunity: "TikTok velocity +340% week-over-week. License J-pop sync potential.", streams: 1500000, score: 88 },
];

export default function NeuralWorldMap({ hotspots }: { hotspots: Hotspot[] }) {
  const [hover, setHover] = useState<{ h: Hotspot; x: number; y: number } | null>(null);
  const points = hotspots.length ? hotspots : FALLBACK_HOTSPOTS;

  return (
    <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <filter id="nwmGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
      </svg>

      {/* Subtle grid backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-lg"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 50%, rgba(0,196,181,0.06) 0%, transparent 70%)," +
            "linear-gradient(to right, rgba(0,196,181,0.04) 1px, transparent 1px)," +
            "linear-gradient(to bottom, rgba(0,196,181,0.04) 1px, transparent 1px)",
          backgroundSize: "auto, 40px 40px, 40px 40px",
        }}
      />

      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{ scale: 165 }}
        style={{ width: "100%", height: "100%", position: "relative" }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                style={{
                  default: { fill: "#0E0E0E", stroke: "rgba(0,196,181,0.25)", strokeWidth: 0.4, outline: "none" },
                  hover:   { fill: "#121212", stroke: "rgba(0,196,181,0.45)", strokeWidth: 0.5, outline: "none" },
                  pressed: { fill: "#121212", stroke: "rgba(0,196,181,0.45)", strokeWidth: 0.5, outline: "none" },
                }}
              />
            ))
          }
        </Geographies>

        {points.map((h, i) => (
          <Marker key={`${h.name}-${i}`} coordinates={[h.lng, h.lat]}>
            <g
              onMouseEnter={(e) => {
                const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                setHover({ h, x: e.clientX - rect.left, y: e.clientY - rect.top });
              }}
              onMouseMove={(e) => {
                const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                setHover({ h, x: e.clientX - rect.left, y: e.clientY - rect.top });
              }}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: "pointer" }}
            >
              {/* Sonar ripples */}
              <motion.circle
                r={4}
                fill="none"
                stroke={C.cyan}
                strokeWidth={1}
                initial={{ opacity: 0.6, scale: 1 }}
                animate={{ opacity: 0, scale: 4 }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay: i * 0.25 }}
              />
              <motion.circle
                r={4}
                fill="none"
                stroke={C.cyan}
                strokeWidth={1}
                initial={{ opacity: 0.5, scale: 1 }}
                animate={{ opacity: 0, scale: 3 }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay: i * 0.25 + 0.8 }}
              />
              {/* Core dot with glow */}
              <circle r={4.5} fill={C.cyan} opacity={0.25} filter="url(#nwmGlow)" />
              <circle r={2.6} fill={C.cyan} stroke={C.white} strokeWidth={0.6} />
            </g>
          </Marker>
        ))}
      </ComposableMap>

      {/* Glassmorphism tooltip */}
      <AnimatePresence>
        {hover && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-none absolute z-20 max-w-[280px] rounded-lg p-3"
            style={{
              left: Math.min(hover.x + 14, 600),
              top: Math.max(hover.y - 10, 0),
              background: "linear-gradient(135deg, rgba(10,10,10,0.92), rgba(20,20,20,0.86))",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              border: "1px solid rgba(0,196,181,0.35)",
              boxShadow: "0 0 24px rgba(0,196,181,0.18), 0 8px 24px rgba(0,0,0,0.5)",
            }}
          >
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: C.cyan }}>
                {hover.h.country || "Geo Hotspot"}
              </div>
              {typeof hover.h.score === "number" && (
                <div className="font-mono text-[10px]" style={{ color: C.cyan }}>
                  {hover.h.score.toFixed(0)}
                </div>
              )}
            </div>
            <div className="text-sm font-semibold mb-1" style={{ color: C.white }}>{hover.h.name}</div>
            {hover.h.streams != null && (
              <div className="font-mono text-[11px] mb-1.5" style={{ color: C.gray }}>
                {typeof hover.h.streams === "number" ? `${compact(hover.h.streams)} streams` : String(hover.h.streams)}
              </div>
            )}
            {hover.h.opportunity && (
              <div className="text-xs leading-relaxed" style={{ color: C.white }}>
                <span className="font-mono text-[9px] uppercase tracking-[0.25em] block mb-1" style={{ color: C.cyan }}>Opportunity</span>
                {hover.h.opportunity}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
