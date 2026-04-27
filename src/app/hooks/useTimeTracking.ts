// src/app/hooks/useTimeTracking.ts
import { useEffect, useRef } from "react";
import api from "../services/api";

/**
 * Track time spent on a formation and send it to the backend on unmount.
 * Also handles page hide (tab switch, window close).
 */
export function useTimeTracking(
  formationId: string | undefined,
  enabled: boolean = true,
) {
  const startTimeRef = useRef<number>(Date.now());
  const accumulatedRef = useRef<number>(0);
  const sentRef = useRef<boolean>(false);

  const send = async () => {
    if (!formationId || !enabled || sentRef.current) return;
    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
    const total = accumulatedRef.current + elapsed;
    if (total < 5) return; // Ne pas enregistrer moins de 5 secondes
    sentRef.current = true;
    try {
      await api.post(`/formations/${formationId}/temps`, {
        duree_secondes: total,
      });
    } catch {
      // silencieux
    }
  };

  useEffect(() => {
    if (!formationId || !enabled) return;

    startTimeRef.current = Date.now();
    accumulatedRef.current = 0;
    sentRef.current = false;

    // Pause quand l'onglet est caché, reprend quand il revient
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Pause → accumuler
        const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
        accumulatedRef.current += elapsed;
      } else {
        // Reprise → remettre le compteur
        startTimeRef.current = Date.now();
      }
    };

    // Avant fermeture de page → sendBeacon si possible
    const handleBeforeUnload = () => {
      const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
      const total = accumulatedRef.current + elapsed;
      if (total < 5 || sentRef.current) return;
      sentRef.current = true;
      const payload = JSON.stringify({ duree_secondes: total });
      const token = localStorage.getItem("auth_token");
      // sendBeacon pour garantir l'envoi même si la page se ferme
      navigator.sendBeacon(
        `/api/formations/${formationId}/temps`,
        new Blob([payload], { type: "application/json" }),
      );
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Envoi à la navigation React (SPA)
      send();
    };
  }, [formationId, enabled]);
}
