import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Flag, X, Send, Loader2, Paperclip, Image, Film } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";
import api from "../services/api";

export const ReportWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [resume, setResume] = useState(""); // ✅ NOUVEAU — Résumé 100 chars
  const [message, setMessage] = useState("");
  const [fichiers, setFichiers] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (fichiers.length + selected.length > 5) {
      toast.error("Maximum 5 fichiers");
      return;
    }
    setFichiers((prev) => [...prev, ...selected]);
    e.target.value = "";
  };

  const removeFile = (i: number) =>
    setFichiers((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!resume.trim()) {
      toast.error("Le résumé est obligatoire");
      return;
    }
    if (!message.trim()) {
      toast.error("La description est obligatoire");
      return;
    }
    setSending(true);
    try {
      const fd = new FormData();
      fd.append("resume", resume);
      fd.append("message", message);
      fichiers.forEach((f) => fd.append("fichiers[]", f));

      await api.post("/reports", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Signalement envoyé !");
      setResume("");
      setMessage("");
      setFichiers([]);
      setOpen(false);
    } catch {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  const getFileIcon = (f: File) =>
    f.type.startsWith("video/") ? (
      <Film className="w-3.5 h-3.5 text-blue-500" />
    ) : (
      <Image className="w-3.5 h-3.5 text-green-500" />
    );

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
        title="Signaler un problème"
      >
        <Flag className="w-5 h-5" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30">
                <div className="flex items-center gap-2">
                  <Flag className="w-5 h-5 text-red-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Signaler un problème
                  </h3>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                {/* ✅ Champ Résumé — nouveau, obligatoire, 100 chars max */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Résumé <span className="text-red-500">*</span>
                    </label>
                    <span
                      className={`text-xs ${resume.length > 90 ? "text-orange-400" : "text-gray-400"}`}
                    >
                      {resume.length}/100
                    </span>
                  </div>
                  <input
                    type="text"
                    value={resume}
                    onChange={(e) => {
                      if (e.target.value.length <= 100)
                        setResume(e.target.value);
                    }}
                    placeholder="Résumé court du problème..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400"
                  />
                </div>

                {/* Champ Description — obligatoire */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Décrivez le problème en détail..."
                    rows={4}
                    className="resize-none"
                  />
                </div>

                {/* Zone fichiers */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                  >
                    <Paperclip className="w-4 h-4" />
                    Joindre des photos / vidéos
                    <span className="text-xs text-gray-400">
                      ({fichiers.length}/5)
                    </span>
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleFiles}
                  />
                  {fichiers.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {fichiers.map((f, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 dark:bg-slate-800 rounded-lg text-xs text-gray-700 dark:text-gray-300 max-w-[160px]"
                        >
                          {getFileIcon(f)}
                          <span className="truncate">{f.name}</span>
                          <button
                            onClick={() => removeFile(i)}
                            className="text-gray-400 hover:text-red-500 shrink-0"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={sending || !resume.trim() || !message.trim()}
                  className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white gap-2"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Envoi...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Envoyer le signalement
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
