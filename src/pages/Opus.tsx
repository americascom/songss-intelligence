import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, Crown } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const NEED_OPTIONS = [
  "Catalog Valuation",
  "Investment Decisions",
  "Compliance",
  "Other",
];

export default function Opus() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [catalogSize, setCatalogSize] = useState("");
  const [primaryNeed, setPrimaryNeed] = useState("");
  const [needDetails, setNeedDetails] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsDetails = primaryNeed === "Other";

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("https://n8n.songssintelligence.com/webhook/opus-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          company: company.trim(),
          email: email.trim(),
          catalog_size: catalogSize.trim(),
          primary_need: primaryNeed || null,
          need_details: needDetails.trim(),
        }),
      });
      if (!res.ok) throw new Error(`Webhook error ${res.status}`);
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : "Submission failed. Please try again.");
      return;
    }
    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-16 md:py-24">
        <Card className="w-full max-w-xl">
          {submitted ? (
            <CardContent className="text-center py-12">
              <div className="mx-auto mb-6 h-16 w-16 rounded-full flex items-center justify-center bg-primary/10">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Thank you!</h2>
              <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
                Thank you for reaching out! We've received your information and our team
                will review your needs to prepare a tailored proposal for Opus Maximus.
                You'll receive your proposal soon. In the meantime, feel free to reply
                directly to{" "}
                <a href="mailto:hello@songssintelligence.com" className="text-primary hover:underline">
                  hello@songssintelligence.com
                </a>{" "}
                if you have any urgent questions.
              </p>
            </CardContent>
          ) : (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto mb-2 p-3 rounded-full bg-primary/10 w-fit">
                  <Crown className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl md:text-3xl font-bold">Opus Maximus</CardTitle>
                <CardDescription>
                  Tell us about your catalog and goals. Our team will prepare a tailored,
                  white-glove proposal built around your specific needs.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={onSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="opus-name">Name *</Label>
                    <Input
                      id="opus-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      required
                      maxLength={120}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="opus-company">Company</Label>
                    <Input
                      id="opus-company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Label, management company, or firm"
                      maxLength={160}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="opus-email">Contact Email *</Label>
                    <Input
                      id="opus-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      maxLength={200}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="opus-catalog-size">Catalog / Portfolio Size</Label>
                    <Input
                      id="opus-catalog-size"
                      value={catalogSize}
                      onChange={(e) => setCatalogSize(e.target.value)}
                      placeholder="e.g. 25 artists"
                      maxLength={80}
                    />
                    <p className="text-xs text-muted-foreground">
                      Roughly how many artists are in your catalog or portfolio?
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="opus-need">Primary Need</Label>
                    <Select value={primaryNeed} onValueChange={setPrimaryNeed}>
                      <SelectTrigger id="opus-need">
                        <SelectValue placeholder="Select your primary need" />
                      </SelectTrigger>
                      <SelectContent>
                        {NEED_OPTIONS.map((n) => (
                          <SelectItem key={n} value={n}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="opus-need-details">
                      {needsDetails ? "Tell us more *" : "Additional Details"}
                    </Label>
                    <Textarea
                      id="opus-need-details"
                      value={needDetails}
                      onChange={(e) => setNeedDetails(e.target.value)}
                      placeholder="Any context on your goals, timeline, or specific requirements…"
                      maxLength={2000}
                      rows={4}
                      required={needsDetails}
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-destructive text-center">{error}</p>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={submitting || !name.trim() || !email.trim()}
                  >
                    {submitting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                    ) : (
                      "Request a Tailored Proposal"
                    )}
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </main>

      <Footer />
    </div>
  );
}
