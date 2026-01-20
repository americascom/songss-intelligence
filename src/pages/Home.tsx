import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Home = () => {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loadingStatus, setLoadingStatus] = useState("Establishing secure data link...");

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Fetch all records regardless of starting ID number
        const { data, error } = await supabase
          .from('metrics')
          .select('*')
          .order('id', { ascending: true });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setMetrics(data);
          setLoadingStatus("Live Feed Active");
        } else {
          setLoadingStatus("Data link established. No records returned from metrics table.");
        }
      } catch (err: any) {
        setLoadingStatus(`System Error: ${err.message}`);
      }
    };
    fetchMetrics();
  }, []);

  return (
    <div style={{ backgroundColor: '#0A0A0A', color: 'white', minHeight: '100vh', padding: '60px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: '900', color: '#39FF14', letterSpacing: '-2px', marginBottom: '10px' }}>
          SONGSS GLOBAL HQ
        </h1>
        <p style={{ color: '#444', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '12px', fontWeight: 'bold', marginBottom: '60px' }}>
          {loadingStatus}
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
          {metrics.map((item) => (
            <div key={item.id} style={{ border: '1px solid #1a1a1a', padding: '40px', borderRadius: '24px', background: '#0f0f0f' }}>
              <p style={{ color: '#555', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '20px' }}>{item.region}</p>
              <h2 style={{ fontSize: '4.5rem', margin: '0', color: item.region.toLowerCase().includes('brazil') ? '#FFD700' : '#39FF14', fontWeight: '900' }}>
                {item.growth_projection}%
              </h2>
              <p style={{ fontSize: '13px', color: '#888', marginTop: '20px' }}>{item.analysis_label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
