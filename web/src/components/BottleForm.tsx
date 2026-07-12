"use client";

import { useState } from "react";
import type { WineType } from "@/lib/types";
import StarRating from "@/components/StarRating";

const WINE_TYPES: WineType[] = ["Rouge", "Blanc", "Rosé", "Mousseux", "Autre"];

export type BottleFormValues = {
  nom: string;
  type_vin: WineType;
  region: string;
  millesime: string;
  cepage: string;
  prix: number | null;
  note: number;
  notes: string;
};

type BottleFormProps = {
  initialValues: BottleFormValues;
  imageUrl: string;
  submitLabel: string;
  onSubmit: (values: BottleFormValues) => Promise<void>;
  onCancel?: () => void;
};

export default function BottleForm({
  initialValues,
  imageUrl,
  submitLabel,
  onSubmit,
  onCancel,
}: BottleFormProps) {
  const [values, setValues] = useState(initialValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof BottleFormValues>(key: K, value: BottleFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 sm:flex-row">
      <div className="w-full sm:w-64 shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={values.nom || "Bouteille"}
          className="aspect-[3/4] w-full rounded-lg object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm text-taupe">
          Nom / domaine
          <input
            required
            value={values.nom}
            onChange={(e) => update("nom", e.target.value)}
            className="rounded-md border border-bordure bg-carte px-3 py-2 text-encre focus:border-or focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-taupe">
          Type de vin
          <select
            value={values.type_vin}
            onChange={(e) => update("type_vin", e.target.value as WineType)}
            className="rounded-md border border-bordure bg-carte px-3 py-2 text-encre focus:border-or focus:outline-none"
          >
            {WINE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1 text-sm text-taupe">
            Région / appellation
            <input
              value={values.region}
              onChange={(e) => update("region", e.target.value)}
              className="rounded-md border border-bordure bg-carte px-3 py-2 text-encre focus:border-or focus:outline-none"
            />
          </label>
          <label className="flex w-28 flex-col gap-1 text-sm text-taupe">
            Millésime
            <input
              value={values.millesime}
              onChange={(e) => update("millesime", e.target.value)}
              className="rounded-md border border-bordure bg-carte px-3 py-2 text-encre focus:border-or focus:outline-none"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm text-taupe">
          Cépage
          <input
            value={values.cepage}
            onChange={(e) => update("cepage", e.target.value)}
            className="rounded-md border border-bordure bg-carte px-3 py-2 text-encre focus:border-or focus:outline-none"
          />
        </label>

        <label className="flex w-40 flex-col gap-1 text-sm text-taupe">
          Prix payé (€)
          <input
            type="number"
            step="0.01"
            min="0"
            value={values.prix ?? ""}
            onChange={(e) => update("prix", e.target.value === "" ? null : Number(e.target.value))}
            className="rounded-md border border-bordure bg-carte px-3 py-2 text-encre focus:border-or focus:outline-none"
          />
        </label>

        <div className="flex flex-col gap-1 text-sm text-taupe">
          Note
          <StarRating value={values.note} onChange={(n) => update("note", n)} size="lg" />
        </div>

        <label className="flex flex-col gap-1 text-sm text-taupe">
          Notes personnelles
          <textarea
            rows={3}
            value={values.notes}
            onChange={(e) => update("notes", e.target.value)}
            className="rounded-md border border-bordure bg-carte px-3 py-2 text-encre focus:border-or focus:outline-none"
          />
        </label>

        {error && <p className="text-sm text-bordeaux">{error}</p>}

        <div className="mt-2 flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-bordeaux px-5 py-2.5 text-sm font-medium text-ivoire hover:bg-bordeaux-dark disabled:opacity-60"
          >
            {saving ? "Enregistrement..." : submitLabel}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-bordure px-5 py-2.5 text-sm font-medium text-taupe hover:text-encre"
            >
              Annuler
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
