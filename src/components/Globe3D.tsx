import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Html } from '@react-three/drei';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useMetricsMarkers, MetricsMarker } from '@/hooks/useMetricsData';

// Fallback markers positioned for optimal visibility on load (London, New York, Brazil)
const fallbackMarkers: MetricsMarker[] = [
  { name: 'London', lat: 51.51, lng: -0.13, streams: '2.4M' },
  { name: 'New York', lat: 40.71, lng: -74.01, streams: '3.1M' },
  { name: 'São Paulo', lat: -23.55, lng: -46.63, streams: '1.8M' },
  { name: 'Los Angeles', lat: 34.05, lng: -118.24, streams: '2.2M' },
  { name: 'Tokyo', lat: 35.68, lng: 139.69, streams: '1.5M' },
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
      className="w-full h-[320px] sm:h-[380px] md:h-[420px] lg:h-[450px] relative flex items-center justify-center mx-auto"
      style={{ overflow: 'visible', maxWidth: '100%' }}
    >
      <Canvas
        camera={{ 
          position: [-1.5, 0.8, 2.8], 
          fov: 38 
        }}
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
