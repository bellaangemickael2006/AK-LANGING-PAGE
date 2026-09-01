"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function RotatingObject() {
  const groupRef = useRef<THREE.Group>(null);
  const edgesGeometry = useMemo(() => new THREE.IcosahedronGeometry(1.5, 0), []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.x += delta * 0.14;
    groupRef.current.rotation.y += delta * 0.22;
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <icosahedronGeometry args={[1.4, 0]} />
        <meshStandardMaterial
          color="#2451ff"
          emissive="#101c47"
          emissiveIntensity={0.7}
          metalness={0.45}
          roughness={0.25}
        />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[edgesGeometry]} />
        <lineBasicMaterial color="#f5f7fb" transparent opacity={0.4} />
      </lineSegments>
    </group>
  );
}

/**
 * Scène 3D signature du hero : un icosaèdre abstrait bleu royal, cerclé
 * d'un fil blanc, qui tourne lentement — cohérent avec l'identité du logo.
 * Rendue uniquement côté client (voir HeroScene.tsx) et jamais sur mobile
 * bas de gamme / prefers-reduced-motion.
 */
export default function Hero3DScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 4.4], fov: 42 }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 1.5]}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 3, 4]} intensity={1.2} color="#ffffff" />
      <directionalLight position={[-3, -2, -2]} intensity={0.5} color="#4f74ff" />
      <RotatingObject />
    </Canvas>
  );
}
