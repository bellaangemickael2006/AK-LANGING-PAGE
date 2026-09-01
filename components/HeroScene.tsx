"use client";

import { useMotionValue, useScroll } from "framer-motion";
import dynamic from "next/dynamic";
import { RefObject, Suspense, useEffect, useState } from "react";

const Hero3DScene = dynamic(() => import("./Hero3DScene"), { ssr: false });

interface NetworkInformation {
  saveData?: boolean;
}

function useCanRender3D(): boolean | null {
  const [canRender, setCanRender] = useState<boolean | null>(null);

  useEffect(() => {
    // La largeur d'écran n'est plus utilisée comme critère : elle ne reflète
    // pas la capacité GPU réelle (beaucoup de téléphones récents à écran
    // étroit gèrent très bien cette scène 3D légère) — on se fie plutôt aux
    // signaux qui comptent vraiment : préférence d'accessibilité, nombre de
    // cœurs CPU et économie de données.
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lowCores = typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 2;
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    const saveData = connection?.saveData === true;
    setCanRender(!reducedMotion && !lowCores && !saveData);
  }, []);

  return canRender;
}

/**
 * Halo statique utilisé tant qu'on ne sait pas si le 3D peut tourner
 * (premier rendu) et en repli définitif sur mobile bas de gamme /
 * prefers-reduced-motion / économie de données.
 */
function StaticFallback() {
  return (
    <div
      aria-hidden
      className="h-full w-full rounded-full opacity-70 blur-[2px]"
      style={{
        background:
          "radial-gradient(circle at 35% 30%, rgba(79,116,255,0.9), rgba(16,28,71,0.35) 55%, transparent 75%)",
      }}
    />
  );
}

export function HeroScene({ heroRef }: { heroRef: RefObject<HTMLElement | null> }) {
  const canRender = useCanRender3D();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });

  useEffect(() => {
    if (!canRender) return;
    function handlePointerMove(e: PointerEvent) {
      pointerX.set((e.clientX / window.innerWidth) * 2 - 1);
      pointerY.set((e.clientY / window.innerHeight) * 2 - 1);
    }
    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [canRender, pointerX, pointerY]);

  return (
    <div className="pointer-events-none mx-auto h-40 w-40 sm:h-48 sm:w-48" aria-hidden>
      {canRender ? (
        <Suspense fallback={<StaticFallback />}>
          <Hero3DScene pointerX={pointerX} pointerY={pointerY} scrollProgress={scrollYProgress} />
        </Suspense>
      ) : (
        <StaticFallback />
      )}
    </div>
  );
}
