import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Home = () => {
  const [metrics, setMetrics] = useState<any[]>([]);

  useEffect(() => {
    const fetchMetrics = async () => {
      const { data, error } = await supabase
        .from('metrics')
        .select('*')
        .order('id', { ascending: true });
      if (error) console.error(error);
      else setMetrics(data || []);
    };
    fetchMetrics();
  }, []);

  return (
    <div style={{ backgroundColor: '#0A0A0A', color: 'white', minHeight: '100vh', padding: '40px', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '3rem', fontWeight: '900', color: '#39FF14' }}>SONGSS GLOBAL HQ</h1>
      <p style={{ color: '#666', marginBottom: '40px' }}>Live Delaware Feed Active</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {metrics.length > 0 ? metrics.map((item) => (
          <div key={item.id} style={{ border: '1px solid #222', padding: '30px', borderRadius: '20px', background: '#111' }}>
            <p style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase' }}>{item.region}</p>
            <h2 style={{ fontSize: '3.5rem', margin: '10px 0', color: item.region.toLowerCase().includes('brazil') ? '#FFD700' : '#39FF14' }}>
              {item.growth_projection}%
            </h2>
            <p style={{ fontSize: '11px', color: '#444' }}>{item.analysis_label}</p>
          </div>
        )) : <p>Connecting to secure stream...</p>}
      </div>
    </div>
  );
};

export default Home;
