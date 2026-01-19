import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

const Index = () => {
  const [metrics, setMetrics] = useState<any[]>([]);

  useEffect(() => {
    // Esta função vai ao seu Supabase buscar os dados da tabela 'metrics'
    const fetchMetrics = async () => {
      const { data, error } = await supabase
        .from('metrics')
        .select('*');
      
      if (error) {
        console.error("Erro ao buscar dados:", error);
      } else {
        setMetrics(data);
      }
    };

    fetchMetrics();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8 dark-grid">
      <h1 className="text-4xl font-bold text-neon-green mb-8">Global Intelligence</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metrics.map((item) => (
          <Card key={item.id} className="bg-white/5 border-white/10 p-6 rounded-2xl">
            <p className="text-gray-400 text-sm mb-2">{item.region}</p>
            <p className="text-3xl font-bold text-white">
              {item.growth_projection}%
            </p>
            <p className="text-xs text-neon-green mt-2">{item.analysis_label}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Index;
