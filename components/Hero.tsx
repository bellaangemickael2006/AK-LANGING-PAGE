"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export function Hero() {
  return (
    <section id="top" className="ak-grain relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-16 h-[420px] w-[420px] -translate-x-1/2 rounded-full blur-[110px]"
        style={{ background: "var(--ak-blue)" }}
        animate={{ opacity: [0.18, 0.32, 0.18], scale: [1, 1.08, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full blur-[100px]"
        style={{ background: "var(--ak-gold)" }}
        animate={{ opacity: [0.08, 0.16, 0.08] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <div className="relative mx-auto flex max-w-4xl flex-col items-center px-5 text-center sm:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <Image
            src="/logo_ak_world.png"
            alt="AK World Business Services"
            width={88}
            height={88}
            priority
            className="h-[88px] w-[88px] rounded-2xl shadow-[0_20px_60px_-15px_rgba(36,81,255,0.5)]"
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="font-accent mt-6 text-sm italic tracking-wide text-ak-silver"
        >
          Conseil en gestion · Formation professionnelle · Abidjan
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mt-4 text-3xl font-extrabold leading-tight text-ak-white sm:text-5xl"
        >
          Le cabinet qui accompagne les entrepreneurs d&rsquo;Abidjan,{" "}
          <span className="text-ak-blue-bright">au quotidien</span>.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="mt-5 max-w-xl text-base leading-relaxed text-ak-silver"
        >
          Plus de 10 ans à accompagner TPE, PME, associations et coopératives : gestion,
          comptabilité, formation professionnelle et insertion des jeunes entrepreneurs.
          Retrouvez ici les actualités, formations et ressources du cabinet.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.6 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <motion.a
            href="#actualites"
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.03 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="relative overflow-hidden rounded-full bg-ak-blue px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_30px_-8px_rgba(36,81,255,0.6)] transition-colors hover:bg-ak-blue-bright"
          >
            Voir les actualités
          </motion.a>
          <motion.a
            href="#formations"
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.03 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="rounded-full border border-ak-line/15 px-6 py-3 text-sm font-semibold text-ak-white transition-colors hover:border-ak-blue/50 hover:bg-ak-line/5"
          >
            Découvrir les formations
          </motion.a>
        </motion.div>

        <motion.dl
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-14 grid w-full max-w-lg grid-cols-3 gap-4 border-t border-ak-line/8 pt-8"
        >
          {[
            { value: "+10 ans", label: "d'accompagnement" },
            { value: "TPE · PME", label: "coopératives, associations" },
            { value: "3 volets", label: "conseil, formation, insertion" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <dt className="font-accent text-lg italic text-ak-blue-bright sm:text-xl">{stat.value}</dt>
              <dd className="mt-1 text-xs leading-snug text-ak-silver-dim">{stat.label}</dd>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}
