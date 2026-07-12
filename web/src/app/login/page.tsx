"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("mariemilenalaipoon1995@gmail.com");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    });

    if (authError) {
      setStatus("error");
      setError(authError.message);
      return;
    }
    setStatus("sent");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm text-center">
        <h1 className="font-serif text-4xl text-bordeaux">Millésime</h1>
        <p className="mt-2 text-sm text-taupe">Votre cave, toujours à portée de main.</p>

        {status === "sent" ? (
          <p className="mt-8 rounded-md border border-bordure bg-carte p-4 text-sm text-encre">
            Un lien de connexion a été envoyé à <strong>{email}</strong>. Ouvrez-le pour accéder à
            votre cave.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
            <input
              type="email"
              required
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md border border-bordure bg-carte px-4 py-2.5 text-sm text-encre placeholder:text-taupe/70 focus:border-or focus:outline-none"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="rounded-md bg-bordeaux px-4 py-2.5 text-sm font-medium text-ivoire transition-colors hover:bg-bordeaux-dark disabled:opacity-60"
            >
              {status === "sending" ? "Envoi..." : "Recevoir le lien de connexion"}
            </button>
            {status === "error" && <p className="text-sm text-bordeaux">{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
