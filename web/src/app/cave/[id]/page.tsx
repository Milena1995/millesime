import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BottleDetail from "@/components/BottleDetail";

export default async function BottleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: bottle } = await supabase.from("bottles").select("*").eq("id", id).single();

  if (!bottle) notFound();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-8">
      <Link href="/cave" className="mb-6 text-sm text-taupe hover:text-encre">
        ← Retour à la cave
      </Link>
      <BottleDetail bottle={bottle} />
    </div>
  );
}
