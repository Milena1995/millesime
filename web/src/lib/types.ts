export type WineType = "Rouge" | "Blanc" | "Rosé" | "Mousseux" | "Autre";

export interface Bottle {
  id: string;
  user_id: string;
  nom: string;
  type_vin: WineType;
  region: string;
  millesime: string;
  cepage: string;
  prix: number | null;
  note: number;
  notes: string | null;
  accords_mets_vins: string[];
  image_url: string;
  created_at: string;
}

export interface BottleInput {
  nom: string;
  type_vin: WineType;
  region: string;
  millesime: string;
  cepage: string;
  prix: number | null;
  note: number;
  notes: string | null;
  image_url: string;
}

export interface ExtractedLabelInfo {
  nom: string | null;
  type_vin: WineType | null;
  region: string | null;
  millesime: string | null;
  cepage: string | null;
}
