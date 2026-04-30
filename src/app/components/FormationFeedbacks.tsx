import React, { useEffect, useState } from "react";
import {
  Star,
  Loader2,
  MessageSquare,
  Edit2,
  Trash2,
  X,
  Check,
} from "lucide-react";
import api from "../services/api";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

interface FeedbackItem {
  id: number;
  note: number;
  commentaire?: string;
  created_at: string;
  user: { nom: string; avatar?: string; initiale: string };
}

interface Props {
  formationId: string;
  onRefresh?: () => void;
}

export const FormationFeedbacks: React.FC<Props> = ({
  formationId,
  onRefresh,
}) => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [moyenne, setMoyenne] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  // États pour l'édition
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNote, setEditNote] = useState(0);
  const [editCommentaire, setEditCommentaire] = useState("");
  const [editHovered, setEditHovered] = useState(0);

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/formations/${formationId}/feedbacks`);
      setFeedbacks(res.data.feedbacks ?? []);
      setMoyenne(res.data.moyenne);
      setTotal(res.data.total ?? 0);
    } catch (error) {
      console.error("Erreur chargement feedbacks:", error);
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
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleEdit = (feedback: FeedbackItem) => {
    setEditingId(feedback.id);
    setEditNote(feedback.note);
    setEditCommentaire(feedback.commentaire || "");
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    try {
      await api.put(`/feedbacks/${editingId}`, {
        note: editNote,
        commentaire: editCommentaire,
      });
      toast.success("Commentaire modifié");
      setEditingId(null);
      loadFeedbacks();
      onRefresh?.();
    } catch (error) {
      toast.error("Erreur lors de la modification");
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditNote(0);
    setEditCommentaire("");
  };

  const renderStars = (
    note: number,
    size = "w-4 h-4",
    interactive = false,
    onStarClick?: (i: number) => void,
  ) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => interactive && onStarClick?.(i)}
          onMouseEnter={() => interactive && setEditHovered(i)}
          onMouseLeave={() => interactive && setEditHovered(0)}
          className={interactive ? "cursor-pointer" : "cursor-default"}
        >
          <Star
            className={`${size} ${
              i <= (interactive ? editHovered || editNote : note)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300 dark:text-slate-600"
            }`}
          />
        </button>
      ))}
    </div>
  );

  if (loading)
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      </div>
    );

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
                {editingId === fb.id ? (
                  // Mode édition
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                          {fb.user.initiale}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {fb.user.nom}
                          </p>
                          <p className="text-xs text-slate-500">
                            {fb.created_at}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={handleSaveEdit}
                          className="p-1 text-green-400 hover:bg-green-500/10 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1 text-red-400 hover:bg-red-500/10 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      {renderStars(editNote, "w-4 h-4", true, (i) =>
                        setEditNote(i),
                      )}
                    </div>
                    <textarea
                      value={editCommentaire}
                      onChange={(e) => setEditCommentaire(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                    />
                  </div>
                ) : (
                  // Mode affichage normal
                  <>
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
                          <p className="text-xs text-slate-500">
                            {fb.created_at}
                          </p>
                        </div>
                      </div>
                      {/* Actions admin */}
                      {currentUser?.role === "admin" && (
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => handleEdit(fb)}
                            className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(fb.id)}
                            className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      {renderStars(fb.note, "w-3.5 h-3.5")}
                    </div>
                    {fb.commentaire && (
                      <p className="text-sm text-slate-300 leading-relaxed border-t border-white/5 pt-2">
                        {fb.commentaire}
                      </p>
                    )}
                  </>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
