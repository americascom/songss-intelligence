import { Button } from "@/components/ui/button";
import PricingCard from "@/components/PricingCard";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Artist Pro",
    price: "$29",
    period: "month",
    description: "Perfect for independent artists tracking their growth.",
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
    name: "Max",
    price: "$99",
    period: "month",
    description: "Advanced analytics powered by IBM WatsonX AI.",
    features: [
      "250+ deep analytics insights",
      "AI-powered trend predictions",
      "Advanced revenue forecasting",
      "Real-time notifications",
      "Up to 10 artist profiles",
      "Priority support",
    ],
    isPopular: true,
    ctaText: "Get Started",
  },
  {
    name: "Premium B2B",
    price: "$199",
    period: "month",
    description: "Enterprise solution for labels and distributors.",
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
];

const Pricing = () => {
  return (
    <main className="pt-16 md:pt-20 min-h-screen">
      {/* Header */}
      <section className="py-16 md:py-24 gradient-hero">
        <div className="container text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 animate-fade-in">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "100ms" }}>
            Choose the plan that fits your needs. All plans include a 14-day free trial.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 md:py-16 -mt-8">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <PricingCard
                key={index}
                {...plan}
                delay={index * 100}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
            Compare Plans
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full max-w-4xl mx-auto">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 font-medium text-foreground">Feature</th>
                  <th className="text-center py-4 px-4 font-medium text-foreground">Artist Pro</th>
                  <th className="text-center py-4 px-4 font-medium text-primary">Max</th>
                  <th className="text-center py-4 px-4 font-medium text-foreground">Premium</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { feature: "Analytics Insights", pro: "70", max: "250+", premium: "Unlimited" },
                  { feature: "Artist Profiles", pro: "1", max: "10", premium: "Unlimited" },
                  { feature: "AI Predictions", pro: false, max: true, premium: true },
                  { feature: "API Access", pro: false, max: false, premium: true },
                  { feature: "White-label Reports", pro: false, max: false, premium: true },
                  { feature: "Priority Support", pro: false, max: true, premium: true },
                  { feature: "Custom Integrations", pro: false, max: false, premium: true },
                ].map((row, index) => (
                  <tr key={index}>
                    <td className="py-4 px-4 text-foreground/80">{row.feature}</td>
                    <td className="py-4 px-4 text-center">
                      {typeof row.pro === "boolean" ? (
                        row.pro ? <Check className="w-5 h-5 text-primary mx-auto" /> : <span className="text-muted-foreground">—</span>
                      ) : (
                        <span className="text-foreground/80">{row.pro}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center bg-primary/5">
                      {typeof row.max === "boolean" ? (
                        row.max ? <Check className="w-5 h-5 text-primary mx-auto" /> : <span className="text-muted-foreground">—</span>
                      ) : (
                        <span className="text-foreground font-medium">{row.max}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {typeof row.premium === "boolean" ? (
                        row.premium ? <Check className="w-5 h-5 text-primary mx-auto" /> : <span className="text-muted-foreground">—</span>
                      ) : (
                        <span className="text-foreground/80">{row.premium}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="py-12 md:py-16">
        <div className="container text-center">
          <p className="text-sm text-muted-foreground mb-8">Trusted data sources</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-60">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#1DB954] flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="font-semibold text-foreground">Spotify</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#FF0000] flex items-center justify-center">
                <span className="text-white font-bold text-sm">▶</span>
              </div>
              <span className="font-semibold text-foreground">YouTube</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#FA243C] flex items-center justify-center">
                <span className="text-white font-bold text-sm">♪</span>
              </div>
              <span className="font-semibold text-foreground">Apple Music</span>
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
  );
};

export default Pricing;
