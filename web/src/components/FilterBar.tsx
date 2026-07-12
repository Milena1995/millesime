"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { WineType } from "@/lib/types";

const WINE_TYPES: WineType[] = ["Rouge", "Blanc", "Rosé", "Mousseux", "Autre"];
const NOTES = [1, 2, 3, 4, 5];

const SELECT_CLASS =
  "w-full min-w-0 appearance-none truncate rounded-full border border-bordure bg-carte py-1.5 pl-3 pr-7 text-xs text-encre focus:border-or focus:outline-none sm:rounded-md sm:py-1.5 sm:pl-3 sm:pr-8 sm:text-sm";

function Chevron() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-taupe"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

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
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <div className="relative min-w-0">
          <select
            value={type}
            onChange={(e) => updateParam("type", e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">Types</option>
            {WINE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <Chevron />
        </div>

        <div className="relative min-w-0">
          <select
            value={millesime}
            onChange={(e) => updateParam("millesime", e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">Millésimes</option>
            {millesimes.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <Chevron />
        </div>

        <div className="relative min-w-0">
          <select
            value={note}
            onChange={(e) => updateParam("note", e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">Notes</option>
            {NOTES.map((n) => (
              <option key={n} value={n}>
                {n}★ et +
              </option>
            ))}
          </select>
          <Chevron />
        </div>
      </div>

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="self-start text-xs text-taupe underline underline-offset-2 hover:text-encre sm:text-sm"
        >
          Effacer les filtres
        </button>
      )}
    </div>
  );
}
