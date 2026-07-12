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
      <header className="flex items-center justify-between gap-2 border-b border-bordure px-4 py-3 sm:px-6 sm:py-4">
        <h1 className="truncate font-serif text-xl text-bordeaux sm:text-2xl">Millésime</h1>
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <Link
            href="/cave/ajouter"
            aria-label="Ajouter une bouteille"
            className="flex items-center justify-center gap-2 rounded-full bg-bordeaux p-2.5 text-ivoire hover:bg-bordeaux-dark sm:rounded-md sm:px-4 sm:py-2 sm:text-sm sm:font-medium"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 sm:h-4 sm:w-4"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span className="hidden sm:inline">Ajouter une bouteille</span>
          </Link>
          <LogoutButton />
        </div>
      </header>

      <div className="border-b border-bordure px-4 py-3 sm:px-6">
        <FilterBar millesimes={millesimes} />
      </div>

      <main className="flex-1 px-4 py-6 sm:px-6">
        {!bottles || bottles.length === 0 ? (
          <p className="mt-12 text-center text-sm text-taupe">
            Aucune bouteille pour l&apos;instant. Ajoutez-en une pour commencer votre cave.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {bottles.map((bottle: Bottle) => (
              <BottleCard key={bottle.id} bottle={bottle} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
