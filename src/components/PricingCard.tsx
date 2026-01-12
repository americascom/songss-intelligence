import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  ctaText: string;
  delay?: number;
}

const PricingCard = ({
  name,
  price,
  period,
  description,
  features,
  isPopular = false,
  ctaText,
  delay = 0,
}: PricingCardProps) => {
  return (
    <div
      className={`relative bg-white/5 rounded-2xl p-6 md:p-8 border transition-all duration-300 animate-fade-in ${
        isPopular
          ? "border-primary shadow-hero scale-[1.02]"
          : "border-white/10 shadow-card hover:shadow-hero"
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 gradient-primary rounded-full text-xs font-semibold text-white">
          Most Popular
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2">{name}</h3>
        <p className="text-sm text-white/60">{description}</p>
      </div>

      <div className="mb-6">
        <span className="text-4xl md:text-5xl font-bold text-white">{price}</span>
        <span className="text-white/60">/{period}</span>
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <div className="mt-0.5 p-1 rounded-full bg-primary/20">
              <Check className="w-3 h-3 text-primary" />
            </div>
            <span className="text-sm text-white/70">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        className={`w-full font-semibold ${
          isPopular
            ? "gradient-primary hover:opacity-90 text-white"
            : "bg-white text-black hover:bg-white/90"
        }`}
        size="lg"
      >
        {ctaText}
      </Button>
    </div>
  );
};

export default PricingCard;
