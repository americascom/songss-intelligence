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
  ctaText,
  ctaLink,
  subtext,
  delay = 0,
}: PricingCardProps) => {
  const ButtonContent = (
    <Button
      className={`w-full font-semibold ${
        isPopular
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
        isPopular
          ? "border-primary shadow-hero scale-[1.02]"
          : "border-border shadow-card hover:shadow-hero"
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 gradient-primary rounded-full text-xs font-semibold text-foreground">
          Most Popular
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-bold text-foreground mb-2">{name}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="mb-6">
        <span className="text-4xl md:text-5xl font-bold text-foreground">{price}</span>
        {period && <span className="text-muted-foreground">/{period}</span>}
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <div className="mt-0.5 p-1 rounded-full bg-primary/10">
              <Check className="w-3 h-3 text-primary" />
            </div>
            <span className="text-sm text-foreground/80">{feature}</span>
          </li>
        ))}
      </ul>

      {ctaLink ? (
        <Link to={ctaLink}>{ButtonContent}</Link>
      ) : (
        ButtonContent
      )}

      {subtext && (
        <p className="mt-4 text-xs text-muted-foreground text-center leading-relaxed">
          {subtext}
        </p>
      )}
    </div>
  );
};

export default PricingCard;
