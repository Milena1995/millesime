"use client";

import { useRef, useState } from "react";

type CaptureBoxProps = {
  label: string;
  onCapture: (file: File) => void;
};

export default function CaptureBox({ label, onCapture }: CaptureBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    onCapture(file);
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border-2 border-dashed border-bordure bg-carte text-taupe transition-colors hover:border-or hover:text-or"
    >
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt={label} className="h-full w-full object-cover" />
      ) : (
        <>
          <span className="text-3xl">📷</span>
          <span className="text-sm font-medium">{label}</span>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
    </button>
  );
}
