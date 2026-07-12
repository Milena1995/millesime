"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Bottle } from "@/lib/types";
import StarRating from "@/components/StarRating";
import BottleForm, { type BottleFormValues } from "@/components/BottleForm";

export default function BottleDetail({ bottle }: { bottle: Bottle }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState(bottle);
  const [deleting, setDeleting] = useState(false);

  async function handleUpdate(values: BottleFormValues) {
    const res = await fetch(`/api/bottles/${current.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Impossible de mettre à jour la bouteille");
    }
    const { bottle: updated } = await res.json();
    setCurrent(updated);
    setEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Supprimer cette bouteille de votre cave ?")) return;
    setDeleting(true);
    const res = await fetch(`/api/bottles/${current.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/cave");
      router.refresh();
    } else {
      setDeleting(false);
    }
  }

  if (editing) {
    return (
      <BottleForm
        imageUrl={current.image_url}
        submitLabel="Enregistrer"
        onSubmit={handleUpdate}
        onCancel={() => setEditing(false)}
        initialValues={{
          nom: current.nom,
          type_vin: current.type_vin,
          region: current.region,
          millesime: current.millesime,
          cepage: current.cepage,
          prix: current.prix,
          note: current.note,
          notes: current.notes ?? "",
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 sm:flex-row">
      <div className="w-full sm:w-72 shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.image_url}
          alt={current.nom}
          className="aspect-[3/4] w-full rounded-lg object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col gap-3">
        <h1 className="font-serif text-3xl text-encre">{current.nom}</h1>
        <StarRating value={current.note} size="lg" />
        <p className="text-sm text-taupe">
          {current.type_vin} · {current.region || "Région inconnue"} · {current.millesime || "?"}
        </p>
        {current.cepage && <p className="text-sm text-taupe">Cépage : {current.cepage}</p>}
        {current.prix != null && (
          <p className="text-sm text-taupe">Prix payé : {current.prix.toFixed(2)} €</p>
        )}

        {current.accords_mets_vins.length > 0 && (
          <div className="mt-2 rounded-md border border-bordure bg-carte p-4">
            <p className="font-serif text-sm text-bordeaux">Accords mets-vins suggérés</p>
            <ul className="mt-2 flex flex-col gap-1 text-sm text-encre">
              {current.accords_mets_vins.map((accord, i) => (
                <li key={i}>· {accord}</li>
              ))}
            </ul>
          </div>
        )}

        {current.notes && (
          <div className="mt-2">
            <p className="font-serif text-sm text-bordeaux">Notes personnelles</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-encre">{current.notes}</p>
          </div>
        )}

        <div className="mt-4 flex gap-3">
          <button
            onClick={() => setEditing(true)}
            className="rounded-md border border-bordure px-5 py-2.5 text-sm font-medium text-encre hover:border-or"
          >
            Modifier
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-md px-5 py-2.5 text-sm font-medium text-bordeaux hover:underline disabled:opacity-60"
          >
            {deleting ? "Suppression..." : "Supprimer"}
          </button>
        </div>
      </div>
    </div>
  );
}
