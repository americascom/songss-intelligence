import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Globe/marker data — real, code-computed from Last.fm's geo.gettoptracks
 * API, polled into Supabase's `geo_activity` table by the "Geo Activity —
 * Last.fm Poller" n8n workflow every 20 minutes. No AI estimation, no
 * simulated fallback — a region simply has no marker until real data
 * exists for it.
 */

export interface GeoActivityRow {
  region: string;
  city: string;
  lat: number;
  lng: number;
  track_count: number;
  total_listeners: number;
  top_track: string | null;
  updated_at: string;
}

export interface MetricsMarker {
  name: string;
  lat: number;
  lng: number;
  listeners: string;
}

function formatListeners(listeners: number): string {
  if (listeners >= 1_000_000) {
    return `${(listeners / 1_000_000).toFixed(1)}M`;
  }
  if (listeners >= 1_000) {
    return `${(listeners / 1_000).toFixed(0)}K`;
  }
  return listeners.toString();
}

export function useMetricsMarkers() {
  return useQuery({
    queryKey: ["metrics-markers", "geo-activity"],
    queryFn: async (): Promise<MetricsMarker[]> => {
      const { data, error } = await supabase
        .from("geo_activity" as any)
        .select("city,lat,lng,total_listeners")
        .order("total_listeners", { ascending: false })
        .limit(8);

      if (error) {
        console.error("geo_activity read error:", error.message);
        return [];
      }
      if (!data || data.length === 0) {
        return [];
      }

      return (data as unknown as GeoActivityRow[]).map((row) => ({
        name: row.city,
        lat: row.lat,
        lng: row.lng,
        listeners: formatListeners(row.total_listeners),
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes — matches the poller's own cadence
    refetchInterval: 5 * 60 * 1000,
  });
}

/**
 * No real aggregate revenue data source exists under the Last.fm-only
 * pipeline (Last.fm has no monetary data). Deliberately does not call any
 * endpoint — there's nothing real to fetch. Always resolves to "no data",
 * so MiniRevenueChart correctly renders nothing rather than a fabricated
 * number.
 */
export function useFormattedMetrics() {
  return {
    isLoading: false,
    revenueData: [] as { value: number }[],
    totalRevenue: "$0",
    revenueChange: 0,
  };
}
