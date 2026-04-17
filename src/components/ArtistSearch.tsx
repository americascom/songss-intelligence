import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Music2 } from "lucide-react";
import { Card } from "@/components/ui/card";

const ArtistSearch = () => {
  const [artist, setArtist] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!artist.trim()) return;

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch(
        "https://n8n.songssintelligence.com/webhook/analise-artista",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            artist: artist.trim(),
            plan: "major",
          }),
        }
      );

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      console.error("Error analyzing artist:", err);
      setError(
        err instanceof Error ? err.message : "Failed to retrieve data. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      handleAnalyze();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Search Container */}
      <div className="relative">
        {/* Glow Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-2xl blur-xl opacity-70" />
        
        {/* Search Box */}
        <div className="relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-2 shadow-hero">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for any artist worldwide..."
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className="pl-12 pr-4 h-14 text-base md:text-lg bg-background/50 border-border/30 rounded-lg placeholder:text-muted-foreground/60 focus-visible:ring-primary/50"
              />
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={isLoading || !artist.trim()}
              size="lg"
              className="h-14 px-6 md:px-8 gradient-primary font-semibold text-base shadow-lg hover:shadow-primary/25 transition-all duration-300"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Music2 className="w-5 h-5 mr-2" />
                  Analyze
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="mt-8 flex flex-col items-center justify-center animate-fade-in">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Music2 className="w-6 h-6 text-primary animate-pulse" />
            </div>
          </div>
          <p className="mt-4 text-sm font-medium text-primary tracking-wide uppercase">
            Retrieving Global Market Data...
          </p>
          <div className="mt-2 flex gap-1">
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Card className="mt-6 p-6 border-destructive/50 bg-destructive/10 animate-fade-in">
          <p className="text-destructive text-sm font-medium">{error}</p>
        </Card>
      )}

      {/* Response Display */}
      {response && !isLoading && (
        <Card className="mt-6 p-6 bg-card/80 backdrop-blur-sm border-border/50 shadow-card animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg gradient-primary">
              <Music2 className="w-4 h-4 text-foreground" />
            </div>
            <h3 className="font-semibold text-foreground">Neural Engine Response</h3>
          </div>
          <div className="bg-background/50 rounded-lg p-4 border border-border/30">
            <pre className="text-sm text-muted-foreground overflow-x-auto whitespace-pre-wrap break-words font-mono">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ArtistSearch;
