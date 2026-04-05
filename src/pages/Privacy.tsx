import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";

const Privacy = () => (
  <div className="min-h-screen bg-background text-foreground flex flex-col">
    <div className="flex-1 container max-w-3xl py-16 md:py-24 px-6">
      <Button variant="ghost" asChild className="mb-12 -ml-2 text-muted-foreground hover:text-foreground">
        <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Home</Link>
      </Button>

      <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-12">Privacy Policy</h1>

      <div className="space-y-10 text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Data Collection</h2>
          <p>We collect your email and artist name to process reports and improve our neural models.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Payment Info</h2>
          <p>All payments are processed via Stripe (Americas Pay). We do not store credit card details on our servers.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Data Usage</h2>
          <p>Your data is never sold to third parties. It is used exclusively to generate your intelligence reports.</p>
        </section>
      </div>
    </div>
    <Footer />
  </div>
);

export default Privacy;
