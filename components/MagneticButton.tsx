"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { ReactNode, useRef } from "react";

const MotionButton = motion.button;
const MotionAnchor = motion.a;

/**
 * Le bouton suit légèrement le curseur dans sa zone (effet "magnétique"),
 * et revient au centre avec un ressort à la sortie. Désactivé de fait sous
 * prefers-reduced-motion via le CSS global (transitions/animations coupées).
 */
export function MagneticButton({
  as = "button",
  className,
  children,
  strength = 0.35,
  href,
  onClick,
  type,
}: {
  as?: "button" | "a";
  className?: string;
  children: ReactNode;
  strength?: number;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  const ref = useRef<HTMLButtonElement & HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 260, damping: 18, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 260, damping: 18, mass: 0.4 });

  function handleMouseMove(e: React.MouseEvent) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left - rect.width / 2) * strength);
    y.set((e.clientY - rect.top - rect.height / 2) * strength);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  const sharedProps = {
    ref,
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
    style: { x: springX, y: springY },
    whileTap: { scale: 0.94 },
    className,
    onClick,
  };

  if (as === "a") {
    return (
      <MotionAnchor href={href} {...sharedProps}>
        {children}
      </MotionAnchor>
    );
  }

  return (
    <MotionButton type={type} {...sharedProps}>
      {children}
    </MotionButton>
  );
}
