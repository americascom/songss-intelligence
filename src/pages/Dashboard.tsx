import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Lock, Music, DollarSign, Users, TrendingUp, Globe, Calendar } from "lucide-react";
import MetricCard from "@/components/MetricCard";
import DemoChart from "@/components/DemoChart";

const Dashboard = () => {
  // For demo purposes, showing a preview with paywall overlay
  const isSubscribed = false;

  if (!isSubscribed) {
    return (
      <main className="pt-16 md:pt-20 min-h-screen relative">
        {/* Blurred Dashboard Preview */}
        <div className="absolute inset-0 pt-16 md:pt-20 blur-sm pointer-events-none">
          <div className="container py-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <MetricCard icon={Music} value="11,234" label="Total Streams" />
              <MetricCard icon={DollarSign} value="$5,420" label="Revenue" />
              <MetricCard icon={Users} value="51" label="Artists" />
              <MetricCard icon={TrendingUp} value="+12%" label="Growth" />
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-card p-6 rounded-2xl border border-border">
                <DemoChart type="area" />
              </div>
              <div className="bg-card p-6 rounded-2xl border border-border">
                <DemoChart type="bar" />
              </div>
            </div>
          </div>
        </div>

        {/* Paywall Overlay */}
        <div className="relative z-10 min-h-[80vh] flex items-center justify-center">
          <div className="bg-card/95 backdrop-blur-sm p-8 md:p-12 rounded-2xl border border-border shadow-hero max-w-lg mx-4 text-center animate-scale-in">
            <div className="p-4 rounded-full gradient-primary w-fit mx-auto mb-6">
              <Lock className="w-8 h-8 text-foreground" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Premium Analytics Dashboard
            </h1>
            <p className="text-muted-foreground mb-8">
              Subscribe to access real-time streaming data, revenue reports, 
              and advanced analytics for your music catalog.
            </p>
            <div className="flex flex-col gap-3">
              <Link to="/pricing">
                <Button size="lg" className="w-full gradient-primary font-semibold">
                  View Plans & Subscribe
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full">
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-16 md:pt-20 min-h-screen bg-muted/30">
      <div className="container py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Your global music performance at a glance</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              Last 30 Days
            </Button>
            <Button variant="outline" size="sm">
              <Globe className="w-4 h-4 mr-2" />
              All Regions
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            icon={Music}
            value="11,234"
            label="Total Streams"
            trend="+12%"
            delay={0}
          />
          <MetricCard
            icon={DollarSign}
            value="$5,420"
            label="Monthly Revenue"
            trend="+8%"
            delay={100}
          />
          <MetricCard
            icon={Users}
            value="51"
            label="Active Artists"
            trend="+3"
            delay={200}
          />
          <MetricCard
            icon={TrendingUp}
            value="2.4%"
            label="Churn Rate"
            trend="-0.5%"
            delay={300}
          />
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-card p-6 rounded-2xl border border-border shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Streams & Revenue</h3>
              <span className="text-xs text-muted-foreground">Last 7 months</span>
            </div>
            <DemoChart type="area" />
          </div>
          <div className="bg-card p-6 rounded-2xl border border-border shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Streams by Country</h3>
              <span className="text-xs text-muted-foreground">Top 5</span>
            </div>
            <DemoChart type="bar" />
          </div>
        </div>

        {/* Top Artists Table */}
        <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="font-semibold text-foreground">Top Artists</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Artist</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Streams</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Revenue</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Growth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { name: "Luna Nova", streams: "2.4M", revenue: "$12,340", growth: "+24%" },
                  { name: "The Vibes", streams: "1.8M", revenue: "$9,120", growth: "+18%" },
                  { name: "DJ Pulse", streams: "1.2M", revenue: "$6,890", growth: "+15%" },
                  { name: "Starlight", streams: "890K", revenue: "$4,560", growth: "+12%" },
                  { name: "Echo Band", streams: "670K", revenue: "$3,210", growth: "+8%" },
                ].map((artist, index) => (
                  <tr key={index} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{artist.name}</td>
                    <td className="px-6 py-4 text-foreground/80">{artist.streams}</td>
                    <td className="px-6 py-4 text-foreground/80">{artist.revenue}</td>
                    <td className="px-6 py-4">
                      <span className="text-primary font-medium">{artist.growth}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
