// src/app/hooks/useTimeTracking.ts
import { useEffect, useRef } from "react";
import api from "../services/api";

export function useTimeTracking(
  formationId: string | undefined,
  enabled: boolean = true,
) {
  const startTimeRef = useRef<number>(Date.now());
  const accumulatedRef = useRef<number>(0);
  const sentRef = useRef<boolean>(false);
  const pausedRef = useRef<boolean>(false);

  const sendViaApi = async (total: number) => {
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
    pausedRef.current = false;

    const getElapsed = () =>
      pausedRef.current
        ? 0
        : Math.round((Date.now() - startTimeRef.current) / 1000);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (!pausedRef.current) {
          accumulatedRef.current += getElapsed();
          pausedRef.current = true;
        }
      } else {
        if (pausedRef.current) {
          startTimeRef.current = Date.now();
          pausedRef.current = false;
        }
      }
    };

    // ✅ keepalive fetch — supporte les headers auth contrairement à sendBeacon
    const handleBeforeUnload = () => {
      if (sentRef.current) return;
      const total = accumulatedRef.current + getElapsed();
      if (total < 5) return;
      sentRef.current = true;
      const token = localStorage.getItem("auth_token") ?? "";
      fetch(
        `${import.meta.env.VITE_API_URL ?? "http://localhost:8000"}/api/formations/${formationId}/temps`,
        {
          method: "POST",
          keepalive: true, // ✅ envoi garanti même si page se ferme
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          body: JSON.stringify({ duree_secondes: total }),
        },
      ).catch(() => {});
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // ✅ Envoi lors de la navigation React (SPA)
      if (!sentRef.current) {
        const total = accumulatedRef.current + getElapsed();
        if (total >= 5) {
          sentRef.current = true;
          sendViaApi(total);
        }
      }
    };
  }, [formationId, enabled]);
}
