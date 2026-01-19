import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

const Index = () => {
  const [metrics, setMetrics] = useState<any[]>([]);

  useEffect(() => {
    const fetchMetrics = async () => {
      // Fetching market data from Supabase metrics table
      const { data, error } = await supabase
        .from('metrics')
        .select('*')
        .order('id', { ascending: true });
      
      if (error) {
        console.error("Data fetch error:", error);
      } else {
        setMetrics(data);
      }
    };

    fetchMetrics();
  }, []);

  // Helper function to assign region-specific brand colors
  const getRegionColor = (region: string) => {
    const r = region.toLowerCase();
    if (r.includes("states")) return "text-neon-green";
    if (r.includes("kingdom") || r.includes("uk")) return "text-blue-400";
    if (r.includes("brazil")) return "text-yellow-400";
    return "text-white";
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col font-sans selection:bg-neon-green selection:text-black">
      <main className="flex-grow container mx-auto px-4 py-12">
        
        {/* Visual Hero Section */}
        <div className="mb-16 border-l-4 border-neon-green pl-6">
          <h2 className="text-xs font-mono text-neon-green mb-2 uppercase tracking-[0.3em]">
            Delaware HQ // Neural Stream
          </h2>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter italic uppercase">
            Global <span className="text-neon-green">Intelligence</span>
          </h1>
          <p className="text-gray-500 mt-4 max-w-xl text-sm font-medium">
            Real-time music market velocity and growth projections for the 2026 fiscal year.
          </p>
        </div>
        
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {metrics.length > 0 ? (
            metrics.map((item) => (
              <Card key={item.id} className="bg-[#111] border-white/5 p-8 rounded-[2rem] shadow-2xl hover:border-white/20 transition-all duration-500 group relative overflow-hidden">
                {/* Background glow effect */}
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-neon-green/5 blur-[50px] group-hover:bg-neon-green/10 transition-all"></div>
                
                <div className="relative z-10 flex flex-col h-full">
                  <p className="text-gray-500 text-xs font-bold mb-6 uppercase tracking-widest border-b border-white/5 pb-4">
                    {item.region}
                  </p>
                  
                  <div className="flex items-baseline gap-2 mb-6">
                    <p className={`text-6xl font-black tracking-tighter ${getRegionColor(item.region)}`}>
                      {item.growth_projection}%
                    </p>
                    <span className="text-gray-600 font-mono text-sm">VELOCITY</span>
                  </div>

                  <div className="mt-auto bg-white/5 p-4 rounded-xl border border-white/5">
                    <p className="text-[11px] leading-relaxed text-gray-400 uppercase font-mono italic">
                      {item.analysis_label}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-3 py-20 text-center">
              <div className="inline-block animate-pulse text-neon-green font-mono text-sm tracking-widest">
                > ESTABLISHING SECURE CONNECTION TO SUPABASE...
              </div>
            </div>
          )}
        </div>

        {/* Terminal Status Footer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/[0.02] border border-white/5 p-6 rounded-2xl font-mono text-[10px] uppercase tracking-widest text-gray-500">
          <div>
            <p className="text-neon-green">> NODE: DELAWARE_PRIMARY_RELIANCE</p>
            <p>> STATUS: ENCRYPTED_FEED_ACTIVE</p>
          </div>
          <div className="md:text-right">
            <p>> LATENCY: 24MS</p>
            <p>> SYNC_TIME: {new Date().toLocaleTimeString('en-US')}</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
