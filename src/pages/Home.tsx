import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Music, DollarSign, Users, TrendingUp, BarChart3, Globe } from "lucide-react";
import { Suspense, lazy } from "react";
import MetricCard from "@/components/MetricCard";
import DemoChart from "@/components/DemoChart";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FestivalIcons from "@/components/FestivalIcons";
import MiniRevenueChart from "@/components/MiniRevenueChart";
import { useFormattedMetrics } from "@/hooks/useMetricsData";

const Globe3D = lazy(() => import("@/components/Globe3D"));

const Home = () => {
  const { totalStreams, totalRevenue, totalArtists } = useFormattedMetrics();

  // Use real data if available, otherwise show demo values
  const displayStreams = totalStreams !== "0" ? totalStreams : "11K+";
  const displayRevenue = totalRevenue !== "$0" ? totalRevenue : "$5K";
  const displayArtists = totalArtists !== "0" ? totalArtists : "51";

  return (
    <div className="min-h-screen flex flex-col bg-background dark">
      <Header />
      <main className="flex-1 pt-16 md:pt-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(179_43%_47%_/_0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(179_43%_47%_/_0.1),transparent_50%)]" />
        <div className="container py-12 md:py-20 lg:py-24 relative">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Text Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6 animate-fade-in">
                <TrendingUp className="w-4 h-4" />
                Real-time music intelligence
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight animate-fade-in" style={{ animationDelay: "100ms" }}>
                Unlock{" "}
                <span className="text-gradient">Global Music</span>
                {" "}Insights
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-fade-in" style={{ animationDelay: "200ms" }}>
                Track streams, revenue, and artist performance across every platform. 
                Make data-driven decisions with real-time analytics.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in" style={{ animationDelay: "300ms" }}>
                <Link to="/auth">
                  <Button size="lg" className="gradient-primary font-semibold text-base px-8 shadow-hero">
                    Sign Up Free
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button size="lg" variant="outline" className="font-semibold text-base px-8 border-primary/30 hover:bg-primary/10">
                    View Demo
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right: 3D Globe with Icons and Chart */}
            <div 
              className="relative flex items-center justify-center animate-fade-in" 
              style={{ animationDelay: "400ms", overflow: "visible" }}
            >
              {/* Festival Icons - Left side */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:translate-x-0 z-10 hidden sm:block">
                <FestivalIcons />
              </div>

              {/* 3D Globe */}
              <div 
                className="w-full flex items-center justify-center px-4 md:px-8"
                style={{ overflow: "visible" }}
              >
                <Suspense fallback={
                  <div className="w-full h-[350px] md:h-[450px] flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full border-2 border-primary/30 animate-pulse" />
                  </div>
                }>
                  <Globe3D />
                </Suspense>
              </div>

              {/* Mini Revenue Chart - Right side */}
              <div className="absolute right-0 bottom-8 translate-x-4 md:translate-x-0 z-10 hidden sm:block">
                <MiniRevenueChart />
              </div>
            </div>
          </div>

          {/* Demo Metrics - Below Hero */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto mt-12 md:mt-16">
            <MetricCard
              icon={Music}
              value={displayStreams}
              label="Daily Streams"
              trend="+12%"
              delay={500}
            />
            <MetricCard
              icon={DollarSign}
              value={displayRevenue}
              label="Monthly Revenue"
              trend="+8%"
              delay={600}
            />
            <MetricCard
              icon={Users}
              value={displayArtists}
              label="Active Artists"
              trend="+3"
              delay={700}
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Grow
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comprehensive analytics tools designed for artists, labels, and music industry professionals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                icon: BarChart3,
                title: "Stream Analytics",
                description: "Track plays across Spotify, Apple Music, YouTube, and more in real-time."
              },
              {
                icon: Globe,
                title: "Global Insights",
                description: "See where your music performs best with country and continent breakdowns."
              },
              {
                icon: DollarSign,
                title: "Revenue Tracking",
                description: "Monitor earnings across all platforms with detailed royalty reports."
              },
              {
                icon: TrendingUp,
                title: "Trend Detection",
                description: "Identify viral moments and capitalize on emerging opportunities."
              },
              {
                icon: Users,
                title: "Audience Demographics",
                description: "Understand your listeners with age, gender, and location data."
              },
              {
                icon: Music,
                title: "Playlist Tracking",
                description: "Monitor playlist placements and their impact on your streams."
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-card p-6 rounded-xl border border-border shadow-card hover:shadow-hero transition-all duration-300 group"
              >
                <div className="p-3 rounded-lg gradient-primary w-fit mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-5 h-5 text-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chart Preview Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Visualize Your Success
              </h2>
              <p className="text-muted-foreground mb-6">
                Interactive charts and graphs help you understand trends at a glance. 
                Filter by date range, platform, or region to get the insights you need.
              </p>
              <Link to="/pricing">
                <Button className="gradient-primary font-semibold">
                  Start Free Trial
                </Button>
              </Link>
            </div>
            <div className="bg-card p-6 rounded-2xl border border-border shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Stream Performance</h3>
                <span className="text-xs text-muted-foreground">Last 7 months</span>
              </div>
              <DemoChart type="area" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 gradient-primary">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to Transform Your Music Career?
          </h2>
          <p className="text-foreground/80 mb-8 max-w-2xl mx-auto">
            Join thousands of artists and labels using SONGSS Intelligence to make smarter decisions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 font-semibold text-base px-8">
              Get Started Free
            </Button>
            <Link to="/pricing">
              <Button size="lg" variant="outline" className="border-foreground text-foreground hover:bg-foreground/10 font-semibold text-base px-8">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
    <Footer />
    </div>
  );
};

export default Home;
