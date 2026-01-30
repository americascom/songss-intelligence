import { Button } from "@/components/ui/button";
import PricingCard from "@/components/PricingCard";
import { Check } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const plans = [
  {
    name: "Tier 1",
    displayName: "Artist Pro",
    price: "$29",
    period: "month",
    description: "Essential market intelligence for independent artists.",
    features: [
      "Up to 70 analytics insights",
      "Stream tracking across platforms",
      "Basic revenue reports",
      "Weekly email digests",
      "1 artist profile",
    ],
    ctaText: "Start Free Trial",
  },
  {
    name: "Tier 2",
    displayName: "Max",
    price: "$99",
    period: "month",
    description: "Advanced business intelligence with AI-powered analysis.",
    features: [
      "250+ deep analytics insights",
      "AI-powered trend predictions",
      "Advanced revenue forecasting",
      "Real-time notifications",
      "Up to 10 artist profiles",
      "Priority support",
    ],
    ctaText: "Get Started",
  },
  {
    name: "Tier 3",
    displayName: "Premium B2B",
    price: "$199",
    period: "month",
    description: "Enterprise-grade global market analysis for labels.",
    features: [
      "Unlimited analytics insights",
      "Custom API access",
      "White-label reports",
      "Dedicated account manager",
      "Unlimited artist profiles",
      "SLA guarantee",
      "Custom integrations",
    ],
    ctaText: "Contact Sales",
  },
  {
    name: "Tier 4",
    displayName: "Taylor Made",
    price: "$499",
    period: "month",
    description: "Bespoke intelligence suite with ROI projections & advisory.",
    features: [
      "Songss Neural Engine™: Proprietary deep-learning for global market prediction",
      "Territorial Performance Matrix: Granular insights by continent, country & state",
      "Predictive Growth Modeling: Data-backed artist scalability projections",
      "Investment & Ad ROI Strategy: Strategic marketing budget allocation",
      "Fan Persona & Behavioral Analytics: Advanced demographic mapping",
      "Dedicated Strategic Advisor",
      "Quarterly Business Reviews",
    ],
    isPopular: true,
    ctaText: "Request Consultation",
  },
];

