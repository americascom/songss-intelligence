import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  icon: LucideIcon;
  value: string;
  label: string;
  trend?: string;
  delay?: number;
}

const MetricCard = ({ icon: Icon, value, label, trend, delay = 0 }: MetricCardProps) => {
  return (
    <div 
      className="bg-card rounded-xl p-6 shadow-card border border-border hover:shadow-hero transition-all duration-300 animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-lg gradient-primary">
          <Icon className="w-5 h-5 text-foreground" />
        </div>
        {trend && (
          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <p className="text-3xl md:text-4xl font-bold text-foreground mb-1">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
};

export default MetricCard;
