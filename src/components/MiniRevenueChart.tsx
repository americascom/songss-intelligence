import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const data = [
  { value: 2400 },
  { value: 1398 },
  { value: 4800 },
  { value: 3908 },
  { value: 4800 },
  { value: 3800 },
  { value: 5300 },
];

export default function MiniRevenueChart() {
  return (
    <div className="bg-card/50 backdrop-blur-sm border border-primary/20 rounded-xl p-4 w-full max-w-[200px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">Revenue</span>
        <span className="text-xs text-primary font-semibold">+18%</span>
      </div>
      <div className="text-xl font-bold text-foreground mb-2">$12.4K</div>
      <div className="h-12">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="miniGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00A676" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#00A676" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke="#00A676"
              strokeWidth={2}
              fill="url(#miniGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
