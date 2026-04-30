import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Star, X, Send, Loader2 } from "lucide-react";
import api from "../services/api";
import { toast } from "sonner";

interface Props {
  open: boolean;
  formationId: string;
  formationTitre: string;
  onClose: () => void; // fermer sans soumettre
  onSubmitted: () => void; // après soumission → aller au quiz
}

export const FeedbackModal: React.FC<Props> = ({
  open,
  formationId,
  formationTitre,
  onClose,
  onSubmitted,
}) => {
  const [note, setNote] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [commentaire, setCommentaire] = useState("");
  const [loading, setLoading] = useState(false);

  const labels = [
    "",
    "Très mauvais",
    "Mauvais",
    "Passable",
    "Bien",
    "Très bien",
    "Excellent",
  ];
  const colors = [
    "",
    "text-red-400",
    "text-orange-400",
    "text-yellow-400",
    "text-blue-400",
    "text-green-400",
    "text-emerald-400",
  ];

  const handleSubmit = async () => {
    if (note === 0) {
      toast.error("Choisissez une note avant de continuer");
      return;
    }
    setLoading(true);
    try {
      await api.post(`/formations/${formationId}/feedbacks`, {
        note,
        commentaire,
      });
      toast.success("Merci pour votre feedback !");
      onSubmitted();
    } catch {
      toast.error("Erreur lors de l'envoi du feedback");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900
                       rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-700 p-7"
          >
            {/* Fermer */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700
                         dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div
                className="w-14 h-14 rounded-2xl bg-yellow-100 dark:bg-yellow-900/30
                              flex items-center justify-center mx-auto mb-3"
              >
                <Star className="w-7 h-7 text-yellow-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                Votre avis compte !
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Évaluez la formation{" "}
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {formationTitre}
                </span>
              </p>
            </div>

            {/* Étoiles */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3 text-center">
                Votre note (1 à 6 étoiles)
              </p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <button
                    key={i}
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => setNote(i)}
                    className="transition-all duration-150 hover:scale-110"
                  >
                    <Star
                      className={`w-9 h-9 transition-colors ${
                        i <= (hovered || note)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300 dark:text-slate-600"
                      }`}
                    />
                  </button>
                ))}
              </div>
              {(hovered || note) > 0 && (
                <p
                  className={`text-center text-sm font-semibold mt-2 ${colors[hovered || note]}`}
                >
                  {labels[hovered || note]}
                </p>
              )}
            </div>

            {/* Commentaire */}
            <div className="mb-5">
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300 block mb-1.5">
                Commentaire{" "}
                <span className="text-gray-400 font-normal">(optionnel)</span>
              </label>
              <textarea
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                placeholder="Partagez votre expérience avec cette formation..."
                rows={3}
                maxLength={500}
                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700
                           rounded-xl px-3 py-2 text-sm text-gray-800 dark:text-white
                           placeholder-gray-400 focus:outline-none focus:border-blue-500
                           resize-none transition-colors"
              />
              <p className="text-xs text-gray-400 text-right mt-0.5">
                {commentaire.length}/500
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700
                           text-sm font-medium text-gray-600 dark:text-slate-400
                           hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                Passer
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || note === 0}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600
                           text-sm font-semibold text-white disabled:opacity-40
                           hover:from-blue-700 hover:to-indigo-700 transition-all
                           flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Envoyer & Continuer
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
