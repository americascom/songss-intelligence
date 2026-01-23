import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Country to lat/lng mapping for globe markers
const countryCoordinates: Record<string, { lat: number; lng: number }> = {
  "United States": { lat: 37.09, lng: -95.71 },
  "United Kingdom": { lat: 51.51, lng: -0.13 },
  "Germany": { lat: 51.17, lng: 10.45 },
  "France": { lat: 46.23, lng: 2.21 },
  "Japan": { lat: 36.20, lng: 138.25 },
  "Brazil": { lat: -14.24, lng: -51.93 },
  "Australia": { lat: -25.27, lng: 133.78 },
  "Canada": { lat: 56.13, lng: -106.35 },
  "Mexico": { lat: 23.63, lng: -102.55 },
  "Spain": { lat: 40.46, lng: -3.75 },
  "Italy": { lat: 41.87, lng: 12.57 },
  "Netherlands": { lat: 52.13, lng: 5.29 },
  "Sweden": { lat: 60.13, lng: 18.64 },
  "South Korea": { lat: 35.91, lng: 127.77 },
  "India": { lat: 20.59, lng: 78.96 },
  "China": { lat: 35.86, lng: 104.20 },
  "Argentina": { lat: -38.42, lng: -63.62 },
  "South Africa": { lat: -30.56, lng: 22.94 },
  "Belgium": { lat: 50.50, lng: 4.47 },
  "Portugal": { lat: 39.40, lng: -8.22 },
};

export interface MetricsMarker {
  name: string;
  lat: number;
  lng: number;
  streams: string;
}

export interface MetricsSummary {
  totalStreams: number;
  totalRevenue: number;
  totalArtists: number;
  revenueData: { value: number }[];
  revenueChange: number;
}

function formatStreams(streams: number): string {
  if (streams >= 1_000_000) {
    return `${(streams / 1_000_000).toFixed(1)}M`;
  }
  if (streams >= 1_000) {
    return `${(streams / 1_000).toFixed(0)}K`;
  }
  return streams.toString();
}

function formatRevenue(revenue: number): string {
  if (revenue >= 1_000_000) {
    return `$${(revenue / 1_000_000).toFixed(1)}M`;
  }
  if (revenue >= 1_000) {
    return `$${(revenue / 1_000).toFixed(1)}K`;
  }
  return `$${revenue.toFixed(0)}`;
}

export function useMetricsMarkers() {
  return useQuery({
    queryKey: ["metrics-markers"],
    queryFn: async (): Promise<MetricsMarker[]> => {
      try {
        // Fetch from external API endpoint
        const response = await fetch("https://api.songssintelligence.com/metrics");
        
        if (!response.ok) {
          console.error("Error fetching metrics:", response.statusText);
          return [];
        }

        const data = await response.json();

        if (!data || data.length === 0) {
          return [];
        }

        // Group by region and sum growth_projection
        const regionStreams: Record<string, number> = {};
        data.forEach((row: { region: string; growth_projection: number }) => {
          const region = row.region;
          regionStreams[region] = (regionStreams[region] || 0) + Number(row.growth_projection);
        });

        // Convert to markers with coordinates
        const markers: MetricsMarker[] = [];
        Object.entries(regionStreams).forEach(([region, streams]) => {
          const coords = countryCoordinates[region];
          if (coords) {
            markers.push({
              name: region,
              lat: coords.lat,
              lng: coords.lng,
              streams: formatStreams(streams),
            });
          }
        });

        return markers.slice(0, 5); // Top 5 regions
      } catch (error) {
        console.error("Error fetching metrics markers:", error);
        return [];
      }
    },
    staleTime: 60000, // 1 minute
  });
}

export function useMetricsSummary() {
  return useQuery({
    queryKey: ["metrics-summary"],
    queryFn: async (): Promise<MetricsSummary> => {
      const { data, error } = await supabase
        .from("metrics_global")
        .select("streams, revenue, artists_count, date")
        .order("date", { ascending: true });

      if (error) {
        console.error("Error fetching metrics summary:", error);
        return {
          totalStreams: 0,
          totalRevenue: 0,
          totalArtists: 0,
          revenueData: [],
          revenueChange: 0,
        };
      }

      if (!data || data.length === 0) {
        return {
          totalStreams: 0,
          totalRevenue: 0,
          totalArtists: 0,
          revenueData: [],
          revenueChange: 0,
        };
      }

      const totalStreams = data.reduce((sum, row) => sum + Number(row.streams), 0);
      const totalRevenue = data.reduce((sum, row) => sum + Number(row.revenue), 0);
      const totalArtists = Math.max(...data.map((row) => row.artists_count || 0));

      // Get revenue data for chart (last 7 data points)
      const revenueData = data.slice(-7).map((row) => ({
        value: Number(row.revenue),
      }));

      // Calculate revenue change (compare last to first)
      let revenueChange = 0;
      if (revenueData.length >= 2) {
        const first = revenueData[0].value;
        const last = revenueData[revenueData.length - 1].value;
        if (first > 0) {
          revenueChange = Math.round(((last - first) / first) * 100);
        }
      }

      return {
        totalStreams,
        totalRevenue,
        totalArtists,
        revenueData: revenueData.length > 0 ? revenueData : [{ value: 0 }],
        revenueChange,
      };
    },
    staleTime: 60000, // 1 minute
  });
}

export function useFormattedMetrics() {
  const { data: summary, isLoading } = useMetricsSummary();

  return {
    isLoading,
    totalStreams: summary ? formatStreams(summary.totalStreams) : "0",
    totalRevenue: summary ? formatRevenue(summary.totalRevenue) : "$0",
    totalArtists: summary?.totalArtists.toString() || "0",
    revenueData: summary?.revenueData || [{ value: 0 }],
    revenueChange: summary?.revenueChange || 0,
  };
}
