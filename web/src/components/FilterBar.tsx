"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { WineType } from "@/lib/types";

const WINE_TYPES: WineType[] = ["Rouge", "Blanc", "Rosé", "Mousseux", "Autre"];
const NOTES = [1, 2, 3, 4, 5];

type FilterBarProps = {
  millesimes: string[];
};

export default function FilterBar({ millesimes }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const type = searchParams.get("type") ?? "";
  const millesime = searchParams.get("millesime") ?? "";
  const note = searchParams.get("note") ?? "";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/cave?${params.toString()}`);
  }

  function clearFilters() {
    router.push("/cave");
  }

  const hasActiveFilters = Boolean(type || millesime || note);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={type}
        onChange={(e) => updateParam("type", e.target.value)}
        className="rounded-md border border-bordure bg-carte px-3 py-1.5 text-sm text-encre"
      >
        <option value="">Tous les types</option>
        {WINE_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      <select
        value={millesime}
        onChange={(e) => updateParam("millesime", e.target.value)}
        className="rounded-md border border-bordure bg-carte px-3 py-1.5 text-sm text-encre"
      >
        <option value="">Tous les millésimes</option>
        {millesimes.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      <select
        value={note}
        onChange={(e) => updateParam("note", e.target.value)}
        className="rounded-md border border-bordure bg-carte px-3 py-1.5 text-sm text-encre"
      >
        <option value="">Toutes les notes</option>
        {NOTES.map((n) => (
          <option key={n} value={n}>
            {n} étoile{n > 1 ? "s" : ""} et +
          </option>
        ))}
      </select>

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="text-sm text-taupe underline underline-offset-2 hover:text-encre"
        >
          Effacer les filtres
        </button>
      )}
    </div>
  );
}
