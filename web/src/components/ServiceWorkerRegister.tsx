"use client";

import { useEffect } from "react";

/** Enregistre le service worker (mode hors-ligne basique, cf. public/sw.js). */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Échec silencieux : l'app reste utilisable normalement, juste sans le filet hors-ligne.
      });
    }
  }, []);

  return null;
}
