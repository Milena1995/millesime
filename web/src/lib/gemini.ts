import { GoogleGenAI, type Part } from "@google/genai";
import type { ExtractedLabelInfo, WineType } from "@/lib/types";

const WINE_TYPES: WineType[] = ["Rouge", "Blanc", "Rosé", "Mousseux", "Autre"];

function client() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY manquante — ajoute-la dans .env.local");
  }
  return new GoogleGenAI({ apiKey });
}

function normalizeExtracted(parsed: Partial<ExtractedLabelInfo>): ExtractedLabelInfo {
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
 * Étiquette (face, + dos si disponible) -> infos structurées. Champs non lisibles restent null.
 * La photo de dos est optionnelle : certaines bouteilles ne sont photographiées que de face.
 */
export async function extractLabelInfo(
  frontImageBase64: string,
  backImageBase64?: string,
): Promise<ExtractedLabelInfo> {
  const ai = client();

  const prompt = backImageBase64
    ? `Tu analyses la photo de face et de dos d'une bouteille de vin.
Extrais les informations visibles sur l'étiquette et renvoie UNIQUEMENT un objet JSON
avec exactement ces clés : nom, type_vin, region, millesime, cepage.
- "type_vin" doit être une de ces valeurs exactes : ${WINE_TYPES.join(", ")}.
- Si une information n'est pas lisible ou absente, mets la valeur null pour ce champ.
- N'invente jamais une valeur : en cas de doute, mets null.
- Ne renvoie rien d'autre que le JSON (pas de texte, pas de markdown).`
    : `Tu analyses la photo de face (seule photo disponible, pas de dos) d'une bouteille de vin.
Extrais les informations visibles sur l'étiquette et renvoie UNIQUEMENT un objet JSON
avec exactement ces clés : nom, type_vin, region, millesime, cepage.
- "type_vin" doit être une de ces valeurs exactes : ${WINE_TYPES.join(", ")}.
- Si une information n'est pas lisible ou absente sur cette photo, mets la valeur null pour ce champ.
- N'invente jamais une valeur : en cas de doute, mets null.
- Ne renvoie rien d'autre que le JSON (pas de texte, pas de markdown).`;

  const parts: Part[] = [
    { text: prompt },
    { inlineData: { mimeType: "image/jpeg", data: frontImageBase64 } },
  ];
  if (backImageBase64) {
    parts.push({ inlineData: { mimeType: "image/jpeg", data: backImageBase64 } });
  }

  const response = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: [{ role: "user", parts }],
    config: { responseMimeType: "application/json" },
  });

  const raw = response.text ?? "{}";
  const parsed = JSON.parse(raw) as Partial<ExtractedLabelInfo>;
  const extracted = normalizeExtracted(parsed);

  // Pas de photo de dos (ou infos encore manquantes) : on tente de compléter via une
  // recherche web, à partir de ce qu'on a déjà pu lire sur l'étiquette de face.
  const hasMissingFields = !extracted.type_vin || !extracted.region || !extracted.cepage;
  if (extracted.nom && hasMissingFields) {
    return enrichFromWeb(extracted);
  }

  return extracted;
}

/**
 * Complète les champs manquants (cépage, région, type...) via une recherche Google,
 * en s'appuyant sur le nom déjà identifié sur l'étiquette. Échec silencieux : en cas
 * de problème, on renvoie simplement les infos déjà extraites du label.
 */
