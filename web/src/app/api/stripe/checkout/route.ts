import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { getCreditPack } from "@/lib/creditPacks";

/** Crée une session Stripe Checkout pour l'achat d'un pack de crédits IA.
 * Le crédit réel du compte se fait dans le webhook, une fois le paiement confirmé
 * (jamais ici : on ne fait pas confiance à un simple appel réussi de cette route). */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { packId } = await request.json();
  const pack = getCreditPack(packId);
  if (!pack) {
    return NextResponse.json({ error: "Pack de crédits inconnu" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: pack.amount,
            product_data: {
              name: `${pack.credits} crédits IA — Millésime`,
              description: "Crédits pour l'analyse et la génération de photo par IA.",
            },
          },
          quantity: 1,
        },
      ],
      customer_email: user.email ?? undefined,
      metadata: {
        user_id: user.id,
        credits: String(pack.credits),
      },
      success_url: `${appUrl}/credits?achat=succes`,
      cancel_url: `${appUrl}/credits?achat=annule`,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Session de paiement invalide" }, { status: 502 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Erreur création session Stripe:", error);
    return NextResponse.json({ error: "Impossible de démarrer le paiement" }, { status: 502 });
  }
}
