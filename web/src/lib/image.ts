/** Convertit un File image en base64 brut (sans préfixe data URL), pour l'envoi à Gemini. */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Redimensionne une image côté client (largeur max ~1200px) et la recompresse en JPEG
 * avant envoi à Gemini : les photos iPhone (souvent 3-5 Mo) sont ainsi bien plus légères,
 * ce qui accélère l'analyse sur réseau mobile et réduit le volume envoyé à l'API.
 * Retourne le base64 brut (sans préfixe data URL).
 */
export function fileToCompressedBase64(
  file: File,
  maxWidth = 1200,
  quality = 0.85,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      URL.revokeObjectURL(objectUrl);

      if (!ctx) {
        reject(new Error("Impossible de traiter l'image"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve(dataUrl.split(",")[1] ?? "");
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Impossible de charger l'image"));
    };

    img.src = objectUrl;
  });
}
