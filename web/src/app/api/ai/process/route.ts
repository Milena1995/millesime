import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractLabelInfo, generateBottleImage } from "@/lib/gemini";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { front, back } = await request.json();
  if (!front) {
    return NextResponse.json({ error: "Photo de face requise" }, { status: 400 });
  }

  // Consomme 1 crédit IA de façon atomique avant tout appel Gemini (évite de payer un
  // appel qu'on ne pourra pas facturer si le solde est déjà à 0).
  const { data: hasCredit, error: creditError } = await supabase.rpc("consume_ai_credit", {
    p_user_id: user.id,
  });
  if (creditError) {
    console.error("Erreur vérification crédits IA:", creditError);
    return NextResponse.json({ error: "Erreur de vérification des crédits" }, { status: 500 });
  }
  if (!hasCredit) {
    return NextResponse.json(
      {
        error: "Tu as épuisé tes bouteilles gratuites avec IA.",
        code: "NO_CREDITS",
      },
      { status: 402 },
    );
  }

  try {
    // On extrait d'abord les infos (type de vin compris) pour pouvoir garantir que la
    // photo générée montre la bonne couleur de liquide (ex: pas de bouteille "vide" à
    // l'air d'un blanc alors que c'est un rouge).
    const extracted = await extractLabelInfo(front, back);
    const generatedImageBase64 = await generateBottleImage(front, back, extracted.type_vin);

    return NextResponse.json({ extracted, generatedImageBase64 });
  } catch (error) {
    console.error("Erreur traitement IA:", error);
    // Le crédit a été consommé mais le traitement a échoué : on le rembourse pour ne
    // pas pénaliser l'utilisatrice pour une erreur technique.
    try {
      await supabase.rpc("refund_ai_credit", { p_user_id: user.id });
    } catch {
      // Échec silencieux : on préfère renvoyer l'erreur d'origine à l'utilisatrice.
    }
    return NextResponse.json({ error: "Le traitement IA a échoué" }, { status: 502 });
  }
}
