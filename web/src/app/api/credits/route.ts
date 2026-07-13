import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Renvoie le solde de crédits IA de l'utilisatrice connectée (voir migration 0002). */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("credits_ia")
    .eq("id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ credits_ia: data.credits_ia });
}
