import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generatePairingSuggestions } from "@/lib/gemini";
import type { WineType } from "@/lib/types";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await request.json();
  const {
    nom,
    type_vin,
    region,
    millesime,
    cepage,
    prix,
    note,
    notes,
    quantite,
    generatedImageBase64,
    viaAI,
  }: {
    nom: string;
    type_vin: WineType;
    region: string;
    millesime: string;
    cepage: string;
    prix: number | null;
    note: number;
    notes: string | null;
    quantite: number;
    generatedImageBase64: string;
    /** true si la bouteille vient du flux IA (photo générée + accords auto), false en
     * mode manuel (photo perso, pas d'appel Gemini supplémentaire). */
    viaAI?: boolean;
  } = body;

  if (!nom || !type_vin || !generatedImageBase64) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }

  const path = `${user.id}/${randomUUID()}.jpg`;
  const { error: uploadError } = await supabase.storage
    .from("bottle-images")
    .upload(path, Buffer.from(generatedImageBase64, "base64"), {
      contentType: "image/jpeg",
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("bottle-images").getPublicUrl(path);

  // En mode manuel (sans IA), on ne fait aucun appel Gemini supplémentaire : pas
  // d'accords mets-vins automatiques (pas de coût, pas de crédit consommé).
  const accords_mets_vins = viaAI
    ? await generatePairingSuggestions(type_vin, cepage, region).catch(() => [])
    : [];

  const { data: bottle, error: insertError } = await supabase
    .from("bottles")
    .insert({
      user_id: user.id,
      nom,
      type_vin,
      region,
      millesime,
      cepage,
      prix,
      note,
      notes,
      quantite: quantite && quantite >= 1 ? quantite : 1,
      accords_mets_vins,
      image_url: publicUrl,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ bottle });
}
