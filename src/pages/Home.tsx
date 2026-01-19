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
      
      if (error) console.error("Database Error:", error);
      else setMetrics(data);
    };
    fetchMetrics();
  }, []);

  const getRegionStyle = (region: string) => {
    const r = region.toLowerCase();
    if (r.includes("states")) return { color: "#39FF14", shadow: "0 0 20px rgba(57, 255, 20, 0.3)" };
    if (r.includes("kingdom") || r.includes("uk")) return { color: "#00BFFF", shadow: "0 0 20px rgba(0, 191, 255, 0.3)" };
    if (r.includes("brazil")) return { color: "#FFD700", shadow: "0 0 20px rgba(255, 215, 0, 0.3)" };
    return { color: "#FFFFFF", shadow: "none" };
  };

  return (
    <div style={{ backgroundColor: '#0A0A0A', color: 'white', minHeight: '100vh', padding: '60px 20px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ borderLeft: '4px solid #39FF14', paddingLeft: '25px', marginBottom: '80px' }}>
          <h2 style={{ fontSize: '12px', color: '#39FF14', letterSpacing: '5px', textTransform: 'uppercase', marginBottom: '10px' }}>
            Delaware HQ // Live Data
          </h2>
          <h1 style={{ fontSize: 'clamp(2.5rem, 10vw, 5rem)', fontWeight: '900', margin: '0', letterSpacing: '-3px', lineHeight: '1' }}>
            SONGSS <span style={{ color: '#39FF14' }}>INTELLIGENCE</span>
          </h1>
          <p style={{ color: '#666', marginTop: '20px', maxWidth: '600px', fontSize: '1.1rem', lineHeight: '1.6' }}>
            Real-time market velocity analysis for the 2026 fiscal year.
          </p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
          {metrics.length > 0 ? metrics.map((item) => {
            const style = getRegionStyle(item.region);
            return (
              <div key={item.id} style={{ background: '#111', border: '1px solid #1a1a1a', padding: '50px 40px', borderRadius: '40px' }}>
                <p style={{ color: '#555', fontSize: '13px', fontWeight: 'bold', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '30px' }}>
                  {item.region}
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                  <h2 style={{ fontSize: '5rem', fontWeight: '900', color: style.color, margin: '0', textShadow: style.shadow }}>
                    {item.growth_projection}%
                  </h2>
                </div>
                <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #1a1a1a' }}>
                  <p style={{ color: '#888', fontSize: '12px', lineHeight: '1.6', fontStyle: 'italic' }}>
                    {item.analysis_label}
                  </p>
                </div>
              </div>
            );
          }) : <p style={{color: '#333'}}>Loading encrypted stream...</p>}
        </div>

        <div style={{ marginTop: '100px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #111', paddingTop: '20px', fontSize: '10px', color: '#333', fontFamily: 'monospace' }}>
          <span>> DELAWARE_PRIMARY_FEED</span>
          <span>> {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};

export default Home;
