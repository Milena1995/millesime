"use client";

import { useState } from "react";

export default function BuyCreditsButton({ packId }: { packId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        setError(data.error ?? "Impossible de démarrer le paiement");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Impossible de démarrer le paiement");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className="rounded-md bg-bordeaux px-4 py-2 text-sm font-medium text-ivoire hover:bg-bordeaux-dark disabled:opacity-60"
      >
        {loading ? "Redirection..." : "Acheter"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
