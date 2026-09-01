"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

/**
 * Ambiance de fond continue pour une section : deux halos qui respirent
 * doucement et se déplacent à des vitesses différentes au scroll (parallax
 * léger à 2 plans), pour une sensation de profondeur sans canvas lourd.
 */
export function SectionAmbient() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const yBack = useTransform(scrollYProgress, [0, 1], [-50, 50]);
  const yFront = useTransform(scrollYProgress, [0, 1], [30, -30]);

  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        style={{ y: yBack, background: "var(--ak-blue)" }}
        className="absolute -left-24 top-0 h-80 w-80 rounded-full blur-[110px]"
        animate={{ opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        style={{ y: yFront, background: "var(--ak-gold)" }}
        className="absolute -right-16 bottom-0 h-64 w-64 rounded-full blur-[100px]"
        animate={{ opacity: [0.06, 0.14, 0.06] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      />
    </div>
  );
}
