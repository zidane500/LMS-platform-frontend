import { useState, useCallback } from "react";

const STORAGE_KEY = "lms_unlocked_formations";

function readFromStorage(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function useUnlockedFormations() {
  const [ids, setIds] = useState<string[]>(readFromStorage);

  const markUnlocked = useCallback((formationId: string | number) => {
    const sid = String(formationId);
    setIds((prev) => {
      if (prev.includes(sid)) return prev;
      const next = [...prev, sid];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const checkUnlocked = useCallback(
    (formationId: string | number): boolean =>
      ids.includes(String(formationId)),
    [ids],
  );

  return { markUnlocked, checkUnlocked };
}
