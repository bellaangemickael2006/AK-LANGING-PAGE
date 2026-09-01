"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { MotionValue } from "framer-motion";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * Globe filaire (latitudes/longitudes) posé sur un noyau plein légèrement
 * lumineux — reprend le motif du globe du logo AK World, en 3D. Réagit à
 * la position de la souris (tilt doux) et à la progression du scroll dans
 * le hero (rotation supplémentaire), les deux passés en MotionValues pour
 * ne jamais déclencher de re-render React pendant l'animation.
 */
function ReactiveGlobe({
  pointerX,
  pointerY,
  scrollProgress,
}: {
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  scrollProgress: MotionValue<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const currentTiltX = useRef(0);
  const currentTiltY = useRef(0);

  const wireGeometry = useMemo(() => new THREE.SphereGeometry(1.42, 24, 16), []);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const targetTiltY = pointerX.get() * 0.5;
    const targetTiltX = -pointerY.get() * 0.35;
    // Amortissement manuel (lerp) pour un mouvement fluide, indépendant du
    // framerate — évite le côté "collé au curseur" trop brutal.
    currentTiltX.current += (targetTiltX - currentTiltX.current) * Math.min(delta * 4, 1);
    currentTiltY.current += (targetTiltY - currentTiltY.current) * Math.min(delta * 4, 1);

    group.rotation.x = currentTiltX.current;
    group.rotation.y = currentTiltY.current + scrollProgress.get() * Math.PI * 0.6;
    group.rotation.z += delta * 0.05;
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[1.32, 32, 32]} />
        <meshStandardMaterial
          color="#101c47"
          emissive="#2451ff"
          emissiveIntensity={0.55}
          metalness={0.6}
          roughness={0.35}
        />
      </mesh>
      <lineSegments>
        <wireframeGeometry args={[wireGeometry]} />
        <lineBasicMaterial color="#f5f7fb" transparent opacity={0.45} />
      </lineSegments>
    </group>
  );
}

export default function Hero3DScene({
  pointerX,
  pointerY,
  scrollProgress,
}: {
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  scrollProgress: MotionValue<number>;
}) {
  return (
    <Canvas camera={{ position: [0, 0, 4.4], fov: 42 }} gl={{ alpha: true, antialias: true }} dpr={[1, 1.5]}>
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 3, 4]} intensity={1.2} color="#ffffff" />
      <directionalLight position={[-3, -2, -2]} intensity={0.5} color="#4f74ff" />
      <ReactiveGlobe pointerX={pointerX} pointerY={pointerY} scrollProgress={scrollProgress} />
    </Canvas>
  );
}
