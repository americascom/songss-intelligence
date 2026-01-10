import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const streamData = [
  { month: "Jan", streams: 4000, revenue: 2400 },
  { month: "Feb", streams: 3000, revenue: 1398 },
  { month: "Mar", streams: 5000, revenue: 3800 },
  { month: "Apr", streams: 4780, revenue: 3908 },
  { month: "May", streams: 5890, revenue: 4800 },
  { month: "Jun", streams: 6390, revenue: 5200 },
  { month: "Jul", streams: 7490, revenue: 5900 },
];

const countryData = [
  { country: "USA", streams: 4500 },
  { country: "Brazil", streams: 3200 },
  { country: "UK", streams: 2800 },
  { country: "Germany", streams: 2100 },
  { country: "Mexico", streams: 1800 },
];

interface DemoChartProps {
  type?: "area" | "bar";
}

const DemoChart = ({ type = "area" }: DemoChartProps) => {
  if (type === "bar") {
    return (
      <div className="w-full h-64 md:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={countryData}>
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

  return (
    <div className="w-full h-64 md:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={streamData}>
          <defs>
            <linearGradient id="colorStreams" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(160 100% 33%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(160 100% 33%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(165 100% 42%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(165 100% 42%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="month" 
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
          />
          <Area
            type="monotone"
            dataKey="streams"
            stroke="hsl(160 100% 33%)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorStreams)"
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="hsl(165 100% 42%)"
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
