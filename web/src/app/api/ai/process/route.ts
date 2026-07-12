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
  if (!front || !back) {
    return NextResponse.json({ error: "Photos face et dos requises" }, { status: 400 });
  }

  try {
    const [extracted, generatedImageBase64] = await Promise.all([
      extractLabelInfo(front, back),
      generateBottleImage(front, back),
    ]);

    return NextResponse.json({ extracted, generatedImageBase64 });
  } catch (error) {
    console.error("Erreur traitement IA:", error);
    return NextResponse.json({ error: "Le traitement IA a échoué" }, { status: 502 });
  }
}
