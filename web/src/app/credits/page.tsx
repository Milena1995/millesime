import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CREDIT_PACKS } from "@/lib/creditPacks";
import BuyCreditsButton from "@/components/BuyCreditsButton";

type CreditsPageProps = {
  searchParams: Promise<{ achat?: string }>;
};

export default async function CreditsPage({ searchParams }: CreditsPageProps) {
  const { achat } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits_ia")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between gap-2 border-b border-bordure px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/cave" className="text-sm text-taupe hover:text-encre">
          ← Retour
        </Link>
        <h1 className="font-serif text-xl text-bordeaux sm:text-2xl">Crédits IA</h1>
        <span className="w-12" />
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6">
        {achat === "succes" && (
          <p className="mb-6 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
            Paiement reçu, merci ! Tes crédits arrivent en général en quelques secondes.
          </p>
        )}
        {achat === "annule" && (
          <p className="mb-6 rounded-md bg-carte px-4 py-3 text-sm text-taupe">
            Paiement annulé, aucun montant n&apos;a été débité.
          </p>
        )}

        <p className="mb-6 text-sm text-taupe">
          Solde actuel :{" "}
          <span className="font-medium text-encre">{profile?.credits_ia ?? 0} crédit(s)</span>
        </p>

        <p className="mb-6 text-sm text-taupe">
          Chaque bouteille traitée avec l&apos;IA (analyse de l&apos;étiquette + photo générée)
          consomme 1 crédit. Le mode manuel reste gratuit et illimité.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          {CREDIT_PACKS.map((pack) => (
            <div
              key={pack.id}
              className="flex flex-col items-center gap-2 rounded-lg border border-bordure p-4 text-center"
            >
              <p className="font-serif text-lg text-bordeaux">{pack.label}</p>
              <p className="text-2xl font-medium text-encre">{pack.credits}</p>
              <p className="text-xs text-taupe">crédits IA</p>
              <p className="text-sm text-encre">{(pack.amount / 100).toFixed(2)} €</p>
              <BuyCreditsButton packId={pack.id} />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
