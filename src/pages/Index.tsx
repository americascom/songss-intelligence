import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import Header from "@/components/Header"; // Mantendo o cabeçalho original

const Index = () => {
  const [metrics, setMetrics] = useState<any[]>([]);

  useEffect(() => {
    const fetchMetrics = async () => {
      const { data, error } = await supabase
        .from('metrics')
        .select('*')
        .order('id', { ascending: true }); // Garante a ordem USA, UK, Brazil
      
      if (error) {
        console.error("Erro ao buscar dados:", error);
      } else {
        setMetrics(data);
      }
    };

    fetchMetrics();
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      {/* 1. Cabeçalho Original */}
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-12">
        {/* 2. Título Profissional */}
        <div className="mb-12">
          <h2 className="text-sm font-mono text-neon-green mb-2 uppercase tracking-widest">
            Real-Time Analysis
          </h2>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
            GLOBAL <span className="text-neon-green">INTELLIGENCE</span>
          </h1>
        </div>
        
        {/* 3. Seus Dados Reais do Supabase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {metrics.map((item) => (
            <Card key={item.id} className="bg-white/5 border-white/10 p-8 rounded-3xl backdrop-blur-sm hover:border-neon-green/50 transition-all duration-500 group">
              <div className="flex flex-col h-full">
                <p className="text-gray-400 text-sm font-medium mb-4 uppercase tracking-wider">
                  {item.region}
                </p>
                <p className="text-5xl font-bold text-white mb-6 group-hover:text-neon-green transition-colors">
                  {item.growth_projection}%
                </p>
                <div className="mt-auto">
                  <p className="text-xs leading-relaxed text-gray-500 italic">
                    {item.analysis_label}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* 4. Terminal de Status */}
        <div className="bg-black/50 border border-neon-green/20 p-4 rounded-lg font-mono text-xs text-neon-green/70">
          <p>> DATABASE_CONNECTION: STABLE</p>
          <p>> LOCATION: DELAWARE_HQ_SERVER_01</p>
          <p>> LAST_UPDATE: {new Date().toLocaleTimeString()}</p>
        </div>
      </main>
    </div>
  );
};

export default Index;
