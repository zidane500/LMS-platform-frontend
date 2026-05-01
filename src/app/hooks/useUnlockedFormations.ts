import { useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

const STORAGE_KEY_PREFIX = "lms_unlocked_formations_";

function getKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

function readFromStorage(userId: string): string[] {
  if (!userId) return [];
  try {
    return JSON.parse(localStorage.getItem(getKey(userId)) ?? "[]");
  } catch {
    return [];
  }
}

export function useUnlockedFormations() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id ?? "";

  const [ids, setIds] = useState<string[]>(() => readFromStorage(userId));

  const markUnlocked = useCallback(
    (formationId: string | number) => {
      if (!userId) return;
      const sid = String(formationId);
      setIds((prev) => {
        if (prev.includes(sid)) return prev;
        const next = [...prev, sid];
        localStorage.setItem(getKey(userId), JSON.stringify(next));
        return next;
      });
    },
    [userId],
  );

  const checkUnlocked = useCallback(
    (formationId: string | number): boolean => {
      if (!userId) return false;
      // ✅ Toujours relire depuis localStorage pour être à jour
      const stored = readFromStorage(userId);
      return stored.includes(String(formationId));
    },
    [userId],
  );

  return { markUnlocked, checkUnlocked };
}
