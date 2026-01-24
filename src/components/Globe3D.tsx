import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Html } from '@react-three/drei';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useMetricsMarkers, MetricsMarker } from '@/hooks/useMetricsData';

// Fallback markers when no data is available
const fallbackMarkers: MetricsMarker[] = [
  { name: 'Glastonbury', lat: 51.15, lng: -2.58, streams: '2.1M' },
  { name: 'Coachella', lat: 33.68, lng: -116.24, streams: '1.8M' },
  { name: 'Tomorrowland', lat: 51.09, lng: 4.38, streams: '1.5M' },
  { name: 'Rock in Rio', lat: -22.97, lng: -43.40, streams: '1.2M' },
  { name: 'Fuji Rock', lat: 36.93, lng: 138.86, streams: '890K' },
];

function latLngToVector3(lat: number, lng: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function GlobeMarker({ lat, lng, name, streams }: { lat: number; lng: number; name: string; streams: string }) {
  const position = latLngToVector3(lat, lng, 1.02);
  
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshBasicMaterial color="#44aaa9" />
      </mesh>
      <Html distanceFactor={3} style={{ pointerEvents: 'none' }}>
        <div className="bg-card/90 backdrop-blur-sm border border-primary/30 rounded-lg px-2 py-1 text-xs whitespace-nowrap shadow-lg">
          <div className="font-semibold text-foreground">{name}</div>
          <div className="text-primary text-[10px]">{streams} streams</div>
        </div>
      </Html>
    </group>
  );
}

function AnimatedGlobe({ markers }: { markers: MetricsMarker[] }) {
  const globeRef = useRef<THREE.Group>(null);
  const wireframeRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (globeRef.current) {
      globeRef.current.rotation.y = clock.getElapsedTime() * 0.1;
    }
  });

  const wireframeMaterial = useMemo(() => 
    new THREE.MeshBasicMaterial({
      color: '#44aaa9',
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    }), []
  );

  const solidMaterial = useMemo(() => 
    new THREE.MeshPhongMaterial({
      color: '#0a0a0a',
      transparent: true,
      opacity: 0.95,
    }), []
  );

  return (
    <group ref={globeRef}>
      {/* Solid dark sphere */}
      <Sphere args={[0.98, 64, 64]}>
        <primitive object={solidMaterial} attach="material" />
      </Sphere>
      
      {/* Wireframe overlay */}
      <Sphere args={[1, 32, 32]} ref={wireframeRef}>
        <primitive object={wireframeMaterial} attach="material" />
      </Sphere>
      
      {/* Markers */}
      {markers.map((marker) => (
        <GlobeMarker key={marker.name} {...marker} />
      ))}
      
      {/* Glow effect */}
      <Sphere args={[1.1, 32, 32]}>
        <meshBasicMaterial 
          color="#44aaa9" 
          transparent 
          opacity={0.05} 
          side={THREE.BackSide}
        />
      </Sphere>
    </group>
  );
}

export default function Globe3D() {
  const { data: markers, isLoading } = useMetricsMarkers();
  
  // Use real data if available, otherwise fall back to demo markers
  const displayMarkers = markers && markers.length > 0 ? markers : fallbackMarkers;

  return (
    <div 
      className="w-full h-[350px] md:h-[450px] relative flex items-center justify-center"
      style={{ overflow: 'visible' }}
    >
      <Canvas
        camera={{ position: [0, 0, 3.2], fov: 35 }}
        style={{ 
          background: 'transparent',
          overflow: 'visible',
        }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#44aaa9" />
        <AnimatedGlobe markers={displayMarkers} />
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          autoRotate={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>
    </div>
  );
}
