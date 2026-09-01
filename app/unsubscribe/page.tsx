import Image from "next/image";
import { unsubscribeByToken } from "@/lib/newsletter";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  let message = "Lien de désabonnement invalide.";

  if (token) {
    try {
      const result = await unsubscribeByToken(token);
      if (result === "ok") message = "Vous avez bien été désabonné(e). Vous ne recevrez plus d'emails d'AK World Business Services.";
      else if (result === "already") message = "Vous étiez déjà désabonné(e).";
      else message = "Ce lien de désabonnement n'est plus valide.";
    } catch {
      message = "Une erreur est survenue. Réessayez plus tard.";
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ak-black px-4">
      <div className="w-full max-w-sm rounded-2xl border border-ak-line/10 bg-ak-charcoal p-8 text-center">
        <Image
          src="/logo_ak_world.png"
          alt="AK World Business Services"
          width={56}
          height={56}
          className="mx-auto h-14 w-14 rounded-xl"
        />
        <p className="mt-6 text-sm leading-relaxed text-ak-silver">{message}</p>
      </div>
    </div>
  );
}
