import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { useFormattedMetrics } from '@/hooks/useMetricsData';

export default function MiniRevenueChart() {
  const { revenueData, totalRevenue, revenueChange } = useFormattedMetrics();

  // Only ever render real data — no fabricated placeholder numbers.
  if (revenueData.length < 2 || totalRevenue === "$0") {
    return null;
  }

  const chartData = revenueData;
  const displayRevenue = totalRevenue;
  const displayChange = `${revenueChange > 0 ? '+' : ''}${revenueChange}%`;

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-primary/20 rounded-xl p-4 w-full max-w-[200px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">Revenue</span>
        <span className={`text-xs font-semibold ${revenueChange >= 0 ? 'text-primary' : 'text-red-500'}`}>
          {displayChange}
        </span>
      </div>
      <div className="text-xl font-bold text-foreground mb-2">{displayRevenue}</div>
      <div className="h-12">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="miniGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#44aaa9" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#44aaa9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke="#44aaa9"
              strokeWidth={2}
              fill="url(#miniGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
