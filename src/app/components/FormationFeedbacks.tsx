import React, { useEffect, useState } from "react";
import { Star, Loader2, MessageSquare, Trash2 } from "lucide-react";
import api from "../services/api";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { useLocation } from "react-router";

interface FeedbackItem {
  id: number;
  note: number;
  commentaire?: string;
  created_at: string;
  user: { nom: string; avatar?: string; initiale: string };
  reponse_formateur?: string;
  repondu_le?: string;
}

interface Props {
  formationId: string;
  onRefresh?: () => void;
  isPublic?: boolean;
  canReply?: boolean;
}

export const FormationFeedbacks: React.FC<Props> = ({
  formationId,
  onRefresh,
  isPublic = false,
  canReply = false,
}) => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [moyenne, setMoyenne] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [savingReply, setSavingReply] = useState(false);

  const { currentUser } = useAuth();
  const location = useLocation();

  const isPublicPage = isPublic || location.pathname.startsWith("/formations");

  const loadFeedbacks = async () => {
    setLoading(true);

    try {
      const res = await api.get(`/formations/${formationId}/feedbacks`);
      setFeedbacks(res.data.feedbacks ?? []);
      setMoyenne(res.data.moyenne);
      setTotal(res.data.total ?? 0);
    } catch {
      console.error("Erreur chargement feedbacks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedbacks();
  }, [formationId]);

  const handleDelete = async (feedbackId: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce commentaire ?")) return;

    try {
      await api.delete(`/feedbacks/${feedbackId}`);
      toast.success("Commentaire supprimé");
      loadFeedbacks();
      onRefresh?.();
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const startReply = (fb: FeedbackItem) => {
    setReplyingId(fb.id);
    setReplyText(fb.reponse_formateur ?? "");
  };

  const cancelReply = () => {
    setReplyingId(null);
    setReplyText("");
  };

  const handleSaveReply = async (feedbackId: number) => {
    setSavingReply(true);

    try {
      await api.put(`/feedbacks/${feedbackId}/repondre`, {
        reponse: replyText.trim() || null,
      });

      toast.success(replyText.trim() ? "Réponse publiée" : "Réponse supprimée");
      setReplyingId(null);
      setReplyText("");
      loadFeedbacks();
      onRefresh?.();
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSavingReply(false);
    }
  };

  const renderStars = (note: number, size = "w-4 h-4") => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Star
          key={i}
          className={`${size} ${
            i <= note
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300 dark:text-slate-600"
          }`}
        />
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-yellow-400" />
            Avis des apprenants
            <span className="ml-2 text-sm font-normal text-slate-500">
              ({total} avis)
            </span>
          </h2>

          {moyenne !== null && (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-yellow-400">
                {moyenne.toFixed(1)}
              </span>
              <div>
                {renderStars(Math.round(moyenne), "w-4 h-4")}
                <p className="text-xs text-slate-500">/6 étoiles</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {total === 0 ? (
        <div className="text-center py-10 text-slate-500">
          <Star className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>Aucun avis pour le moment.</p>
          <p className="text-sm mt-1">Soyez le premier à donner votre avis !</p>
        </div>
      ) : (
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {feedbacks.map((fb, i) => (
              <motion.div
                key={fb.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shrink-0 overflow-hidden">
                      {fb.user.avatar ? (
                        <img
                          src={fb.user.avatar}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        fb.user.initiale
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {fb.user.nom}
                      </p>
                      <p className="text-xs text-slate-500">{fb.created_at}</p>
                    </div>
                  </div>

                  <div className="flex gap-1 shrink-0">
                    {/* Réponse formateur/admin — pas en page publique */}
                    {!isPublicPage && canReply && replyingId !== fb.id && (
                      <button
                        onClick={() => startReply(fb)}
                        className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors text-xs flex items-center gap-1"
                        title="Répondre"
                      >
                        💬
                        <span className="hidden sm:inline text-xs">
                          {fb.reponse_formateur
                            ? "Modifier réponse"
                            : "Répondre"}
                        </span>
                      </button>
                    )}

                    {/* Admin : supprimer seulement, pas modifier */}
                    {!isPublicPage && currentUser?.role === "admin" && (
                      <button
                        onClick={() => handleDelete(fb.id)}
                        className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  {renderStars(fb.note, "w-3.5 h-3.5")}
                </div>

                {fb.commentaire && (
                  <p className="text-sm text-slate-300 leading-relaxed border-t border-white/5 pt-2">
                    {fb.commentaire}
                  </p>
                )}

                {/* Formulaire de réponse */}
                {replyingId === fb.id && (
                  <div className="mt-2 border-t border-white/10 pt-3 space-y-2">
                    <p className="text-xs text-emerald-400 font-semibold">
                      Votre réponse :
                    </p>

                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={3}
                      placeholder="Écrivez votre réponse..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white resize-none"
                    />

                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={cancelReply}
                        className="px-3 py-1.5 text-xs text-slate-400 hover:text-white border border-white/10 rounded-lg transition"
                      >
                        Annuler
                      </button>

                      <button
                        onClick={() => handleSaveReply(fb.id)}
                        disabled={savingReply}
                        className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition disabled:opacity-50"
                      >
                        {savingReply ? "Sauvegarde..." : "Publier"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Réponse existante */}
                {fb.reponse_formateur && replyingId !== fb.id && (
                  <div className="mt-2 border-t border-emerald-500/20 pt-3 bg-emerald-500/5 rounded-lg px-3 py-2">
                    <p className="text-xs text-emerald-400 font-semibold mb-1 flex items-center gap-1">
                      💬 Réponse du formateur
                      {fb.repondu_le && (
                        <span className="text-slate-500 font-normal ml-1">
                          · {fb.repondu_le}
                        </span>
                      )}
                    </p>

                    <p className="text-sm text-slate-300 leading-relaxed">
                      {fb.reponse_formateur}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