async function enrichFromWeb(info: ExtractedLabelInfo): Promise<ExtractedLabelInfo> {
  const missingFields = (
    ["type_vin", "region", "millesime", "cepage"] as (keyof ExtractedLabelInfo)[]
  ).filter((key) => !info[key]);
  if (missingFields.length === 0) return info;

  try {
    const ai = client();
    const known = `nom/domaine : ${info.nom}, type_vin : ${info.type_vin ?? "inconnu"}, région : ${info.region ?? "inconnue"}, millésime : ${info.millesime ?? "inconnu"}, cépage : ${info.cepage ?? "inconnu"}`;

    const prompt = `Tu es un expert en vins. Voici les informations déjà connues sur une bouteille
de vin (lues sur son étiquette de face, la photo du dos n'est pas disponible) : ${known}.
Recherche sur le web des informations fiables sur ce vin précis pour compléter uniquement
les champs manquants suivants : ${missingFields.join(", ")}.
Renvoie UNIQUEMENT un objet JSON avec exactement ces clés : nom, type_vin, region, millesime, cepage.
- "type_vin" doit être une de ces valeurs exactes : ${WINE_TYPES.join(", ")}.
- Recopie telles quelles les valeurs déjà connues ci-dessus.
- Si tu ne trouves aucune information fiable pour un champ manquant, mets null (n'invente jamais).
- Ne renvoie rien d'autre que le JSON (pas de texte, pas de markdown, pas de bloc de code).`;

    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { tools: [{ googleSearch: {} }] },
    });

    const raw = response.text ?? "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return info;

    const parsed = JSON.parse(match[0]) as Partial<ExtractedLabelInfo>;
    return {
      nom: info.nom ?? parsed.nom ?? null,
      type_vin:
        info.type_vin ??
        (WINE_TYPES.includes(parsed.type_vin as WineType) ? (parsed.type_vin as WineType) : null),
      region: info.region ?? parsed.region ?? null,
      millesime: info.millesime ?? parsed.millesime ?? null,
      cepage: info.cepage ?? parsed.cepage ?? null,
    };
  } catch (error) {
    console.error("Erreur enrichissement web:", error);
    return info;
  }
}

const LIQUID_COLOR_BY_TYPE: Record<WineType, string> = {
  Rouge: "un vin rouge, couleur rouge sombre/grenat bien opaque",
  Blanc: "un vin blanc, couleur jaune pâle/doré clair",
  Rosé: "un vin rosé, couleur rose saumon",
  Mousseux: "un vin mousseux, couleur dorée pétillante",
  Autre: "un vin dont la couleur du liquide doit rester fidèle à la photo d'origine",
};

/**
 * Régénère une image "commerciale" cohérente de la bouteille à partir des photos face/dos.
 * Prompt template fixe pour garantir un rendu homogène entre toutes les bouteilles (MILL-3).
 */
export async function generateBottleImage(
  frontImageBase64: string,
  backImageBase64?: string,
  wineType?: WineType | null,
): Promise<string> {
  const ai = client();

  const liquidInstruction =
    wineType && LIQUID_COLOR_BY_TYPE[wineType]
      ? `Ce vin est ${LIQUID_COLOR_BY_TYPE[wineType]}.`
      : "Garde la couleur du liquide fidèle à ce qui est visible sur la/les photo(s) d'origine.";

  const prompt = `À partir de ${backImageBase64 ? "ces deux photos (face et dos)" : "cette photo (face)"} d'une vraie bouteille de vin,
génère une photo de produit commerciale et PHOTORÉALISTE de cette même bouteille
(garde fidèlement l'étiquette, la forme, la couleur du verre — ne réinvente pas la
bouteille, améliore simplement sa présentation).
Mise en scène obligatoire, identique à chaque génération :
- Bouteille centrée, debout, cadrage vertical serré
- Fond neutre uni ivoire/beige chaud (#F5F1EA)
- Lumière douce et chaude, légère ombre portée au sol
- Aucun texte ajouté, aucun élément de décor supplémentaire
- Style épuré, élégant, cohérent avec une esthétique "chic, sobre, intemporelle"
- IMPORTANT : la bouteille doit paraître pleine, remplie de vin jusqu'au goulot, comme
  une bouteille neuve jamais ouverte. Elle ne doit JAMAIS avoir l'air vide, translucide
  ou vidée de son contenu. ${liquidInstruction}`;

  const parts: Part[] = [
    { text: prompt },
    { inlineData: { mimeType: "image/jpeg", data: frontImageBase64 } },
  ];
  if (backImageBase64) {
    parts.push({ inlineData: { mimeType: "image/jpeg", data: backImageBase64 } });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-image",
    contents: [{ role: "user", parts }],
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
    model: "gemini-flash-latest",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json" },
  });

  const raw = response.text ?? "[]";
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed.slice(0, 3) : [];
}
