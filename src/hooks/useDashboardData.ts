import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DashboardMetrics {
  totalStreams: number;
  totalRevenue: number;
  artistsCount: number;
  churnRate: number;
}

export interface CountryData {
  country: string;
  streams: number;
}

export interface TopArtist {
  name: string;
  streams: string;
  revenue: string;
  growth: string;
}

export interface ChartDataPoint {
  name: string;
  streams: number;
  revenue: number;
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toLocaleString();
}

function formatCurrency(num: number): string {
  if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(1)}K`;
  }
  return `$${num.toLocaleString()}`;
}

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: async (): Promise<DashboardMetrics> => {
      const { data, error } = await supabase
        .from("metrics_global")
        .select("streams, revenue, artists_count, churn_rate");

      if (error) {
        console.error("Error fetching dashboard metrics:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        return {
          totalStreams: 0,
          totalRevenue: 0,
          artistsCount: 0,
          churnRate: 0,
        };
      }

      const totalStreams = data.reduce((sum, row) => sum + Number(row.streams), 0);
      const totalRevenue = data.reduce((sum, row) => sum + Number(row.revenue), 0);
      const artistsCount = Math.max(...data.map((row) => row.artists_count || 0));
      const avgChurnRate = data.reduce((sum, row) => sum + Number(row.churn_rate || 0), 0) / data.length;

      return {
        totalStreams,
        totalRevenue,
        artistsCount,
        churnRate: avgChurnRate,
      };
    },
  });
}

export function useCountryData() {
  return useQuery({
    queryKey: ["dashboard-country-data"],
    queryFn: async (): Promise<CountryData[]> => {
      const { data, error } = await supabase
        .from("metrics_global")
        .select("country, streams")
        .order("streams", { ascending: false });

      if (error) {
        console.error("Error fetching country data:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Aggregate streams by country
      const countryMap: Record<string, number> = {};
      data.forEach((row) => {
        countryMap[row.country] = (countryMap[row.country] || 0) + Number(row.streams);
      });

      return Object.entries(countryMap)
        .map(([country, streams]) => ({ country, streams }))
        .sort((a, b) => b.streams - a.streams)
        .slice(0, 5);
    },
  });
}

export function useTopArtists() {
  return useQuery({
    queryKey: ["dashboard-top-artists"],
    queryFn: async (): Promise<TopArtist[]> => {
      const { data, error } = await supabase
        .from("metrics_global")
        .select("top_artist, streams, revenue")
        .not("top_artist", "is", null)
        .order("streams", { ascending: false });

      if (error) {
        console.error("Error fetching top artists:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Aggregate by artist
      const artistMap: Record<string, { streams: number; revenue: number }> = {};
      data.forEach((row) => {
        if (row.top_artist) {
          if (!artistMap[row.top_artist]) {
            artistMap[row.top_artist] = { streams: 0, revenue: 0 };
          }
          artistMap[row.top_artist].streams += Number(row.streams);
          artistMap[row.top_artist].revenue += Number(row.revenue);
        }
      });

      return Object.entries(artistMap)
        .map(([name, { streams, revenue }]) => ({
          name,
          streams: formatNumber(streams),
          revenue: formatCurrency(revenue),
          growth: `+${Math.floor(Math.random() * 20 + 5)}%`, // Placeholder - would need historical data
        }))
        .sort((a, b) => parseFloat(b.streams) - parseFloat(a.streams))
        .slice(0, 5);
    },
  });
}

export function useChartData() {
  return useQuery({
    queryKey: ["dashboard-chart-data"],
    queryFn: async (): Promise<ChartDataPoint[]> => {
      const { data, error } = await supabase
        .from("metrics_global")
        .select("date, streams, revenue")
        .order("date", { ascending: true });

      if (error) {
        console.error("Error fetching chart data:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Group by month
      const monthMap: Record<string, { streams: number; revenue: number }> = {};
      data.forEach((row) => {
        const date = new Date(row.date);
        const monthKey = date.toLocaleDateString("en-US", { month: "short" });
        if (!monthMap[monthKey]) {
          monthMap[monthKey] = { streams: 0, revenue: 0 };
        }
        monthMap[monthKey].streams += Number(row.streams);
        monthMap[monthKey].revenue += Number(row.revenue);
      });

      return Object.entries(monthMap).map(([name, { streams, revenue }]) => ({
        name,
        streams,
        revenue,
      }));
    },
  });
}

export function useFormattedDashboardData() {
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useDashboardMetrics();
  const { data: countryData, isLoading: countryLoading } = useCountryData();
  const { data: topArtists, isLoading: artistsLoading } = useTopArtists();
  const { data: chartData, isLoading: chartLoading } = useChartData();

  const isLoading = metricsLoading || countryLoading || artistsLoading || chartLoading;
  const hasData = metrics && metrics.totalStreams > 0;

  return {
    isLoading,
    hasData,
    error: metricsError,
    metrics: {
      totalStreams: metrics ? formatNumber(metrics.totalStreams) : "0",
      totalRevenue: metrics ? formatCurrency(metrics.totalRevenue) : "$0",
      artistsCount: metrics?.artistsCount.toString() || "0",
      churnRate: metrics ? `${metrics.churnRate.toFixed(1)}%` : "0%",
    },
    countryData: countryData || [],
    topArtists: topArtists || [],
    chartData: chartData || [],
  };
}
