import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BarChart3, Shield, CreditCard, Tv } from "lucide-react";

const ecosystemCards = [
  {
    icon: BarChart3,
    title: "Music Intelligence",
    description: "SONGSS Intelligence platform",
  },
  {
    icon: Shield,
    title: "Rights & Royalties",
    description: "Publishing administration, ASCAP member",
  },
  {
    icon: CreditCard,
    title: "Payment Infrastructure",
    description: "AmericasPay, by Stripe Technology",
  },
  {
    icon: Tv,
    title: "Video Distribution",
    description: "Global cloud streaming via WWTV Play",
  },
];

const About = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-24">
        <div className="container max-w-3xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Built by an <span className="text-gradient">Industry Insider</span>
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            SONGSS Intelligence was created by a media professional with over 40 years of experience in broadcasting, journalism, executive production, artistic direction, and music industry operations—not by a tech startup trying to guess what artists need.
          </p>
        </div>
      </section>

      {/* The Company */}
      <section className="py-16 border-t border-border">
        <div className="container max-w-3xl">
          <h2 className="text-xs uppercase tracking-[0.2em] text-primary/60 mb-4 font-semibold">The Company</h2>
          <p className="text-muted-foreground leading-relaxed">
            Americascom, Inc. is a Delaware-incorporated technology company operating at the intersection of music intelligence, royalty management, and media infrastructure. We are an IBM PartnerWorld Plus partner and Stripe.
          </p>
        </div>
      </section>

      {/* Our Ecosystem */}
      <section className="py-16 border-t border-border">
        <div className="container max-w-4xl">
          <h2 className="text-xs uppercase tracking-[0.2em] text-primary/60 mb-10 font-semibold text-center">Our Ecosystem</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {ecosystemCards.map((card) => (
              <Card key={card.title} className="bg-card border-border">
                <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                  <card.icon className="w-8 h-8 text-primary/70" />
                  <h3 className="font-semibold text-sm text-foreground">{card.title}</h3>
                  <p className="text-xs text-muted-foreground">{card.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why We Built This */}
      <section className="py-16 border-t border-border">
        <div className="container max-w-3xl">
          <h2 className="text-xs uppercase tracking-[0.2em] text-primary/60 mb-4 font-semibold">Why We Built This</h2>
          <p className="text-muted-foreground leading-relaxed">
            Independent artists and global labels alike lack accessible, actionable market intelligence. We built SONGSS Intelligence to democratize data that was previously available only to major label analytics teams — delivered instantly, via a simple chat interface.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-border">
        <div className="container max-w-3xl text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Ready to make smarter music decisions?</h2>
          <Link to="/pricing">
            <Button size="lg" className="gradient-primary font-semibold">
              Start Free Trial
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