const Pricing = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-16 md:pt-20">
      {/* Header */}
      <section className="py-16 md:py-24">
        <div className="container text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 animate-fade-in">
            Music Business Intelligence
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "100ms" }}>
            Global Market Analysis & ROI Projections. Choose the intelligence tier that scales with your ambition.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 md:py-16 -mt-8">
        <div className="container">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {plans.map((plan, index) => (
              <PricingCard
                key={index}
                name={plan.displayName}
                price={plan.price}
                period={plan.period}
                description={plan.description}
                features={plan.features}
                isPopular={plan.isPopular}
                ctaText={plan.ctaText}
                delay={index * 100}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-12 md:py-16 bg-card/50 border-y border-border">
        <div className="container">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
            Compare Intelligence Tiers
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full max-w-6xl mx-auto">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-3 font-medium text-foreground">Capability</th>
                  <th className="text-center py-4 px-3 font-medium text-foreground text-sm">Tier 1</th>
                  <th className="text-center py-4 px-3 font-medium text-foreground text-sm">Tier 2</th>
                  <th className="text-center py-4 px-3 font-medium text-foreground text-sm">Tier 3</th>
                  <th className="text-center py-4 px-3 font-medium text-primary text-sm">Tier 4</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { feature: "Analytics Insights", t1: "70", t2: "250+", t3: "Unlimited", t4: "Unlimited+" },
                  { feature: "Artist Profiles", t1: "1", t2: "10", t3: "Unlimited", t4: "Unlimited" },
                  { feature: "AI Predictions", t1: false, t2: true, t3: true, t4: true },
                  { feature: "Neural Engine™", t1: false, t2: false, t3: false, t4: true },
                  { feature: "Territorial Matrix", t1: false, t2: false, t3: false, t4: true },
                  { feature: "Predictive Growth Modeling", t1: false, t2: false, t3: true, t4: true },
                  { feature: "ROI Strategy Advisory", t1: false, t2: false, t3: false, t4: true },
                  { feature: "Fan Persona Analytics", t1: false, t2: false, t3: true, t4: true },
                  { feature: "API Access", t1: false, t2: false, t3: true, t4: true },
                  { feature: "White-label Reports", t1: false, t2: false, t3: true, t4: true },
                  { feature: "Dedicated Advisor", t1: false, t2: false, t3: false, t4: true },
                ].map((row, index) => (
                  <tr key={index}>
                    <td className="py-4 px-3 text-foreground/80 text-sm">{row.feature}</td>
                    <td className="py-4 px-3 text-center">
                      {typeof row.t1 === "boolean" ? (
                        row.t1 ? <Check className="w-5 h-5 text-primary mx-auto" /> : <span className="text-muted-foreground">—</span>
                      ) : (
                        <span className="text-foreground/80 text-sm">{row.t1}</span>
                      )}
                    </td>
                    <td className="py-4 px-3 text-center">
                      {typeof row.t2 === "boolean" ? (
                        row.t2 ? <Check className="w-5 h-5 text-primary mx-auto" /> : <span className="text-muted-foreground">—</span>
                      ) : (
                        <span className="text-foreground/80 text-sm">{row.t2}</span>
                      )}
                    </td>
                    <td className="py-4 px-3 text-center">
                      {typeof row.t3 === "boolean" ? (
                        row.t3 ? <Check className="w-5 h-5 text-primary mx-auto" /> : <span className="text-muted-foreground">—</span>
                      ) : (
                        <span className="text-foreground/80 text-sm">{row.t3}</span>
                      )}
                    </td>
                    <td className="py-4 px-3 text-center bg-primary/5">
                      {typeof row.t4 === "boolean" ? (
                        row.t4 ? <Check className="w-5 h-5 text-primary mx-auto" /> : <span className="text-muted-foreground">—</span>
                      ) : (
                        <span className="text-foreground font-medium text-sm">{row.t4}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Trusted By / Platform Integrations */}
      <section className="py-12 md:py-16">
        <div className="container text-center">
          <p className="text-sm text-muted-foreground mb-8">Trusted data sources & platform integrations</p>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {/* Spotify */}
            <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center">
                <span className="text-foreground font-bold text-sm">S</span>
              </div>
              <span className="font-medium text-foreground/80 text-sm">Spotify</span>
            </div>
            {/* Apple Music */}
            <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center">
                <span className="text-foreground font-bold text-sm">♪</span>
              </div>
              <span className="font-medium text-foreground/80 text-sm">Apple Music</span>
            </div>
            {/* YouTube Music */}
            <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center">
                <span className="text-foreground font-bold text-sm">▶</span>
              </div>
              <span className="font-medium text-foreground/80 text-sm">YouTube Music</span>
            </div>
            {/* TikTok */}
            <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center">
                <span className="text-foreground font-bold text-sm">♫</span>
              </div>
              <span className="font-medium text-foreground/80 text-sm">TikTok</span>
            </div>
            {/* Deezer */}
            <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center">
                <span className="text-foreground font-bold text-sm">D</span>
              </div>
              <span className="font-medium text-foreground/80 text-sm">Deezer</span>
            </div>
            {/* SoundCloud */}
            <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center">
                <span className="text-foreground font-bold text-sm">☁</span>
              </div>
              <span className="font-medium text-foreground/80 text-sm">SoundCloud</span>
            </div>
            {/* Tidal */}
            <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center">
                <span className="text-foreground font-bold text-sm">T</span>
              </div>
              <span className="font-medium text-foreground/80 text-sm">Tidal</span>
            </div>
            {/* Amazon Music */}
            <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center">
                <span className="text-foreground font-bold text-sm">A</span>
              </div>
              <span className="font-medium text-foreground/80 text-sm">Amazon Music</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ or CTA */}
      <section className="py-12 md:py-16 gradient-primary">
        <div className="container text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Questions? We're Here to Help
          </h2>
          <p className="text-foreground/80 mb-8 max-w-xl mx-auto">
            Not sure which plan is right for you? Contact our team for a personalized recommendation.
          </p>
          <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 font-semibold">
            Contact Sales
          </Button>
        </div>
      </section>
    </main>
    <Footer />
    </div>
  );
};

export default Pricing;
