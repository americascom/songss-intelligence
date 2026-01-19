import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [metrics, setMetrics] = useState<any[]>([]);

  useEffect(() => {
    const fetchMetrics = async () => {
      const { data, error } = await supabase.from('metrics').select('*').order('id', { ascending: true });
      if (error) console.error("Error:", error);
      else setMetrics(data);
    };
    fetchMetrics();
  }, []);

  return (
    <div style={{ backgroundColor: '#0A0A0A', color: 'white', minHeight: '100vh', padding: '40px', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '3rem', fontWeight: '900', color: '#39FF14' }}>GLOBAL INTELLIGENCE</h1>
      <p style={{ color: '#666', marginBottom: '40px' }}>Real-time Delaware Database Stream</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        {metrics.map((item) => (
          <div key={item.id} style={{ border: '1px solid #333', padding: '30px', borderRadius: '20px', background: '#111' }}>
            <p style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase' }}>{item.region}</p>
            <h2 style={{ fontSize: '3.5rem', margin: '10px 0', color: item.region.includes('Brazil') ? '#FFD700' : item.region.includes('Kingdom') ? '#00BFFF' : '#39FF14' }}>
              {item.growth_projection}%
            </h2>
            <p style={{ fontSize: '11px', color: '#555', fontStyle: 'italic' }}>{item.analysis_label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Index;
