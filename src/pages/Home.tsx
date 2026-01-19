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
      
      if (error) console.error("Fetch error:", error);
      else setMetrics(data);
    };
    fetchMetrics();
  }, []);

  const getRegionColor = (region: string) => {
    const r = region.toLowerCase();
    if (r.includes("states")) return "#39FF14"; // Neon Green
    if (r.includes("kingdom") || r.includes("uk")) return "#00BFFF"; // Deep Sky Blue
    if (r.includes("brazil")) return "#FFD700"; // Gold
    return "#FFFFFF";
  };

  return (
    <div style={{ backgroundColor: '#0A0A0A', color: 'white', minHeight: '100vh', padding: '40px', fontFamily: 'sans-serif' }}>
      <div style={{ borderLeft: '4px solid #39FF14', paddingLeft: '20px', marginBottom: '60px' }}>
        <h2 style={{ fontSize: '12px', color: '#39FF14', letterSpacing: '4px', textTransform: 'uppercase' }}>
          Delaware HQ // Neural Stream
        </h2>
        <h1 style={{ fontSize: 'clamp(2rem, 8vw, 4rem)', fontWeight: '900', margin: '10px 0', letterSpacing: '-2px' }}>
          GLOBAL <span style={{ color: '#39FF14' }}>INTELLIGENCE</span>
        </h1>
        <p style={{ color: '#666', maxWidth: '500px' }}>Real-time music market velocity and growth projections for the 2026 fiscal year.</p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
        {metrics.map((item) => (
          <div key={item.id} style={{ background: '#111', border: '1px solid #222', padding: '40px', borderRadius: '30px', position: 'relative', overflow: 'hidden' }}>
            <p style={{ color: '#555', fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '20px' }}>{item.region}</p>
            <h2 style={{ fontSize: '4rem', fontWeight: '900', color: getRegionColor(item.region), margin: '0' }}>
              {item.growth_projection}%
            </h2>
            <p style={{ color: '#444', fontSize: '11px', marginTop: '20px', fontStyle: 'italic', borderTop: '1px solid #222', paddingTop: '15px' }}>
              {item.analysis_label}
            </p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '60px', padding: '20px', border: '1px solid #1a1a1a', borderRadius: '10px', fontSize: '10px', color: '#333', fontFamily: 'monospace' }}>
        > NODE: DELAWARE_PRIMARY_RELIANCE | STATUS: ENCRYPTED_FEED_ACTIVE | SYNC: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default Home;
