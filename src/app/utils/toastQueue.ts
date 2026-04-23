// src/app/utils/toastQueue.ts
// File d'attente globale pour les toasts — affichage séquentiel
import { toast } from "sonner";

let queue: Array<{
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
}> = [];
let isProcessing = false;

function processQueue() {
  if (isProcessing || queue.length === 0) return;

  isProcessing = true;
  const item = queue.shift()!;

  switch (item.type) {
    case "success":
      toast.success(item.message, { duration: item.duration ?? 4000 });
      break;
    case "error":
      toast.error(item.message, { duration: item.duration ?? 4000 });
      break;
    case "warning":
      toast.warning(item.message, { duration: item.duration ?? 4000 });
      break;
    default:
      toast.info(item.message, { duration: item.duration ?? 4000 });
      break;
  }

  // Attendre la durée + 500ms avant le suivant
  setTimeout(
    () => {
      isProcessing = false;
      processQueue();
    },
    (item.duration ?? 4000) + 500,
  );
}

export const toastQueue = {
  success: (msg: string, duration = 4000) => {
    queue.push({ message: msg, type: "success", duration });
    processQueue();
  },
  error: (msg: string, duration = 4000) => {
    queue.push({ message: msg, type: "error", duration });
    processQueue();
  },
  warning: (msg: string, duration = 4000) => {
    queue.push({ message: msg, type: "warning", duration });
    processQueue();
  },
  info: (msg: string, duration = 4000) => {
    queue.push({ message: msg, type: "info", duration });
    processQueue();
  },
};
