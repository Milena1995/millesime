import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/** Reçoit les événements Stripe (checkout.session.completed) et crédite le compte
 * correspondant. C'est la SEULE source de vérité pour l'ajout de crédits achetés :
 * on ne fait jamais confiance à un simple retour réussi côté client. */
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Signature manquante" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (error) {
    console.error("Signature webhook Stripe invalide:", error);
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const credits = Number(session.metadata?.credits ?? 0);

    if (userId && credits > 0) {
      const supabaseAdmin = createAdminClient();
      const { error } = await supabaseAdmin.rpc("add_ai_credits", {
        p_user_id: userId,
        p_amount: credits,
      });
      if (error) {
        console.error("Erreur ajout crédits après paiement Stripe:", error);
        // On renvoie 500 pour que Stripe retente automatiquement l'envoi de l'événement.
        return NextResponse.json({ error: "Échec du crédit du compte" }, { status: 500 });
      }
    } else {
      console.error("checkout.session.completed sans métadonnées valides:", session.id);
    }
  }

  return NextResponse.json({ received: true });
}
