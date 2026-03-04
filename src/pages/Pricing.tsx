import { Button } from "@/components/ui/button";
import PricingCard from "@/components/PricingCard";
import { Check, Shield } from "lucide-react";
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
      "Performance overview across Spotify, YouTube and SoundCloud",
      "3 Deep Scan credits per month",
      "Global Hotspots preview (top countries and cities)",
      "Email support",
    ],
    isPopular: true,
    ctaText: "Get Started",
  },
  {
    name: "Tier 2",
    displayName: "Artist Indie Growth",
    price: "$29",
    period: "month",
    description: "For artists starting to grow across multiple territories.",
    features: [
      "Everything in Artist Indie",
      "5 Deep Scan credits per month",
      "Extended Hotspots (countries and regions)",
      "30-day growth trends across major DSPs",
      "Practical suggestions for organic audience growth",
    ],
    ctaText: "Get Started",
  },
  {
    name: "Tier 3",
    displayName: "Pro / Team",
    price: "$99",
    period: "month",
    description: "For teams, labels and agencies managing several artists.",
    features: [
      "Everything in Artist Indie Growth",
      "25 Deep Scan credits per month",
      "Multi-artist and multi-user access",
      "Advanced strategy reports and campaign recommendations",
    ],
    ctaText: "Get Started",
  },
  {
    name: "Tier 4",
    displayName: "Enterprise",
    price: "$199",
    period: "month",
    description: "For larger catalogs and operations.",
    features: [
      "Everything in Pro / Team",
      "100 Deep Scan credits per month",
      "Unlimited team members",
      "Custom dashboards by country and continent",
      "Priority support and onboarding",
    ],
    ctaText: "Get Started",
  },
  {
    name: "Tier 5",
    displayName: "Taylor Made",
    price: "Custom",
    period: "",
    description: "Bespoke intelligence suite with ROI projections and strategic advisory for catalogs and rosters.",
    features: [
      "Neural insight engine for global market prediction (Songss proprietary models)",
      "Territorial Performance Matrix: granular insights by continent, country and state",
      "Predictive Growth Modeling: data-backed scalability projections for artists and catalogs",
      "Investment and Ad ROI Strategy: guidance for smarter marketing budget allocation",
      "Fan Persona & Behavioral Analytics: advanced demographic and engagement mapping",
      "Dedicated strategic advisor and quarterly business reviews",
      "Tailored for labels, investors and global management teams",
    ],
    ctaText: "Talk to our AI Consultant",
    ctaLink: "/chat",
    subtext: "Tailored for labels, investors, and global management.",
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
          
          {/* Second row: Taylor Made */}
          <div className="mt-6 max-w-2xl mx-auto">
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
            />
          </div>
        </div>
      </section>

      {/* Payment Trust Section */}
      <section className="py-10 md:py-14">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center bg-card/80 backdrop-blur-sm border border-primary/20 rounded-2xl p-8 md:p-10 shadow-lg">
            <div className="p-3 rounded-full bg-primary/10 w-fit mx-auto mb-5">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <p className="text-foreground/90 text-sm md:text-base leading-relaxed mb-3">
              All payments processed securely by <span className="font-semibold text-foreground">AmericasPay</span> —
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
                  <th className="text-center py-4 px-2 font-medium text-primary text-xs">Taylor Made</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { feature: "Deep Scan Credits", t1: "3", t2: "5", t3: "25", t4: "100", t5: "Custom" },
                  { feature: "DSP Coverage", t1: "3", t2: "Major", t3: "Major", t4: "All", t5: "All+" },
                  { feature: "Global Hotspots", t1: "Preview", t2: "Extended", t3: "Full", t4: "Custom", t5: "Custom" },
                  { feature: "Growth Trends", t1: false, t2: true, t3: true, t4: true, t5: true },
                  { feature: "Multi-Artist Access", t1: false, t2: false, t3: true, t4: true, t5: true },
                  { feature: "Strategy Reports", t1: false, t2: false, t3: true, t4: true, t5: true },
                  { feature: "Custom Dashboards", t1: false, t2: false, t3: false, t4: true, t5: true },
                  { feature: "Priority Support", t1: false, t2: false, t3: false, t4: true, t5: true },
                  { feature: "Private Briefings", t1: false, t2: false, t3: false, t4: false, t5: true },
                  { feature: "Tailored Models", t1: false, t2: false, t3: false, t4: false, t5: true },
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
