"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CaptureBox from "@/components/CaptureBox";
import BottleForm, { type BottleFormValues } from "@/components/BottleForm";
import { fileToCompressedBase64 } from "@/lib/image";
import type { ExtractedLabelInfo } from "@/lib/types";

type Step = "capture" | "processing" | "review" | "error";

export default function AjouterBottlePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("capture");
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

  async function runProcess(front: string, back: string) {
    setStep("processing");
    setError("");
    try {
      const res = await fetch("/api/ai/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ front, back }),
      });
      if (!res.ok) throw new Error("Le traitement IA a échoué. Réessayez.");

      const data = await res.json();
      setExtracted(data.extracted);
      setGeneratedImageBase64(data.generatedImageBase64);
      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      setStep("error");
    }
  }

  async function handleProcess() {
    if (!frontFile || !backFile) return;
    setStep("processing");
    setError("");
    try {
      const [front, back] = await Promise.all([
        fileToCompressedBase64(frontFile),
        fileToCompressedBase64(backFile),
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
    if (!frontBase64 || !backBase64) return;
    runProcess(frontBase64, backBase64);
  }

  /** Abandonne et repart de zéro sur l'étape de capture. */
  function handleRetakePhotos() {
    setFrontFile(null);
    setBackFile(null);
    setFrontBase64("");
    setBackBase64("");
    setError("");
    setStep("capture");
  }

  async function handleRegenerateImage() {
    if (!frontBase64 || !backBase64) return;
    setRegenerating(true);
    setError("");
    try {
      const res = await fetch("/api/ai/regenerate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ front: frontBase64, back: backBase64 }),
      });
      if (!res.ok) throw new Error("La régénération de l'image a échoué. Réessayez.");
      const data = await res.json();
      setGeneratedImageBase64(data.generatedImageBase64);
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
      body: JSON.stringify({ ...values, generatedImageBase64 }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Impossible d'enregistrer la bouteille");
    }
    const { bottle } = await res.json();
    router.push(`/cave/${bottle.id}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
      {step === "capture" && (
        <Link href="/cave" className="mb-4 text-sm text-taupe hover:text-encre">
          ← Retour à la cave
        </Link>
      )}
      <h1 className="font-serif text-xl text-bordeaux sm:text-2xl">Ajouter une bouteille</h1>

      {step === "capture" && (
        <div className="mt-6 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
            <CaptureBox label="Photo de face" onCapture={setFrontFile} />
            <CaptureBox label="Photo de dos" onCapture={setBackFile} />
          </div>
          {error && <p className="text-sm text-bordeaux">{error}</p>}
          <button
            onClick={handleProcess}
            disabled={!frontFile || !backFile}
            className="rounded-md bg-bordeaux px-5 py-2.5 text-sm font-medium text-ivoire hover:bg-bordeaux-dark disabled:opacity-40"
          >
            Analyser la bouteille
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
          <p className="text-sm text-taupe">
            Vos deux photos sont conservées, vous pouvez simplement réessayer.
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
    </div>
  );
}
