import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const defaultStreamData = [
  { name: "Jan", streams: 4000, revenue: 2400 },
  { name: "Feb", streams: 3000, revenue: 1398 },
  { name: "Mar", streams: 5000, revenue: 3800 },
  { name: "Apr", streams: 4780, revenue: 3908 },
  { name: "May", streams: 5890, revenue: 4800 },
  { name: "Jun", streams: 6390, revenue: 5200 },
  { name: "Jul", streams: 7490, revenue: 5900 },
];

const defaultCountryData = [
  { country: "USA", streams: 4500 },
  { country: "Brazil", streams: 3200 },
  { country: "UK", streams: 2800 },
  { country: "Germany", streams: 2100 },
  { country: "Mexico", streams: 1800 },
];

interface ChartDataPoint {
  name?: string;
  month?: string;
  streams: number;
  revenue?: number;
}

interface CountryDataPoint {
  country: string;
  streams: number;
}

interface DemoChartProps {
  type?: "area" | "bar";
  data?: ChartDataPoint[] | CountryDataPoint[];
}

const DemoChart = ({ type = "area", data }: DemoChartProps) => {
  if (type === "bar") {
    const barData = (data as CountryDataPoint[])?.length > 0 
      ? (data as CountryDataPoint[]) 
      : defaultCountryData;

    return (
      <div className="w-full h-64 md:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="country" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value: number) => [value.toLocaleString(), "Streams"]}
            />
            <Bar 
              dataKey="streams" 
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  const areaData = (data as ChartDataPoint[])?.length > 0 
    ? (data as ChartDataPoint[]) 
    : defaultStreamData;

  return (
    <div className="w-full h-64 md:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={areaData}>
          <defs>
            <linearGradient id="colorStreams" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(179 43% 47%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(179 43% 47%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(179 41% 34%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(179 41% 34%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="name" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
            formatter={(value: number, name: string) => [
              name === "revenue" ? `$${value.toLocaleString()}` : value.toLocaleString(),
              name === "revenue" ? "Revenue" : "Streams"
            ]}
          />
          <Area
            type="monotone"
            dataKey="streams"
            stroke="hsl(179 43% 47%)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorStreams)"
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="hsl(179 41% 34%)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorRevenue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DemoChart;
