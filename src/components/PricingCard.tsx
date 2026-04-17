import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  isVIP?: boolean;
  ctaText: string;
  ctaLink?: string;
  subtext?: string;
  delay?: number;
}

const PricingCard = ({
  name,
  price,
  period,
  description,
  features,
  isPopular = false,
  isVIP = false,
  ctaText,
  ctaLink,
  subtext,
  delay = 0,
}: PricingCardProps) => {
  const ButtonContent = (
    <Button
      className={`w-full font-semibold ${
        isPopular || isVIP
          ? "gradient-primary hover:opacity-90"
          : "bg-foreground text-background hover:bg-foreground/90"
      }`}
      size="lg"
    >
      {ctaText}
    </Button>
  );

  return (
    <div
      className={`relative bg-card rounded-2xl p-6 md:p-8 border transition-all duration-300 animate-fade-in ${
        isVIP
          ? "border-primary/40 shadow-[0_0_30px_-5px_hsl(var(--primary)/0.25)] ring-1 ring-primary/10"
          : isPopular
            ? "border-primary shadow-hero scale-[1.02]"
            : "border-border shadow-card hover:shadow-hero"
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {isPopular && !isVIP && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 gradient-primary rounded-full text-xs font-semibold text-foreground">
          Most Popular
        </div>
      )}

      {isVIP && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-5 py-1.5 gradient-primary rounded-full text-xs font-bold text-foreground tracking-wider uppercase">
          VIP Tier
        </div>
      )}

      <div className={isVIP ? "flex flex-col md:flex-row md:items-start md:gap-10" : ""}>
        <div className={isVIP ? "md:flex-1" : ""}>
          <div className="mb-6">
            <h3 className={`font-bold text-foreground mb-2 ${isVIP ? "text-2xl md:text-3xl" : "text-xl"}`}>{name}</h3>
            <p className={`text-muted-foreground ${isVIP ? "text-base" : "text-sm"}`}>{description}</p>
          </div>

          <div className="mb-6">
            <span className={`font-bold text-foreground ${isVIP ? (period ? "text-5xl md:text-6xl" : "text-3xl md:text-4xl") : "text-4xl md:text-5xl"}`}>{price}</span>
            {period && <span className="text-muted-foreground">/{period}</span>}
          </div>
        </div>

        <div className={isVIP ? "md:flex-1" : ""}>
          <ul className="space-y-3 mb-8">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="mt-0.5 p-1 rounded-full bg-primary/10">
                  <Check className="w-3 h-3 text-primary" />
                </div>
                <span className={`text-foreground/80 ${isVIP ? "text-sm md:text-base" : "text-sm"}`}>{feature}</span>
              </li>
            ))}
          </ul>

          {ctaLink ? (
            <Link to={ctaLink}>{ButtonContent}</Link>
          ) : (
            ButtonContent
          )}

          {subtext && (
            <p className={`mt-4 text-muted-foreground text-center leading-relaxed ${isVIP ? "text-sm" : "text-xs"}`}>
              {subtext}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PricingCard;
