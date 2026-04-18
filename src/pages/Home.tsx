import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Music, DollarSign, Users, TrendingUp, BarChart3, Globe, Mail } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Suspense, lazy } from "react";
import MetricCard from "@/components/MetricCard";
import DemoChart from "@/components/DemoChart";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FestivalIcons from "@/components/FestivalIcons";
import MiniRevenueChart from "@/components/MiniRevenueChart";
import ArtistSearch from "@/components/ArtistSearch";
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
      <main className="flex-1 pt-20 md:pt-24">
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
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 leading-tight animate-fade-in" style={{ animationDelay: "100ms" }}>
                Unlock{" "}
                <span className="text-gradient">Global Music</span>
                {" "}Insights
              </h1>
              <div className="mb-6 animate-fade-in" style={{ animationDelay: "150ms" }}>
                <p className="text-xl md:text-2xl font-light text-foreground/80 italic tracking-tight">
                  Thinking First.
                </p>
                <p className="text-xs uppercase tracking-[0.2em] text-primary/60 mt-1">
                  by Americascom, Inc.
                </p>
              </div>
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
                  <Button size="lg" variant="outline" className="font-semibold text-base px-8 bg-transparent border-2 border-primary text-foreground hover:bg-primary/10 hover:text-foreground">
                    View Demo
                  </Button>
                </Link>
              </div>

              {/* CTA: Get My Artist Report */}
              <div className="mt-10 animate-fade-in" style={{ animationDelay: "400ms" }}>
                <Link to="/auth">
                  <Button
                    size="lg"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-base px-10 py-6 shadow-[0_0_30px_-5px_hsl(var(--primary)/0.5)] hover:shadow-[0_0_40px_-5px_hsl(var(--primary)/0.7)] transition-all"
                  >
                    Get My Artist Report
                  </Button>
                </Link>
                <p className="text-xs text-muted-foreground/70 mt-4">
                  AI-powered customer support · 24/7 · EN · PT · ES
                </p>
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

              {/* 3D Globe - Fully responsive container */}
              <div 
                className="w-full flex items-center justify-center"
                style={{ overflow: 'visible', minHeight: '320px' }}
              >
                <Suspense fallback={
                  <div className="w-full h-[320px] sm:h-[380px] md:h-[420px] flex items-center justify-center">
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

      {/* Social Proof Section */}
      <section className="py-12 md:py-16 border-t border-border/50">
        <div className="container max-w-5xl">
          <h2 className="text-center text-xl md:text-2xl font-semibold text-foreground mb-10 tracking-tight">
            Tracking Performance Across the World's Leading Platforms
          </h2>
          <div className="space-y-5">
            {[
              ["Spotify", "Apple Music", "YouTube Music", "Deezer", "Tidal", "Amazon Music", "Pandora", "SoundCloud"],
              ["TikTok", "Shazam", "Last.fm", "Genius", "MusicBrainz", "Jamendo", "Instagram", "Facebook"],
            ].map((row, rowIdx) => (
              <div
                key={rowIdx}
                className="flex flex-wrap justify-center items-center gap-x-3 gap-y-2 text-sm md:text-base text-muted-foreground/80"
              >
                {row.map((name, i) => (
                  <span key={name} className="flex items-center gap-x-3">
                    <span className="font-medium tracking-wide">{name}</span>
                    {i < row.length - 1 && (
                      <span className="text-primary/70 text-lg leading-none select-none" aria-hidden="true">·</span>
                    )}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Bar Section */}
      <section className="py-10 md:py-14 bg-background border-t border-border/30">
        <div className="container">
          <p className="text-center text-xs uppercase tracking-[0.2em] font-medium text-primary/60 mb-8">
            Enterprise Infrastructure You Can Trust
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-14">
            {["ASCAP Member", "Powered by Cloudflare", "WWTV Play Infrastructure"].map((badge) => (
              <span
                key={badge}
                className="text-sm md:text-base font-medium text-muted-foreground/50 tracking-wide"
              >
                {badge}
              </span>
            ))}
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

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-background border-t border-border/50">
        <div className="container max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Frequently Asked <span className="text-gradient">Questions</span>
            </h2>
            <p className="text-muted-foreground">Everything you need to know about SONGSS Intelligence.</p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-3">
            {[
              { q: "What is SONGSS Intelligence?", a: "SONGSS Intelligence is an AI-powered music analytics platform that tracks artist performance across major streaming platforms — including Spotify, YouTube, TikTok, Deezer, and more — delivering actionable insights via detailed reports." },
              { q: "How does the analysis work?", a: "After subscribing, you submit your artist name and key platforms. Our AI agents collect data from multiple sources, cross-reference performance metrics, and deliver a comprehensive intelligence report directly to your email." },
              { q: "Which platforms do you track?", a: "We track Spotify, YouTube, TikTok, Deezer, SoundCloud, Last.fm, MusicBrainz, Shazam, Genius, and Jamendo — with more platforms being added continuously." },
              { q: "How long does it take to receive my report?", a: "Most reports are delivered within minutes of your request being processed." },
              { q: "What is the difference between the plans?", a: "Plans range from Artist Indie ($9.90/month) for independent artists to Opus Maximus (by consultation) for labels and investors. Each tier unlocks deeper data sources, AI models, and strategic insights. See our Pricing page for a full comparison." },
              { q: "Can I upgrade or downgrade my plan?", a: "Yes. You can change your plan at any time through your account dashboard. Changes take effect on your next billing cycle." },
              { q: "Is there a free trial?", a: "We offer a free tier with limited access so you can experience the platform before subscribing to a paid plan." },
              { q: "What payment methods do you accept?", a: "All major credit and debit cards, plus international payment methods. Payments are processed securely by AmericasPay, powered by Stripe." },
              { q: "Is my payment secure?", a: "Yes. All transactions are encrypted and processed by AmericasPay — Americascom's payment infrastructure, built on Stripe technology." },
              { q: "How does AI-powered support work?", a: "Our AI support agent is available 24/7 in English, Portuguese, and Spanish. For Opus Maximus clients, human strategic oversight is also available via email or chat." },
              { q: "Do you offer support in Portuguese and Spanish?", a: "Yes. Our AI support system is fully trilingual — English, Portuguese, and Spanish." },
              { q: "How recent is the data?", a: "Data is collected in near real-time from our integrated sources, ensuring your reports reflect the most current available metrics." },
              { q: "Is my artist data private?", a: "Absolutely. Your data is never shared with third parties. All reports are generated exclusively for your account and delivered privately to your email." },
            ].map((item, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border border-border/60 rounded-lg bg-card/40 px-5 hover:border-primary/40 transition-colors data-[state=open]:border-primary/60 data-[state=open]:bg-card/70"
              >
                <AccordionTrigger className="text-left text-foreground font-medium hover:text-primary hover:no-underline py-5">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-5">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-12 text-center p-6 rounded-xl border border-primary/20 bg-primary/5">
            <p className="text-muted-foreground leading-relaxed">
              Still have questions? Contact us at{" "}
              <a
                href="mailto:hello@songssintelligence.com"
                className="inline-flex items-center gap-1.5 text-primary font-semibold hover:underline"
              >
                <Mail className="w-4 h-4" />
                hello@songssintelligence.com
              </a>
              {" "}— our AI support team responds 24/7 in English, Portuguese, and Spanish.
            </p>
          </div>
        </div>
      </section>
    </main>
    <Footer />
    </div>
  );
};

export default Home;
