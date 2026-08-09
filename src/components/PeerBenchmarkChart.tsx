import * as React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LabelList } from "recharts";
import { useIsPrinting, PRINT_CHART_WIDTH } from "@/hooks/useIsPrinting";

interface PeerBenchmarkEntry {
  name: string;
  monthly_listeners: number;
  followers?: number;
  out_of_band?: boolean;
}

export interface PeerBenchmarkData {
  client_name?: string;
  client_monthly_listeners?: number;
  client_followers?: number;
  peer_benchmark?: PeerBenchmarkEntry[];
}

function fmtCompact(n: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

const CHART_HEIGHT = 180; // matches the h-[180px] container below

// Grounded replacement for the old AI-invented Seed→Crown ladder: a real
// monthly-listeners comparison between the client and their scraped Spotify
// peers, sourced directly from peer_benchmark_data (never parsed from AI text).
export default function PeerBenchmarkChart({
  data,
  accentColor,
  peerColor,
  gridColor,
  textColor,
}: {
  data: PeerBenchmarkData | null | undefined;
  accentColor: string;
  peerColor: string;
  gridColor: string;
  textColor: string;
}) {
  const isPrinting = useIsPrinting();
  const peers = data?.peer_benchmark ?? [];
  if (!peers.length || !data?.client_monthly_listeners) return null;

  const rows = [
    { name: data.client_name || "You", monthly_listeners: data.client_monthly_listeners, isClient: true, out_of_band: false },
    ...peers.map((p) => ({
      name: p.name,
      monthly_listeners: p.monthly_listeners,
      isClient: false,
      out_of_band: !!p.out_of_band,
    })),
  ].sort((a, b) => b.monthly_listeners - a.monthly_listeners);

  const chart = (
    <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 36, left: 4, bottom: 4 }}>
      <XAxis type="number" hide />
      <YAxis
        type="category"
        dataKey="name"
        width={110}
        tick={{ fontSize: 11, fill: textColor }}
        tickLine={false}
        axisLine={false}
      />
      <Tooltip
        cursor={{ fill: "rgba(255,255,255,0.03)" }}
        contentStyle={{ background: "#111", border: `1px solid ${gridColor}`, borderRadius: 8, fontSize: 12 }}
        labelStyle={{ color: textColor }}
        formatter={(value: number) => [value.toLocaleString(), "Monthly listeners"]}
      />
      <Bar dataKey="monthly_listeners" radius={[0, 4, 4, 0]}>
        {rows.map((row, i) => (
          <Cell key={i} fill={row.isClient ? accentColor : peerColor} />
        ))}
        <LabelList
          dataKey="monthly_listeners"
          position="right"
          formatter={(v: number) => fmtCompact(v)}
          style={{ fill: textColor, fontSize: 11, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace" }}
        />
      </Bar>
    </BarChart>
  );

  return (
    <div className="mb-4">
      <div className="h-[180px] w-full">
        {isPrinting
          ? React.cloneElement(chart, { width: PRINT_CHART_WIDTH, height: CHART_HEIGHT })
          : (
            <ResponsiveContainer width="100%" height="100%">
              {chart}
            </ResponsiveContainer>
          )}
      </div>
      {peers.some((p) => p.out_of_band) && (
        <p className="text-[10px] mt-1" style={{ color: textColor, opacity: 0.65 }}>
          * No closely-sized peer available for every entry shown — nearest comparison used.
        </p>
      )}
    </div>
  );
}
