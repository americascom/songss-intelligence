import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Home = () => {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [status, setStatus] = useState("Initializing secure link...");

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const { data, error } = await supabase
          .from('metrics')
          .select('*')
          .order('id', { ascending: true });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setMetrics(data);
          setStatus("Feed Active");
        } else {
          setStatus("No data records found in metrics table.");
        }
      } catch (err: any) {
        console.error("Connection Error:", err.message);
        setStatus(`Connection Error: ${err.message}`);
      }
    };
    fetchMetrics();
  }, []);

  return (
    <div style={{ backgroundColor: '#0A0A0A', color: 'white', minHeight: '100vh', padding: '40px', fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ fontSize: '3rem', fontWeight: '900', color: '#39FF14', letterSpacing: '-1px' }}>SONGSS GLOBAL HQ</h1>
      <p style={{ color: '#666', marginBottom: '40px', fontSize: '14px', textTransform: 'uppercase' }}>{status}</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        {metrics.map((item) => (
          <div key={item.id} style={{ border: '1px solid #222', padding: '32px', borderRadius: '16px', background: 'linear-gradient(145deg, #111, #000)' }}>
            <p style={{ color: '#888', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>{item.region}</p>
            <h2 style={{ fontSize: '4rem', margin: '16px 0', color: item.region.toLowerCase().includes('brazil') ? '#FFD700' : '#39FF14', fontWeight: '800' }}>
              {item.growth_projection}%
            </h2>
            <p style={{ fontSize: '12px', color: '#555', lineHeight: '1.4' }}>{item.analysis_label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
