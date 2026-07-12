import Image from "next/image";
import Link from "next/link";
import type { Bottle } from "@/lib/types";
import StarRating from "@/components/StarRating";

export default function BottleCard({ bottle }: { bottle: Bottle }) {
  return (
    <Link
      href={`/cave/${bottle.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-bordure bg-carte transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[3/4] w-full bg-ivoire">
        <Image
          src={bottle.image_url}
          alt={bottle.nom}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform group-hover:scale-[1.02]"
        />
      </div>
      <div className="flex flex-col gap-1 p-3">
        <p className="font-serif text-base leading-tight text-encre">{bottle.nom}</p>
        <p className="text-xs text-taupe">
          {bottle.type_vin} · {bottle.region || "Région inconnue"} · {bottle.millesime || "?"}
        </p>
        <StarRating value={bottle.note} size="sm" />
      </div>
    </Link>
  );
}
