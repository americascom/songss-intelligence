import { Button } from "@/components/ui/button";
import PricingCard from "@/components/PricingCard";
import { Check, Shield, BarChart3 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const plans = [
  {
    name: "Tier 1",
    displayName: "Artist Indie",
    price: "$9.90",
    period: "month",
    description: "Starter analytics for independent artists.",
    features: [
      "Core performance overview across major digital audio streaming providers (DSPs)",
      "Engagement tracking on primary global video networks",
      "Baseline audience retention metrics",
      "Automated 'Curator Pitch': AI-generated smart PR text based on your metrics, ready to pitch to curators and venues",
    ],
    isPopular: true,
    ctaText: "Get Started",
  },
  {
    name: "Tier 2",
    displayName: "Artist Indie Growth",
    price: "$29",
    period: "month",
    description: "Accelerate your reach with viral trend tracking.",
    features: [
      "Everything in Artist Indie, plus:",
      "Real-time metrics from short-form viral video networks",
      "Audience growth tracking and basic trend indicators",
      "Weekly automated performance insights",
    ],
    ctaText: "Get Started",
  },
  {
    name: "Tier 3",
    displayName: "Pro Team",
    price: "$99",
    period: "month",
    description: "Advanced cross-platform analytics for professional management.",
    features: [
      "Everything in Growth, plus:",
      "Integration with global audio recognition and discovery engines",
      "Early predictive insights for audience conversion",
      "Custom date-range analysis and priority BI reporting",
    ],
    ctaText: "Get Started",
  },
  {
    name: "Tier 4",
    displayName: "Enterprise",
    price: "$199",
    period: "month",
    description: "Institutional-grade market analysis and ROI projections.",
    features: [
      "Full access to all standard data pipelines, plus:",
      "Deep integration with global metadata registries",
      "Global hotspots mapping and regional demographic tracking",
      "Financial ROI projections and campaign conversion rates",
    ],
    ctaText: "Get Started",
  },
  {
    name: "Tier 5",
    displayName: "Opus Maximus",
    price: "Custom",
    period: "",
    description: "Bespoke C-level intelligence and autonomous prediction.",
    features: [
      "Unrestricted access to the Songss Intelligence ecosystem",
      "Autonomous Deep Scans: Advanced web sentiment and niche tracking",
      "Multi-layered predictive data crossing",
      "Direct strategic advisory from our proprietary AI architecture",
    ],
    ctaText: "Talk to our AI Consultant",
    ctaLink: "/chat",
    subtext: "Taylor Made VIP — Custom pricing for labels, investors, and global management.",
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
          {/* First row: 4 plans */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-[1200px] mx-auto">
            {plans.slice(0, 4).map((plan, index) => (
              <PricingCard
                key={index}
                name={plan.displayName}
                price={plan.price}
                period={plan.period}
                description={plan.description}
                features={plan.features}
                isPopular={plan.isPopular}
                ctaText={plan.ctaText}
                ctaLink={plan.ctaLink}
                subtext={plan.subtext}
                delay={index * 100}
              />
            ))}
          </div>
          
          {/* Second row: Opus Maximus */}
          <div className="mt-8 max-w-[1200px] mx-auto">
            <PricingCard
              name={plans[4].displayName}
              price={plans[4].price}
              period={plans[4].period}
              description={plans[4].description}
              features={plans[4].features}
              isPopular={plans[4].isPopular}
              ctaText={plans[4].ctaText}
              ctaLink={plans[4].ctaLink}
              subtext={plans[4].subtext}
              delay={400}
              isVIP
            />
          </div>
        </div>
      </section>

      {/* Payment Trust Section */}
      <section className="py-12 md:py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center bg-card/90 backdrop-blur-md border-2 border-primary/30 rounded-2xl p-10 md:p-14 shadow-xl shadow-primary/5">
            <div className="p-4 rounded-full bg-primary/15 w-fit mx-auto mb-6">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-4">Secure Payments</h3>
            <p className="text-foreground/90 text-sm md:text-base leading-relaxed mb-4">
              All payments processed securely by <span className="font-bold text-foreground">AmericasPay</span> —
              <br className="hidden sm:block" />
              Americascom's payment infrastructure, powered by Stripe.
              <br />
              Credit cards, debit cards, and international payments accepted worldwide.
            </p>
            <p className="text-muted-foreground text-xs md:text-sm">
              Americascom, Inc. is a C Corporation (C Corp). Delaware, USA.
            </p>
          </div>
        </div>
      </section>

      {/* Royalty Intelligence Add-on */}
      <section className="py-12 md:py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto bg-card/80 backdrop-blur-sm border border-primary/20 rounded-2xl p-10 md:p-14">
            <div className="flex items-start gap-4 md:gap-6">
              <div className="p-3 rounded-xl bg-primary/10 shrink-0 mt-1">
                <BarChart3 className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-foreground mb-1">
                  Royalty Intelligence <span className="text-xs font-normal text-primary bg-primary/10 px-2 py-0.5 rounded-full ml-2">Add-on</span>
                </h3>
                <p className="text-foreground/80 text-sm md:text-base leading-relaxed mt-3">
                  Connect your SONGSS analytics directly to your royalty
                  collection pipeline. Identify unclaimed streams,
                  track performance-to-royalty correlation, and
                  optimize collection across territories.
                </p>
                <p className="text-muted-foreground text-xs md:text-sm mt-4 italic">
                  — Powered by ASCAP + Americas Music Publishing integration
                </p>
              </div>
            </div>
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
                  <th className="text-left py-4 px-2 font-medium text-foreground text-xs">Capability</th>
                  <th className="text-center py-4 px-2 font-medium text-foreground text-xs">Indie</th>
                  <th className="text-center py-4 px-2 font-medium text-foreground text-xs">Growth</th>
                  <th className="text-center py-4 px-2 font-medium text-foreground text-xs">Pro</th>
                  <th className="text-center py-4 px-2 font-medium text-foreground text-xs">Enterprise</th>
                  <th className="text-center py-4 px-2 font-medium text-primary text-xs">Opus Maximus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { feature: "DSP Coverage", t1: "Core", t2: "Core+", t3: "Advanced", t4: "Full", t5: "Unrestricted" },
                  { feature: "Video Networks", t1: "Primary", t2: "Short-form", t3: "All", t4: "All", t5: "All+" },
                  { feature: "Audience Retention", t1: "Baseline", t2: "Growth", t3: "Full", t4: "Custom", t5: "Custom" },
                  { feature: "Curator Pitch (AI)", t1: true, t2: true, t3: true, t4: true, t5: true },
                  { feature: "Trend Indicators", t1: false, t2: true, t3: true, t4: true, t5: true },
                  { feature: "Predictive Insights", t1: false, t2: false, t3: true, t4: true, t5: true },
                  { feature: "BI Reporting", t1: false, t2: false, t3: true, t4: true, t5: true },
                  { feature: "Metadata Registries", t1: false, t2: false, t3: false, t4: true, t5: true },
                  { feature: "ROI Projections", t1: false, t2: false, t3: false, t4: true, t5: true },
                  { feature: "Autonomous Deep Scans", t1: false, t2: false, t3: false, t4: false, t5: true },
                  { feature: "Strategic Advisory", t1: false, t2: false, t3: false, t4: false, t5: true },
                ].map((row, index) => (
                  <tr key={index}>
                    <td className="py-3 px-2 text-foreground/80 text-xs">{row.feature}</td>
                    <td className="py-3 px-2 text-center">
                      {typeof row.t1 === "boolean" ? (
                        row.t1 ? <Check className="w-4 h-4 text-primary mx-auto" /> : <span className="text-muted-foreground">—</span>
                      ) : (
                        <span className="text-foreground/80 text-xs">{row.t1}</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {typeof row.t2 === "boolean" ? (
                        row.t2 ? <Check className="w-4 h-4 text-primary mx-auto" /> : <span className="text-muted-foreground">—</span>
                      ) : (
                        <span className="text-foreground/80 text-xs">{row.t2}</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {typeof row.t3 === "boolean" ? (
                        row.t3 ? <Check className="w-4 h-4 text-primary mx-auto" /> : <span className="text-muted-foreground">—</span>
                      ) : (
                        <span className="text-foreground/80 text-xs">{row.t3}</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {typeof row.t4 === "boolean" ? (
                        row.t4 ? <Check className="w-4 h-4 text-primary mx-auto" /> : <span className="text-muted-foreground">—</span>
                      ) : (
                        <span className="text-foreground/80 text-xs">{row.t4}</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center bg-primary/5">
                      {typeof row.t5 === "boolean" ? (
                        row.t5 ? <Check className="w-4 h-4 text-primary mx-auto" /> : <span className="text-muted-foreground">—</span>
                      ) : (
                        <span className="text-foreground font-medium text-xs">{row.t5}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
