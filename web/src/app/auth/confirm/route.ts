import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/cave";

  const supabase = await createClient();

  // Template email par défaut de Supabase (sans SMTP perso) : passe par son endpoint
  // hébergé, qui redirige ici avec un "code" PKCE à échanger contre une session.
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      redirect(next);
    }
  }

  // Template email personnalisé (lien direct vers /auth/confirm?token_hash=...&type=...).
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      redirect(next);
    }
  }

  return NextResponse.redirect(new URL("/login?erreur=lien_invalide", request.url));
}
