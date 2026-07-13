"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CaptureBox from "@/components/CaptureBox";
import BottleForm, { type BottleFormValues } from "@/components/BottleForm";
import { fileToCompressedBase64 } from "@/lib/image";
import type { ExtractedLabelInfo, WineType } from "@/lib/types";

type Step =
  | "choice"
  | "capture"
  | "processing"
  | "review"
  | "error"
  | "manual-capture"
  | "manual-review";

const EMPTY_VALUES: BottleFormValues = {
  nom: "",
  type_vin: "Autre",
  region: "",
  millesime: "",
  cepage: "",
  prix: null,
  note: 0,
  notes: "",
  quantite: 1,
};

export default function AjouterBottlePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("choice");
  const [credits, setCredits] = useState<number | null>(null);

  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  // Base64 compressés mis en cache après la 1re analyse, pour pouvoir réessayer ou
  // régénérer l'image sans avoir à retoucher/recompresser les photos.
  const [frontBase64, setFrontBase64] = useState("");
  const [backBase64, setBackBase64] = useState("");
  const [generatedImageBase64, setGeneratedImageBase64] = useState("");
  const [extracted, setExtracted] = useState<ExtractedLabelInfo | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState("");
  const [noCredits, setNoCredits] = useState(false);

  const [manualFile, setManualFile] = useState<File | null>(null);
  const [manualBase64, setManualBase64] = useState("");

  useEffect(() => {
    fetch("/api/credits")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setCredits(data?.credits_ia ?? null))
      .catch(() => setCredits(null));
  }, []);

  async function runProcess(front: string, back: string) {
    setStep("processing");
    setError("");
    setNoCredits(false);
    try {
      const res = await fetch("/api/ai/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ front, back: back || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.code === "NO_CREDITS") setNoCredits(true);
        throw new Error(data.error ?? "Le traitement IA a échoué. Réessayez.");
      }

      setExtracted(data.extracted);
      setGeneratedImageBase64(data.generatedImageBase64);
      setCredits((c) => (c === null ? c : Math.max(0, c - 1)));
      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      setStep("error");
    }
  }

  async function handleProcess() {
    if (!frontFile) return;
    setStep("processing");
    setError("");
    try {
      const [front, back] = await Promise.all([
        fileToCompressedBase64(frontFile),
        backFile ? fileToCompressedBase64(backFile) : Promise.resolve(""),
      ]);
      setFrontBase64(front);
      setBackBase64(back);
      await runProcess(front, back);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      setStep("error");
    }
  }

  /** Relance l'analyse avec les mêmes photos (déjà compressées), sans repasser par la capture. */
  function handleRetry() {
    if (!frontBase64) return;
    runProcess(frontBase64, backBase64);
  }

  /** Abandonne et repart de zéro sur l'étape de capture. */
  function handleRetakePhotos() {
    setFrontFile(null);
    setBackFile(null);
    setFrontBase64("");
    setBackBase64("");
    setError("");
    setNoCredits(false);
    setStep("capture");
  }

  /** Crédits épuisés en plein traitement : on repart sur le mode manuel sans re-demander
   * la photo déjà prise. */
  function handleSwitchToManual() {
    if (!frontBase64) return;
    setManualBase64(frontBase64);
    setError("");
    setNoCredits(false);
    setStep("manual-review");
  }

  async function handleRegenerateImage(type_vin: WineType) {
    if (!frontBase64) return;
    setRegenerating(true);
    setError("");
    try {
      const res = await fetch("/api/ai/regenerate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          front: frontBase64,
          back: backBase64 || undefined,
          type_vin,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "La régénération de l'image a échoué. Réessayez.");
      }
      setGeneratedImageBase64(data.generatedImageBase64);
      setCredits((c) => (c === null ? c : Math.max(0, c - 1)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setRegenerating(false);
    }
  }

  async function handleSave(values: BottleFormValues) {
    const res = await fetch("/api/bottles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, generatedImageBase64, viaAI: true }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Impossible d'enregistrer la bouteille");
    }
    const { bottle } = await res.json();
    router.push(`/cave/${bottle.id}`);
  }

  async function handleManualContinue() {
    if (!manualFile) return;
    setError("");
    try {
      const base64 = await fileToCompressedBase64(manualFile);
      setManualBase64(base64);
      setStep("manual-review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    }
  }

  async function handleSaveManual(values: BottleFormValues) {
    const res = await fetch("/api/bottles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, generatedImageBase64: manualBase64, viaAI: false }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Impossible d'enregistrer la bouteille");
    }
    const { bottle } = await res.json();
    router.push(`/cave/${bottle.id}`);
  }

  const iaDisabled = credits !== null && credits <= 0;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
      {step === "choice" && (
        <Link href="/cave" className="mb-4 text-sm text-taupe hover:text-encre">
          ← Retour à la cave
        </Link>
      )}
      {(step === "capture" || step === "manual-capture") && (
        <button
          onClick={() => setStep("choice")}
          className="mb-4 self-start text-sm text-taupe hover:text-encre"
        >
          ← Retour
        </button>
      )}
      <h1 className="font-serif text-xl text-bordeaux sm:text-2xl">Ajouter une bouteille</h1>

      {step === "choice" && (
        <div className="mt-6 flex flex-col gap-4">
          <p className="text-sm text-taupe">Comment veux-tu ajouter cette bouteille ?</p>

          <button
            type="button"
            onClick={() => setStep("manual-capture")}
            className="flex flex-col gap-1 rounded-lg border border-bordure bg-carte px-4 py-4 text-left transition-colors hover:border-or"
          >
            <span className="font-serif text-lg text-bordeaux">✍️ Remplir manuellement</span>
            <span className="text-sm text-taupe">
              Renseigne toi-même les informations et ta propre photo. Gratuit et illimité.
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStep("capture")}
            disabled={iaDisabled}
            className="flex flex-col gap-1 rounded-lg border border-bordure bg-carte px-4 py-4 text-left transition-colors hover:border-or disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-bordure"
          >
            <span className="font-serif text-lg text-bordeaux">✨ Utiliser l&apos;IA</span>
            <span className="text-sm text-taupe">
              {credits === null
                ? "Analyse automatique de l'étiquette et génération d'une photo commerciale."
                : credits > 0
                  ? `Il te reste ${credits} bouteille${credits > 1 ? "s" : ""} gratuite${credits > 1 ? "s" : ""} avec IA.`
                  : "Crédits IA épuisés. L'achat de crédits arrive bientôt — en attendant, utilise le mode manuel."}
            </span>
          </button>
        </div>
      )}

      {step === "capture" && (
        <div className="mt-6 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
            <CaptureBox label="Photo de face" onCapture={setFrontFile} />
            <CaptureBox label="Photo de dos" optional onCapture={setBackFile} />
          </div>
          <p className="text-xs text-taupe">
            Pas de photo de dos ? Pas de souci : l&apos;IA complètera les infos manquantes
            (cépage, région...) grâce à une recherche en ligne, à partir de la photo de face.
          </p>
          {error && <p className="text-sm text-bordeaux">{error}</p>}
          <button
            onClick={handleProcess}
            disabled={!frontFile}
            className="rounded-md bg-bordeaux px-5 py-2.5 text-sm font-medium text-ivoire hover:bg-bordeaux-dark disabled:opacity-40"
          >
            Analyser la bouteille
          </button>
        </div>
      )}

      {step === "manual-capture" && (
        <div className="mt-6 flex flex-col gap-6">
          <div className="w-full max-w-xs">
            <CaptureBox label="Photo de la bouteille" onCapture={setManualFile} />
          </div>
          {error && <p className="text-sm text-bordeaux">{error}</p>}
          <button
            onClick={handleManualContinue}
            disabled={!manualFile}
            className="rounded-md bg-bordeaux px-5 py-2.5 text-sm font-medium text-ivoire hover:bg-bordeaux-dark disabled:opacity-40"
          >
            Continuer
          </button>
        </div>
      )}

      {step === "processing" && (
        <div className="mt-16 flex flex-col items-center gap-4 text-taupe">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-bordure border-t-bordeaux" />
          <p className="text-sm">L&apos;IA analyse l&apos;étiquette et prépare le visuel...</p>
        </div>
      )}

      {step === "error" && (
        <div className="mt-12 flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-bordeaux">{error}</p>
          {noCredits ? (
            <>
              <p className="text-sm text-taupe">
                Tu peux continuer en mode manuel avec la photo déjà prise (gratuit).
              </p>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={handleSwitchToManual}
                  className="rounded-md bg-bordeaux px-5 py-2.5 text-sm font-medium text-ivoire hover:bg-bordeaux-dark"
                >
                  Remplir manuellement
                </button>
                <button
                  onClick={() => setStep("choice")}
                  className="rounded-md border border-bordure px-5 py-2.5 text-sm font-medium text-taupe hover:text-encre"
                >
                  Retour
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-taupe">
                Vos photos sont conservées, vous pouvez simplement réessayer.
              </p>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={handleRetry}
                  className="rounded-md bg-bordeaux px-5 py-2.5 text-sm font-medium text-ivoire hover:bg-bordeaux-dark"
                >
                  Réessayer l&apos;analyse
                </button>
                <button
                  onClick={handleRetakePhotos}
                  className="rounded-md border border-bordure px-5 py-2.5 text-sm font-medium text-taupe hover:text-encre"
                >
                  Reprendre les photos
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {step === "review" && extracted && (
        <div className="mt-6">
          <BottleForm
            imageUrl={`data:image/jpeg;base64,${generatedImageBase64}`}
            submitLabel="Ajouter à ma cave"
            onSubmit={handleSave}
            onCancel={() => setStep("capture")}
            onRegenerateImage={handleRegenerateImage}
            regeneratingImage={regenerating}
            initialValues={{
              nom: extracted.nom ?? "",
              type_vin: extracted.type_vin ?? "Autre",
              region: extracted.region ?? "",
              millesime: extracted.millesime ?? "",
              cepage: extracted.cepage ?? "",
              prix: null,
              note: 0,
              notes: "",
              quantite: 1,
            }}
          />
          {error && <p className="mt-3 text-sm text-bordeaux">{error}</p>}
        </div>
      )}

      {step === "manual-review" && (
        <div className="mt-6">
          <BottleForm
            imageUrl={`data:image/jpeg;base64,${manualBase64}`}
            submitLabel="Ajouter à ma cave"
            onSubmit={handleSaveManual}
            onCancel={() => setStep("manual-capture")}
            initialValues={EMPTY_VALUES}
          />
          {error && <p className="mt-3 text-sm text-bordeaux">{error}</p>}
        </div>
      )}
    </div>
  );
}
