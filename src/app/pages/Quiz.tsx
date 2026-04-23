// src/app/pages/Quiz.tsx — US 4.2 : Passer un quiz
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Trophy,
  Loader2,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getQuiz, passerQuiz } from "../services/quizService";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";
import axios from "axios";
import type {
  QuizApi,
  ResultatQuiz,
  ReponsePassee,
} from "../services/quizService";
import { toastQueue } from "../utils/toastQueue";

export const Quiz: React.FC = () => {
  const navigate = useNavigate();
  const { courseId, moduleId, quizId } = useParams<{
    courseId: string;
    moduleId: string;
    quizId: string;
  }>();
  const { currentUser } = useAuth();

  const [quiz, setQuiz] = useState<QuizApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Réponses en cours
  const [reponses, setReponses] = useState<
    Record<string, { choix_ids?: string[]; texte?: string }>
  >({});
  const [currentQ, setCurrentQ] = useState(0);

  // Timer
  const tempsRestantRef = useRef<number | null>(null);
  const [tempsRestant, setTempsRestant] = useState<number | null>(null);

  const [tempsEcoule, setTempsEcoule] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Résultats
  const [resultat, setResultat] = useState<ResultatQuiz | null>(null);
  const [showCorrections, setShowCorrections] = useState(false);

  // Charger le quiz
  useEffect(() => {
    if (!courseId || !moduleId) return;
    setLoading(true);
    getQuiz(courseId, moduleId)
      .then((q) => {
        setQuiz(q);
        if (q.duree_minutes) {
          const t = q.duree_minutes * 60;
          setTempsRestant(t);
          tempsRestantRef.current = t;
        }
      })
      .catch(() => {
        toast.error("Quiz introuvable");
        navigate(-1);
      })
      .finally(() => setLoading(false));
  }, [courseId, moduleId]);

  // Timer
  useEffect(() => {
    if (!quiz || resultat) return;
    timerRef.current = setInterval(() => {
      setTempsEcoule((t) => t + 1);
      if (tempsRestantRef.current !== null) {
        tempsRestantRef.current -= 1;
        setTempsRestant(tempsRestantRef.current);
        if (tempsRestantRef.current <= 0) {
          clearInterval(timerRef.current!);
          handleSubmit(true); // ✅ pas de closure stale
        }
      }
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quiz, resultat]);

  const formatTemps = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (!quiz) return null;

  // Quiz non disponible / limite atteinte
  if (!quiz.peut_repasser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-purple-950/30 flex items-center justify-center p-6">
        <Card className="max-w-md w-full bg-slate-900 border-slate-700">
          <CardContent className="p-8 text-center space-y-4">
            <AlertCircle className="w-16 h-16 text-orange-400 mx-auto" />
            <h2 className="text-xl font-bold text-white">
              Limite de tentatives atteinte
            </h2>
            <p className="text-slate-400">
              Vous avez utilisé toutes vos tentatives ({quiz.nb_tentatives_max}/
              {quiz.nb_tentatives_max}).
            </p>
            {quiz.meilleure_note !== undefined && (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                <p className="text-sm text-slate-400">Meilleur score</p>
                <p className="text-3xl font-bold text-purple-400">
                  {quiz.meilleure_note}
                </p>
              </div>
            )}
            <Button onClick={() => navigate(-1)} className="w-full gap-2">
              <ArrowLeft className="w-4 h-4" /> Retour à la formation
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const questions = quiz.questions;
  const totalQuestions = questions.length;
  const progress = ((currentQ + 1) / totalQuestions) * 100;

  // Répondre
  // Pour QCM : toggle multi-sélection | Pour vrai_faux : sélection unique
  const setReponse = (
    questionId: string,
    choixId?: string,
    texte?: string,
    isMulti: boolean = false,
  ) => {
    if (texte !== undefined) {
      setReponses((prev) => ({ ...prev, [questionId]: { texte } }));
      return;
    }
    if (!choixId) return;

    if (isMulti) {
      // ✅ Comportement checkbox : toggle
      setReponses((prev) => {
        const current = prev[questionId]?.choix_ids ?? [];
        const alreadySelected = current.includes(choixId);
        return {
          ...prev,
          [questionId]: {
            choix_ids: alreadySelected
              ? current.filter((id) => id !== choixId)
              : [...current, choixId],
          },
        };
      });
    } else {
      // Comportement radio : sélection unique (vrai_faux)
      setReponses((prev) => ({
        ...prev,
        [questionId]: { choix_ids: [choixId] },
      }));
    }
  };

  // Soumettre
  const handleSubmit = async (auto = false) => {
    if (!quiz) return; // ← sécurité
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const reponsesArray: ReponsePassee[] = quiz.questions.map((q) => {
        const rep = reponses[q.id!];
        const choixIds = rep?.choix_ids ?? [];
        return {
          question_id: q.id!,
          // ✅ Pour vrai_faux on envoie aussi choix_id (rétrocompat backend)
          choix_id: q.type === "vrai_faux" ? (choixIds[0] ?? null) : null,
          // ✅ Pour QCM on envoie le tableau
          choix_ids: q.type === "qcm" ? choixIds : null,
          reponse_texte: rep?.texte,
        };
      });
      const res = await passerQuiz(
        courseId!,
        moduleId!,
        quiz.id,
        reponsesArray,
        tempsEcoule,
      );
      setResultat(res);
      if ((res as any).nouveaux_badges?.length > 0) {
        (res as any).nouveaux_badges.forEach((badge: any) => {
          toastQueue.success(
            `Nouveau badge : ${badge.icone} ${badge.nom} !`,
            5000,
          );
        });
      }
      if (!auto) toast.success(res.reussi ? "Quiz réussi !" : "Quiz soumis");
      else toast.warning("Temps écoulé — quiz soumis automatiquement");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message || "Erreur lors de la soumission",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Écran résultats ───────────────────────────────────────
  if (resultat) {
    const pctColor =
      resultat.pourcentage >= resultat.seuil_reussite
        ? "text-green-400"
        : "text-red-400";
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950/20 p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-slate-400 hover:text-white gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Retour
          </Button>

          {/* Score principal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <Card className="bg-gradient-to-br from-slate-900 to-purple-900/20 border-purple-500/20">
              <CardContent className="p-8 text-center space-y-4">
                <div className={`text-7xl font-bold ${pctColor}`}>
                  {resultat.pourcentage}%
                </div>
                {/* Juste après le pourcentage, ajoute */}
                {resultat.reussi && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                    <p className="text-green-400 text-sm font-medium">
                      🎉 Seuil de réussite atteint : {resultat.seuil_reussite}%
                    </p>
                  </div>
                )}
                {!resultat.reussi && (
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
                    <p className="text-orange-400 text-sm font-medium">
                      Score insuffisant — Seuil requis :{" "}
                      {resultat.seuil_reussite}%
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-center gap-2">
                  {resultat.reussi ? (
                    <>
                      <CheckCircle className="w-6 h-6 text-green-400" />
                      <span className="text-green-400 font-semibold text-lg">
                        Quiz réussi !
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-6 h-6 text-red-400" />
                      <span className="text-red-400 font-semibold text-lg">
                        Quiz non réussi
                      </span>
                    </>
                  )}
                </div>
                <p className="text-slate-400">
                  Score : {resultat.score}/{resultat.score_max} points
                </p>
                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-1">
                      Bonnes réponses
                    </p>
                    <p className="text-2xl font-bold text-green-400">
                      {resultat.corrections.filter((c) => c.est_correct).length}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-1">
                      Mauvaises réponses
                    </p>
                    <p className="text-2xl font-bold text-red-400">
                      {
                        resultat.corrections.filter((c) => !c.est_correct)
                          .length
                      }
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-1">Tentative</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {resultat.nb_tentatives}/{quiz.nb_tentatives_max}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 flex-wrap justify-center">
                  {/* ✅ Voir corrections : plus de tentatives OU score 100% */}
                  {(!resultat.peut_repasser ||
                    resultat.pourcentage === 100) && (
                    <Button
                      variant="outline"
                      className="inline-flex items-center gap-1 px-3 py-1"
                      onClick={() => setShowCorrections(!showCorrections)}
                    >
                      {showCorrections ? "Masquer" : "Voir"} les corrections
                    </Button>
                  )}

                  {/* Réessayer — seulement si peut repasser ET quiz non réussi ET pas 100% */}
                  {resultat.peut_repasser &&
                    !resultat.reussi &&
                    resultat.pourcentage < 100 && (
                      <Button
                        className="flex-1 gap-2 bg-purple-600 hover:bg-purple-700"
                        onClick={() => {
                          setResultat(null);
                          setReponses({});
                          setCurrentQ(0);
                          setTempsEcoule(0);
                          const duree = quiz.duree_minutes ?? 0;
                          if (duree > 0) {
                            setTempsRestant(duree * 60);
                            tempsRestantRef.current = duree * 60;
                          } else {
                            setTempsRestant(null);
                            tempsRestantRef.current = null;
                          }
                        }}
                      >
                        <RotateCcw className="w-4 h-4" /> Réessayer
                      </Button>
                    )}

                  {/* Retour — toujours visible */}
                  <Button
                    className="inline-flex items-center gap-1 px-3 py-1"
                    onClick={() => navigate(-1)}
                  >
                    <ArrowLeft className="w-4 h-4" /> Terminer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Corrections */}
          <AnimatePresence>
            {showCorrections && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <h2 className="text-lg font-bold text-white">
                  Corrections détaillées
                </h2>
                {resultat.corrections.map((c, i) => (
                  <Card
                    key={c.question_id}
                    className={`border ${c.est_correct ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}
                  >
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start gap-3">
                        {c.est_correct ? (
                          <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-white">
                            Q{i + 1}. {c.texte}
                          </p>
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs text-slate-500">
                              {c.points} pt{c.points > 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                      {(c.type === "qcm" || c.type === "vrai_faux") && (
                        <div className="space-y-2 ml-8">
                          {c.tous_choix.map((ch) => {
                            const wasChosen =
                              String(ch.id) === String(c.choix_id_donne);
                            const isCorrect = c.bons_choix
                              .map(String)
                              .includes(String(ch.id));
                            return (
                              <div
                                key={ch.id}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                                  isCorrect
                                    ? "bg-green-500/10 border border-green-500/20 text-green-400"
                                    : wasChosen
                                      ? "bg-red-500/10 border border-red-500/20 text-red-400"
                                      : "text-slate-500"
                                }`}
                              >
                                <span className="w-4 h-4 shrink-0">
                                  {isCorrect ? "✓" : wasChosen ? "✗" : "○"}
                                </span>
                                {ch.texte}
                                {wasChosen && !isCorrect && (
                                  <span className="ml-auto text-xs">
                                    (votre réponse)
                                  </span>
                                )}
                                {isCorrect && (
                                  <span className="ml-auto text-xs">
                                    bonne réponse
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {c.type === "texte_libre" && (
                        <div className="ml-8 space-y-3">
                          {c.reponse_texte && (
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">
                                Votre réponse
                              </p>
                              <p className="text-sm text-slate-300 whitespace-pre-wrap">
                                {c.reponse_texte}
                              </p>
                            </div>
                          )}

                          {c.score_ia !== null && c.score_ia !== undefined && (
                            <div className="flex items-center gap-3">
                              <div className="flex-1 bg-white/5 rounded-lg h-2 overflow-hidden">
                                <div
                                  className={`h-full rounded-lg ${
                                    (c.score_ia ?? 0) >= 60
                                      ? "bg-green-500"
                                      : "bg-red-500"
                                  }`}
                                  style={{ width: `${c.score_ia ?? 0}%` }}
                                />
                              </div>
                              <span
                                className={`text-sm font-bold ${
                                  (c.score_ia ?? 0) >= 60
                                    ? "text-green-400"
                                    : "text-red-400"
                                }`}
                              >
                                {c.score_ia}%
                              </span>
                            </div>
                          )}

                          {c.feedback_ia && (
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 space-y-3">
                              <div className="flex items-center gap-2">
                                <span className="text-blue-400 text-xs font-semibold uppercase tracking-wide">
                                  Correction par IA
                                </span>
                              </div>

                              <p className="text-slate-300 text-sm">
                                {c.feedback_ia}
                              </p>

                              {c.points_forts && (
                                <div>
                                  <p className="text-xs text-green-400 font-medium mb-1">
                                    ✅ Points forts
                                  </p>
                                  <p className="text-sm text-slate-400">
                                    {c.points_forts}
                                  </p>
                                </div>
                              )}

                              {c.points_amelioration && (
                                <div>
                                  <p className="text-xs text-orange-400 font-medium mb-1">
                                    💡 À améliorer
                                  </p>
                                  <p className="text-sm text-slate-400">
                                    {c.points_amelioration}
                                  </p>
                                </div>
                              )}

                              {c.points_obtenus !== null &&
                                c.points_obtenus !== undefined && (
                                  <div className="pt-2 border-t border-white/10">
                                    <p className="text-xs text-slate-400">
                                      Points obtenus :{" "}
                                      <span className="text-white font-bold">
                                        {c.points_obtenus}/{c.points}
                                      </span>
                                    </p>
                                  </div>
                                )}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // ── Interface quiz ────────────────────────────────────────
  const q = questions[currentQ];
  const repCurrent = reponses[q.id!]; // choix_ids[] ou texte

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950/20">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => {
              if (confirm("Quitter le quiz ? Vos réponses seront perdues."))
                navigate(-1);
            }}
            className="text-slate-400 hover:text-white gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Quitter
          </Button>
          <div className="flex items-center gap-4">
            {tempsRestant !== null && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${tempsRestant < 60 ? "bg-red-500/20 text-red-400 animate-pulse" : "bg-white/5 text-slate-400"}`}
              >
                <Clock className="w-4 h-4" />
                <span className="font-mono font-bold">
                  {formatTemps(tempsRestant)}
                </span>
              </div>
            )}
            <span className="text-slate-400 text-sm">
              {currentQ + 1} / {totalQuestions}
            </span>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="space-y-1">
          <Progress value={progress} className="h-2 bg-white/10" />
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="bg-slate-900/80 border-white/10">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-white text-lg leading-relaxed">
                    {q.texte}
                  </CardTitle>
                  <Badge className="shrink-0 bg-purple-500/20 text-purple-300 border-purple-500/30">
                    {q.points} pt{q.points > 1 ? "s" : ""}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* QCM — Checkbox (multi-sélection) */}
                {q.type === "qcm" && (
                  <>
                    <p className="text-xs text-slate-500 mb-1">
                      💡 Plusieurs réponses peuvent être correctes
                    </p>
                    {q.choix.map((c) => {
                      const selected =
                        repCurrent?.choix_ids?.includes(String(c.id)) ?? false;
                      return (
                        <button
                          key={c.id}
                          onClick={() =>
                            setReponse(q.id!, String(c.id), undefined, true)
                          }
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                            selected
                              ? "border-purple-500 bg-purple-500/10 text-white"
                              : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"
                          }`}
                        >
                          {/* ✅ Carré = checkbox (multi) */}
                          <div
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                              selected
                                ? "border-purple-500 bg-purple-500"
                                : "border-slate-600"
                            }`}
                          >
                            {selected && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                          <span className="font-medium">{c.texte}</span>
                        </button>
                      );
                    })}
                  </>
                )}

                {/* Vrai/Faux — Radio (choix unique) */}
                {q.type === "vrai_faux" &&
                  q.choix.map((c) => {
                    const selected =
                      repCurrent?.choix_ids?.includes(String(c.id)) ?? false;
                    return (
                      <button
                        key={c.id}
                        onClick={() =>
                          setReponse(q.id!, String(c.id), undefined, false)
                        }
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                          selected
                            ? "border-purple-500 bg-purple-500/10 text-white"
                            : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"
                        }`}
                      >
                        {/* ✅ Rond = radio (unique) */}
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            selected
                              ? "border-purple-500 bg-purple-500"
                              : "border-slate-600"
                          }`}
                        >
                          {selected && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <span className="font-medium">{c.texte}</span>
                      </button>
                    );
                  })}

                {/* Texte libre */}
                {q.type === "texte_libre" && (
                  <Textarea
                    value={repCurrent?.texte ?? ""}
                    onChange={(e) =>
                      setReponse(q.id!, undefined, e.target.value)
                    }
                    placeholder="Saisissez votre réponse..."
                    rows={4}
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-purple-500"
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            className="gap-2 border-white/10 text-slate-300 hover:bg-white/5"
            onClick={() => setCurrentQ((q) => Math.max(0, q - 1))}
            disabled={currentQ === 0}
          >
            <ChevronLeft className="w-4 h-4" /> Précédent
          </Button>

          {/* Indicateurs de progression */}
          <div className="flex gap-1.5">
            {questions.map((qq, i) => (
              <button
                key={i}
                onClick={() => setCurrentQ(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === currentQ
                    ? "bg-purple-500 scale-125"
                    : (reponses[qq.id!]?.choix_ids?.length ?? 0) > 0 ||
                        reponses[qq.id!]?.texte
                      ? "bg-purple-400/60"
                      : "bg-white/20"
                }`}
              />
            ))}
          </div>

          {currentQ < totalQuestions - 1 ? (
            <Button
              className="gap-2 bg-purple-600 hover:bg-purple-700"
              onClick={() => setCurrentQ((q) => q + 1)}
            >
              Suivant <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              className="gap-2 bg-green-600 hover:bg-green-700"
              onClick={() => handleSubmit(false)}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Soumission...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" /> Terminer
                </>
              )}
            </Button>
          )}
        </div>

        {/* Résumé des réponses */}
        <div className="text-center text-sm text-slate-500">
          {
            Object.entries(reponses).filter(
              ([, v]) =>
                (v.choix_ids && v.choix_ids.length > 0) ||
                (v.texte && v.texte.trim() !== ""),
            ).length
          }{" "}
          / {totalQuestions} questions répondues
        </div>
      </div>
    </div>
  );
};
