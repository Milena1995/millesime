import { GoogleGenAI } from "@google/genai";
import type { ExtractedLabelInfo, WineType } from "@/lib/types";

const WINE_TYPES: WineType[] = ["Rouge", "Blanc", "Rosé", "Mousseux", "Autre"];

function client() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY manquante — ajoute-la dans .env.local");
  }
  return new GoogleGenAI({ apiKey });
}

/** Étiquette (face + dos) -> infos structurées. Champs non lisibles restent null. */
export async function extractLabelInfo(
  frontImageBase64: string,
  backImageBase64: string,
): Promise<ExtractedLabelInfo> {
  const ai = client();

  const prompt = `Tu analyses la photo de face et de dos d'une bouteille de vin.
Extrais les informations visibles sur l'étiquette et renvoie UNIQUEMENT un objet JSON
avec exactement ces clés : nom, type_vin, region, millesime, cepage.
- "type_vin" doit être une de ces valeurs exactes : ${WINE_TYPES.join(", ")}.
- Si une information n'est pas lisible ou absente, mets la valeur null pour ce champ.
- N'invente jamais une valeur : en cas de doute, mets null.
- Ne renvoie rien d'autre que le JSON (pas de texte, pas de markdown).`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          { inlineData: { mimeType: "image/jpeg", data: frontImageBase64 } },
          { inlineData: { mimeType: "image/jpeg", data: backImageBase64 } },
        ],
      },
    ],
    config: { responseMimeType: "application/json" },
  });

  const raw = response.text ?? "{}";
  const parsed = JSON.parse(raw) as Partial<ExtractedLabelInfo>;

  return {
    nom: parsed.nom ?? null,
    type_vin: WINE_TYPES.includes(parsed.type_vin as WineType)
      ? (parsed.type_vin as WineType)
      : null,
    region: parsed.region ?? null,
    millesime: parsed.millesime ?? null,
    cepage: parsed.cepage ?? null,
  };
}

/**
 * Régénère une image "commerciale" cohérente de la bouteille à partir des photos face/dos.
 * Prompt template fixe pour garantir un rendu homogène entre toutes les bouteilles (MILL-3).
 */
export async function generateBottleImage(
  frontImageBase64: string,
  backImageBase64: string,
): Promise<string> {
  const ai = client();

  const prompt = `À partir de ces deux photos (face et dos) d'une vraie bouteille de vin,
génère une photo de produit commerciale et PHOTORÉALISTE de cette même bouteille
(garde fidèlement l'étiquette, la forme, la couleur du verre et du liquide — ne
réinvente pas la bouteille, améliore simplement sa présentation).
Mise en scène obligatoire, identique à chaque génération :
- Bouteille centrée, debout, cadrage vertical serré
- Fond neutre uni ivoire/beige chaud (#F5F1EA)
- Lumière douce et chaude, légère ombre portée au sol
- Aucun texte ajouté, aucun élément de décor supplémentaire
- Style épuré, élégant, cohérent avec une esthétique "chic, sobre, intemporelle"`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          { inlineData: { mimeType: "image/jpeg", data: frontImageBase64 } },
          { inlineData: { mimeType: "image/jpeg", data: backImageBase64 } },
        ],
      },
    ],
  });

  const imagePart = response.candidates?.[0]?.content?.parts?.find(
    (part) => part.inlineData,
  );

  if (!imagePart?.inlineData?.data) {
    throw new Error("Gemini n'a renvoyé aucune image générée.");
  }

  return imagePart.inlineData.data; // base64, sans préfixe data URL
}

/** Suggestions d'accords mets-vins, générées une fois à la création puis mises en cache (MILL-9). */
export async function generatePairingSuggestions(
  type_vin: string,
  cepage: string,
  region: string,
): Promise<string[]> {
  const ai = client();

  const prompt = `Vin : type "${type_vin}", cépage "${cepage}", région "${region}".
Donne 3 suggestions courtes et concrètes d'accords mets-vins (plats ou familles de plats),
dans un ton élégant et sobre. Renvoie UNIQUEMENT un tableau JSON de 3 chaînes de caractères,
sans texte ni markdown autour.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json" },
  });

  const raw = response.text ?? "[]";
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed.slice(0, 3) : [];
}
