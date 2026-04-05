import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";

const Terms = () => (
  <div className="min-h-screen bg-background text-foreground flex flex-col">
    <div className="flex-1 container max-w-3xl py-16 md:py-24 px-6">
      <Button variant="ghost" asChild className="mb-12 -ml-2 text-muted-foreground hover:text-foreground">
        <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Home</Link>
      </Button>

      <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-12">Terms of Service</h1>

      <div className="space-y-10 text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Nature of Service</h2>
          <p>Songss Intelligence provides AI-driven data analytics and automated marketing assets (Curator Pitch). These are for informational purposes only.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">No Guarantee of Success</h2>
          <p>We do not guarantee specific career outcomes, playlist placements, or revenue increases.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Data Accuracy</h2>
          <p>Our insights are based on public streaming and social metrics. We are not responsible for inaccuracies in third-party data providers.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">No Refunds</h2>
          <p>Due to the digital and instantaneous nature of our reports, all sales are final once the data has been generated.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Privacy</h2>
          <p>Your data is handled according to our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>, focused on enhancing your artistic performance.</p>
        </section>
      </div>
    </div>
    <Footer />
  </div>
);

export default Terms;
