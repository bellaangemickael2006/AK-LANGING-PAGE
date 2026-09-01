"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ReactNode, useRef } from "react";

/**
 * Léger tilt 3D au survol, piloté par la position de la souris dans la
 * carte. Reste immobile sur tactile (pas de mousemove) et respecte
 * prefers-reduced-motion via le CSS global (transitions désactivées).
 */
export function TiltCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [7, -7]), {
    stiffness: 220,
    damping: 22,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-7, 7]), {
    stiffness: 220,
    damping: 22,
  });
  const glowX = useTransform(x, [-0.5, 0.5], [0, 100]);
  const glowY = useTransform(y, [-0.5, 0.5], [0, 100]);

  // Ombre portée qui accompagne le tilt (indépendante du box-shadow statique
  // de la carte via filter: drop-shadow, donc les deux se cumulent sans
  // s'écraser l'un l'autre).
  const shadowX = useSpring(useTransform(x, [-0.5, 0.5], [-16, 16]), { stiffness: 220, damping: 24 });
  const shadowY = useSpring(useTransform(y, [-0.5, 0.5], [-4, 20]), { stiffness: 220, damping: 24 });
  const dynamicShadow = useTransform(
    [shadowX, shadowY],
    ([sx, sy]) => `drop-shadow(${sx}px ${sy}px 22px rgba(0,0,0,0.35))`
  );

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 900, filter: dynamicShadow }}
      className={`relative ${className ?? ""}`}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: useTransform(
            [glowX, glowY],
            ([gx, gy]) =>
              `radial-gradient(320px circle at ${gx}% ${gy}%, rgba(79,116,255,0.16), transparent 65%)`
          ),
        }}
      />
      {children}
    </motion.div>
  );
}
