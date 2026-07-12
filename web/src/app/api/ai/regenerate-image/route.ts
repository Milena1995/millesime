import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateBottleImage } from "@/lib/gemini";

/** Régénère uniquement la photo commerciale (sans re-extraire les infos d'étiquette),
 * pour permettre de relancer le rendu depuis l'étape de révision sans perdre les
 * champs déjà édités par l'utilisatrice. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { front, back, type_vin } = await request.json();
  if (!front) {
    return NextResponse.json({ error: "Photo de face requise" }, { status: 400 });
  }

  try {
    const generatedImageBase64 = await generateBottleImage(front, back, type_vin);
    return NextResponse.json({ generatedImageBase64 });
  } catch (error) {
    console.error("Erreur régénération image:", error);
    return NextResponse.json({ error: "La régénération de l'image a échoué" }, { status: 502 });
  }
}
