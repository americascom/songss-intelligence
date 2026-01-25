import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * SONGSS Neural Intelligence Engine - Data Integration
 * 
 * Expected JSON response format from Neural Engine API:
 * {
 *   id: number,
 *   region: string,              // Maps to country/city for globe markers
 *   growth_projection: number,   // Primary metric for streams/revenue calculation
 *   analysis_label: string,      // AI-generated insight label
 *   updated_at: string           // ISO timestamp
 * }
 * 
 * The growth_projection field is used as a base multiplier to calculate:
 * - Total Streams: growth_projection * 1,000,000
 * - Total Revenue: growth_projection * 50,000
 * - Artists Count: regions * 150
 */

// Neural Engine API Response Type
export interface NeuralEngineMetric {
  id: number;
  region: string;
  growth_projection: number;
  analysis_label: string;
  updated_at: string;
}

// Country to lat/lng mapping for globe markers
const countryCoordinates: Record<string, { lat: number; lng: number }> = {
  "United States": { lat: 40.71, lng: -74.01 }, // New York
  "United Kingdom": { lat: 51.51, lng: -0.13 }, // London
  "Germany": { lat: 52.52, lng: 13.41 },
  "France": { lat: 48.86, lng: 2.35 },
  "Japan": { lat: 35.68, lng: 139.69 },
  "Brazil": { lat: -23.55, lng: -46.63 }, // São Paulo
  "Australia": { lat: -33.87, lng: 151.21 },
  "Canada": { lat: 43.65, lng: -79.38 },
  "Mexico": { lat: 19.43, lng: -99.13 },
  "Spain": { lat: 40.42, lng: -3.70 },
  "Italy": { lat: 41.90, lng: 12.50 },
  "Netherlands": { lat: 52.37, lng: 4.90 },
  "Sweden": { lat: 59.33, lng: 18.07 },
  "South Korea": { lat: 37.57, lng: 126.98 },
  "India": { lat: 19.08, lng: 72.88 },
  "China": { lat: 31.23, lng: 121.47 },
  "Argentina": { lat: -34.60, lng: -58.38 },
  "South Africa": { lat: -33.93, lng: 18.42 },
  "Belgium": { lat: 50.85, lng: 4.35 },
  "Portugal": { lat: 38.72, lng: -9.14 },
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
  analysisLabels?: string[];
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
    queryKey: ["metrics-markers", "neural-engine"],
    queryFn: async (): Promise<MetricsMarker[]> => {
      try {
        // Fetch from SONGSS Neural Intelligence Engine API
        const response = await fetch("https://api.songssintelligence.com/metrics");
        
        if (!response.ok) {
          console.error("Neural Engine API Error:", response.statusText);
          return [];
        }

        const data: NeuralEngineMetric[] = await response.json();

        if (!data || data.length === 0) {
          return [];
        }

        // Process Neural Engine response - map region to globe markers
        const regionStreams: Record<string, number> = {};
        data.forEach((row) => {
          const region = row.region;
          regionStreams[region] = (regionStreams[region] || 0) + Number(row.growth_projection);
        });

        // Convert to markers with coordinates for major cities
        const markers: MetricsMarker[] = [];
        Object.entries(regionStreams).forEach(([region, streams]) => {
          const coords = countryCoordinates[region];
          if (coords) {
            markers.push({
              name: region,
              lat: coords.lat,
              lng: coords.lng,
              streams: formatStreams(streams * 1000000), // Scale to realistic stream count
            });
          }
        });

        return markers.slice(0, 5); // Top 5 regions
      } catch (error) {
        console.error("Neural Engine connection error:", error);
        return [];
      }
    },
    staleTime: 60000, // 1 minute cache
    refetchInterval: 300000, // Refresh every 5 minutes
  });
}

export function useMetricsSummary() {
  return useQuery({
    queryKey: ["metrics-summary", "neural-engine"],
    queryFn: async (): Promise<MetricsSummary> => {
      try {
        // Fetch from SONGSS Neural Intelligence Engine API
        const response = await fetch("https://api.songssintelligence.com/metrics");
        
        if (!response.ok) {
          console.error("Neural Engine API Error:", response.statusText);
          return {
            totalStreams: 0,
            totalRevenue: 0,
            totalArtists: 0,
            revenueData: [],
            revenueChange: 0,
            analysisLabels: [],
          };
        }

        const data: NeuralEngineMetric[] = await response.json();

        if (!data || data.length === 0) {
          return {
            totalStreams: 0,
            totalRevenue: 0,
            totalArtists: 0,
            revenueData: [],
            revenueChange: 0,
            analysisLabels: [],
          };
        }

        // Process Neural Engine metrics
        // growth_projection is used as a base multiplier for realistic values
        const totalGrowth = data.reduce((sum, row) => 
          sum + Number(row.growth_projection), 0);
        
        // Scale to realistic stream/revenue values
        const totalStreams = Math.round(totalGrowth * 1000000); // Scale to millions
        const totalRevenue = Math.round(totalGrowth * 50000); // Scale to revenue
        const totalArtists = data.length * 150; // Artists per region

        // Extract analysis labels from Neural Engine
        const analysisLabels = data.map(row => row.analysis_label).filter(Boolean);

        // Generate revenue data for chart visualization
        const revenueData = data.map((row) => ({
          value: Math.round(Number(row.growth_projection) * 15000),
        }));

        // Calculate revenue trend
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
          analysisLabels,
        };
      } catch (error) {
        console.error("Neural Engine connection error:", error);
        return {
          totalStreams: 0,
          totalRevenue: 0,
          totalArtists: 0,
          revenueData: [],
          revenueChange: 0,
          analysisLabels: [],
        };
      }
    },
    staleTime: 60000, // 1 minute cache
    refetchInterval: 300000, // Refresh every 5 minutes
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
    analysisLabels: summary?.analysisLabels || [],
  };
}
