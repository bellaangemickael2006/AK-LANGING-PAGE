"use client";

import Image from "next/image";
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";

const LINKS = [
  { href: "#actualites", label: "Actualités" },
  { href: "#formations", label: "Formations" },
  { href: "#ressources", label: "Ressources" },
  { href: "#contact", label: "Contact" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 12);
  });

  return (
    <header
      className={`transition-colors duration-300 ${
        scrolled ? "border-b border-ak-line/8 bg-ak-black/80 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-8">
        <a href="#top" className="flex items-center gap-2.5">
          <Image
            src="/logo_ak_world.png"
            alt="AK World Business Services"
            width={36}
            height={36}
            className="h-9 w-9 rounded-md"
          />
          <span className="hidden text-sm font-semibold tracking-wide text-ak-white sm:block">
            AK World Business Services
          </span>
        </a>

        <nav className="hidden items-center gap-1 md:flex" onMouseLeave={() => setHovered(null)}>
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onMouseEnter={() => setHovered(link.href)}
              className="relative rounded-full px-3 py-1.5 text-sm font-medium text-ak-silver transition-colors hover:text-ak-white"
            >
              {hovered === link.href && (
                <motion.span
                  layoutId="nav-hover-pill"
                  className="absolute inset-0 rounded-full bg-ak-line/8"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative">{link.label}</span>
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Ouvrir le menu"
            aria-expanded={menuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ak-line/10 text-ak-white md:hidden"
          >
            <span aria-hidden>{menuOpen ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-ak-line/8 bg-ak-black/95 backdrop-blur-md md:hidden"
          >
            <div className="flex flex-col gap-1 px-5 py-3">
              {LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-ak-silver hover:bg-ak-line/5 hover:text-ak-white"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-2 flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-ak-silver">
                <ThemeToggle />
                Apparence
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
