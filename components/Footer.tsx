import Image from "next/image";

export function Footer() {
  return (
    <footer id="contact" className="border-t border-ak-line/8 bg-ak-charcoal">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <Image
                src="/logo_ak_world.png"
                alt="AK World Business Services"
                width={36}
                height={36}
                className="h-9 w-9 rounded-md"
              />
              <p className="text-lg font-semibold text-ak-white">AK World Business Services</p>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-ak-silver">
              Cabinet de conseil en gestion — accompagnement des TPE/PME, formation
              professionnelle et entrepreneuriat des jeunes.
            </p>
          </div>
          <div className="text-sm text-ak-silver">
            <p className="font-medium text-ak-white">Adresse</p>
            <p className="mt-1">Angré Pétro-Ivoire Star 2</p>
            <p>Abidjan, Côte d&rsquo;Ivoire</p>
          </div>
        </div>
        <div className="mt-10 border-t border-ak-line/8 pt-6 text-xs text-ak-silver-dim">
          © {new Date().getFullYear()} AK World Business Services. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
