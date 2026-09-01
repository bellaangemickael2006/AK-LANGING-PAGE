"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useState } from "react";

const Hero3DScene = dynamic(() => import("./Hero3DScene"), { ssr: false });

interface NetworkInformation {
  saveData?: boolean;
}

function useCanRender3D(): boolean | null {
  const [canRender, setCanRender] = useState<boolean | null>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isNarrow = window.innerWidth < 640;
    const lowCores = typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 2;
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    const saveData = connection?.saveData === true;
    setCanRender(!reducedMotion && !isNarrow && !lowCores && !saveData);
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

export function HeroScene() {
  const canRender = useCanRender3D();

  return (
    <div className="pointer-events-none mx-auto h-40 w-40 sm:h-48 sm:w-48" aria-hidden>
      {canRender ? (
        <Suspense fallback={<StaticFallback />}>
          <Hero3DScene />
        </Suspense>
      ) : (
        <StaticFallback />
      )}
    </div>
  );
}
