import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Bottle } from "@/lib/types";
import BottleCard from "@/components/BottleCard";
import FilterBar from "@/components/FilterBar";
import LogoutButton from "@/components/LogoutButton";

type CavePageProps = {
  searchParams: Promise<{ type?: string; millesime?: string; note?: string }>;
};

export default async function CavePage({ searchParams }: CavePageProps) {
  const { type, millesime, note } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("bottles").select("*").order("created_at", { ascending: false });
  if (type) query = query.eq("type_vin", type);
  if (millesime) query = query.eq("millesime", millesime);
  if (note) query = query.gte("note", Number(note));

  const [{ data: bottles }, { data: allBottles }] = await Promise.all([
    query,
    supabase.from("bottles").select("millesime"),
  ]);

  const millesimes = Array.from(
    new Set((allBottles ?? []).map((b) => b.millesime).filter(Boolean)),
  ).sort((a, b) => b.localeCompare(a));

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-bordure px-6 py-4">
        <h1 className="font-serif text-2xl text-bordeaux">Millésime</h1>
        <div className="flex items-center gap-4">
          <Link
            href="/cave/ajouter"
            className="rounded-md bg-bordeaux px-4 py-2 text-sm font-medium text-ivoire hover:bg-bordeaux-dark"
          >
            + Ajouter une bouteille
          </Link>
          <LogoutButton />
        </div>
      </header>

      <div className="border-b border-bordure px-6 py-3">
        <FilterBar millesimes={millesimes} />
      </div>

      <main className="flex-1 px-6 py-6">
        {!bottles || bottles.length === 0 ? (
          <p className="mt-12 text-center text-sm text-taupe">
            Aucune bouteille pour l&apos;instant. Ajoutez-en une pour commencer votre cave.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {bottles.map((bottle: Bottle) => (
              <BottleCard key={bottle.id} bottle={bottle} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
