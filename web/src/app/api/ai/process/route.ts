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

  try {
    // On extrait d'abord les infos (type de vin compris) pour pouvoir garantir que la
    // photo générée montre la bonne couleur de liquide (ex: pas de bouteille "vide" à
    // l'air d'un blanc alors que c'est un rouge).
    const extracted = await extractLabelInfo(front, back);
    const generatedImageBase64 = await generateBottleImage(front, back, extracted.type_vin);

    return NextResponse.json({ extracted, generatedImageBase64 });
  } catch (error) {
    console.error("Erreur traitement IA:", error);
    return NextResponse.json({ error: "Le traitement IA a échoué" }, { status: 502 });
  }
}
