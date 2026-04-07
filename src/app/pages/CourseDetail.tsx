// src/app/pages/CourseDetail.tsx — US 3.2 complet : design moderne
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { getProgression } from "../services/progressionService";
import { getQuiz } from "../services/quizService";
import type { ProgressionFormation } from "../services/progressionService";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Users,
  ChevronDown,
  ChevronRight,
  Play,
  FileText,
  Music,
  Box,
  Video,
  Loader2,
  CheckCircle,
  Lock,
  BarChart3,
  Edit,
  Award,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getFormation, enrollFormation } from "../services/formationService";
import { getContenus, marquerConsulte } from "../services/contenuService";
import { ContentViewer } from "../components/ContentViewer";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { toast } from "sonner";

import axios from "axios";
import type { Course, Content, ContentType } from "../types";

// ── Icône contenu ─────────────────────────────────────────
const ContentIcon: React.FC<{ type: ContentType; className?: string }> = ({
  type,
  className = "w-4 h-4",
}) => {
  switch (type) {
    case "video":
      return <Video className={`${className} text-blue-400`} />;
    case "pdf":
      return <FileText className={`${className} text-red-400`} />;
    case "audio":
      return <Music className={`${className} text-green-400`} />;
    case "scorm":
      return <Box className={`${className} text-purple-400`} />;
    default:
      return <Play className={`${className} text-gray-400`} />;
  }
};

export const CourseDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id: courseId } = useParams<{ id: string }>();
  const { currentUser } = useAuth();

  const [course, setCourse] = useState<
    (Course & { isEnrolled?: boolean; statut?: string }) | null
  >(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  // Contenus
  const [moduleContenus, setModuleContenus] = useState<
    Record<string, (Content & { progression?: any })[]>
  >({});
  const [loadingContenus, setLoadingContenus] = useState<
    Record<string, boolean>
  >({});
  const [progressionData, setProgressionData] =
    useState<ProgressionFormation | null>(null);
  const [moduleQuizStatus, setModuleQuizStatus] = useState<
    Record<string, { quizId: string | null; termine: boolean }>
  >({});
  const [openModuleId, setOpenModuleId] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<{
    moduleId: string;
    content: Content & { progression?: any };
  } | null>(null);

  const chargerProgression = async (
    formationId: string,
  ): Promise<ProgressionFormation | null> => {
    if (!currentUser || currentUser.role !== "learner") return null;

    try {
      const data = await getProgression(formationId);
      setProgressionData(data);
      return data;
    } catch {
      setProgressionData(null);
      return null;
    }
  };
  const chargerStatutQuiz = async (
    formationId: string,
    moduleId: string,
    progression: ProgressionFormation | null,
  ) => {
    try {
      const quiz = await getQuiz(formationId, moduleId);

      const termine = (progression?.tentatives_quiz ?? []).some(
        (t) => String(t.quiz_id) === String(quiz.id),
      );

      setModuleQuizStatus((prev) => ({
        ...prev,
        [moduleId]: {
          quizId: quiz.id,
          termine,
        },
      }));
    } catch {
      setModuleQuizStatus((prev) => ({
        ...prev,
        [moduleId]: {
          quizId: null,
          termine: false,
        },
      }));
    }
  };
  // ── Chargement ───────────────────────────────────────────
  useEffect(() => {
    if (!courseId) return;
    setPageLoading(true);
    setModuleQuizStatus({});

    getFormation(courseId)
      .then(async (c) => {
        setCourse(c);
        const enrolled = (c as any).isEnrolled ?? false;
        setIsEnrolled(enrolled);

        if (currentUser?.role === "learner" && enrolled) {
          const progression = await chargerProgression(courseId);

          const modulesFormation = c.modules ?? [];
          const promises = modulesFormation.map(async (module) => {
            try {
              const data = await getContenus(courseId, module.id);
              setModuleContenus((prev) => ({ ...prev, [module.id]: data }));
            } catch {
              // silencieux
            }

            await chargerStatutQuiz(courseId, module.id, progression);
          });

          await Promise.all(promises);
        }
      })
      .catch(() => {
        toast.error("Formation introuvable");
        navigate("/app/courses");
      })
      .finally(() => setPageLoading(false));
  }, [courseId, currentUser]);

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
          <p className="text-slate-400">Chargement de la formation...</p>
        </div>
      </div>
    );
  }

  if (!course) return null;

  const isInstructorOrAdmin =
    currentUser?.role === "instructor" || currentUser?.role === "admin";
  const isOwner =
    isInstructorOrAdmin &&
    String((course as any).instructorId) === String(currentUser?.id);
  const canAccess = isInstructorOrAdmin || isEnrolled;
  const modules = course.modules ?? [];

  // ── Progression globale ───────────────────────────────────
  const getAllContenus = () => Object.values(moduleContenus).flat();

  const getTotalProgress = (): number => {
    if (progressionData) {
      return progressionData.pourcentage_global ?? 0;
    }

    const all = getAllContenus();
    if (all.length === 0) return 0;

    const done = all.filter((c) => c.progression?.complete).length;
    return Math.round((done / all.length) * 100);
  };

  const getModuleProgress = (moduleId: string): number => {
    if (progressionData?.modules?.length) {
      const moduleProgress = progressionData.modules.find(
        (m) => String(m.module_id) === String(moduleId),
      );

      if (moduleProgress) {
        return moduleProgress.pourcentage ?? 0;
      }
    }

    const c = moduleContenus[moduleId] || [];
    if (c.length === 0) return 0;

    return Math.round(
      (c.filter((x) => x.progression?.complete).length / c.length) * 100,
    );
  };

  // ── Inscription ───────────────────────────────────────────
  const handleEnroll = async () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    setEnrolling(true);
    try {
      await enrollFormation(courseId!);
      setIsEnrolled(true);
      toast.success("Inscription réussie ! Bonne formation !");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message || "";
        if (error.response?.status === 409) {
          setIsEnrolled(true); // déjà inscrit → mettre à jour l'état
          toast.info("Vous êtes déjà inscrit à cette formation");
        } else {
          toast.error(msg || "Erreur lors de l'inscription");
        }
      }
    } finally {
      setEnrolling(false);
    }
  };

  // ── Charger contenus d'un module ──────────────────────────
  const handleToggleModule = async (moduleId: string) => {
    if (openModuleId === moduleId) {
      setOpenModuleId(null);
      setSelectedContent(null);
      return;
    }
    setOpenModuleId(moduleId);
    setSelectedContent(null);

    if (courseId) {
      if (!moduleContenus[moduleId]) {
        setLoadingContenus((prev) => ({ ...prev, [moduleId]: true }));
        try {
          const data = await getContenus(courseId, moduleId);
          setModuleContenus((prev) => ({ ...prev, [moduleId]: data }));
        } catch {
          toast.error("Impossible de charger les contenus");
        } finally {
          setLoadingContenus((prev) => ({ ...prev, [moduleId]: false }));
        }
      }

      if (!moduleQuizStatus[moduleId]) {
        await chargerStatutQuiz(courseId, moduleId, progressionData);
      }
    }
  };

  // ── Sélectionner un contenu ───────────────────────────────
  const handleSelectContent = (
    moduleId: string,
    content: Content & { progression?: any },
  ) => {
    if (!canAccess) {
      toast.error("Inscrivez-vous pour accéder aux contenus");
      return;
    }
    setSelectedContent({ moduleId, content });
    // Scroll vers le lecteur
    setTimeout(
      () =>
        document
          .getElementById("content-viewer")
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      100,
    );
  };

  // ── Marquer terminé ───────────────────────────────────────
  const handleContentComplete = async (moduleId: string, contentId: string) => {
    setModuleContenus((prev) => ({
      ...prev,
      [moduleId]: (prev[moduleId] || []).map((c) =>
        c.id === contentId
          ? { ...c, progression: { complete: true, pourcentage: 100 } }
          : c,
      ),
    }));

    if (selectedContent?.content.id === contentId) {
      setSelectedContent((prev) =>
        prev
          ? {
              ...prev,
              content: {
                ...prev.content,
                progression: { complete: true, pourcentage: 100 },
              },
            }
          : null,
      );
    }

    if (courseId && currentUser?.role === "learner") {
      await chargerProgression(courseId);
    }
  };

  const totalProgress = getTotalProgress();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* ── Bouton retour ── */}
      <div className="max-w-6xl mx-auto px-6 pt-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/app/courses")}
          className="gap-2 text-slate-400 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4" /> Retour aux formations
        </Button>
      </div>

      {/* ══════════════════════════════════════════════════════
          HERO — miniature + infos + bouton inscription
      ══════════════════════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-6 pt-4 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/5"
        >
          {/* Image de fond */}
          <div className="relative h-56 md:h-64">
            {course.thumbnail ? (
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextElementSibling?.classList.remove(
                    "hidden",
                  );
                }}
              />
            ) : null}
            {/* Fallback si pas de miniature */}

            <div className="absolute inset-0 rounded-3xl p-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 animate-spin-slow">
              <div className="w-full h-full bg-slate-1000 rounded-3xl" />
            </div>

            {/* Contenu réel */}
            <div className="relative rounded-3xl overflow-hidden"></div>
            <div
              className={`${course.thumbnail ? "hidden" : "flex"} absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 items-center justify-center`}
            ></div>
            {/* Overlay dégradé */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />
          </div>

          {/* Contenu hero */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 backdrop-blur-sm">
                {course.category}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border ${
                  course.level === "Débutant"
                    ? "bg-green-500/20 text-green-300 border-green-500/30"
                    : course.level === "Intermédiaire"
                      ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                      : "bg-red-500/20 text-red-300 border-red-500/30"
                }`}
              >
                {course.level}
              </span>
            </div>

            {/* Titre */}
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">
              {course.title}
            </h1>

            {/* Infos rapides */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-5">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-400" />{" "}
                {course.estimatedDuration}h de contenu
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-400" /> {modules.length}{" "}
                module{modules.length > 1 ? "s" : ""}
              </span>
              {(course as any).instructor && (
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-400" />
                  {(course as any).instructor.firstName}{" "}
                  {(course as any).instructor.lastName}
                </span>
              )}
            </div>

            {/* ── Zone inscription + progression ── */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Bouton inscription / statut */}
              {currentUser?.role === "learner" ? (
                isEnrolled ? (
                  <div className="flex items-center gap-3">
                    {/* Bouton désactivé "Vous êtes inscrit" */}
                    <button
                      disabled
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-500/20 border border-green-500/40 text-green-400 font-semibold text-sm cursor-not-allowed"
                    >
                      <CheckCircle className="w-4 h-4" /> Vous êtes inscrit
                    </button>

                    {/* Progression totale */}
                    {currentUser?.role === "learner" && isEnrolled && (
                      <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2 backdrop-blur-sm">
                        <BarChart3 className="w-4 h-4 text-blue-400 shrink-0" />
                        <div className="min-w-[100px]">
                          <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>Progression</span>
                            <span className="text-blue-400 font-semibold">
                              {totalProgress}%
                            </span>
                          </div>
                          <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700"
                              style={{ width: `${totalProgress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {enrolling ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />{" "}
                        Inscription...
                      </>
                    ) : (
                      <>
                        <Award className="w-4 h-4" /> S'inscrire gratuitement
                      </>
                    )}
                  </button>
                )
              ) : isInstructorOrAdmin ? (
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm font-medium">
                    <BookOpen className="w-4 h-4" /> Accès formateur
                  </span>
                  {(isOwner || currentUser?.role === "admin") && (
                    <button
                      onClick={() => navigate(`/app/courses/edit/${courseId}`)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-sm font-medium transition-colors"
                    >
                      <Edit className="w-4 h-4" /> Modifier
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ══════════════════════════════════════════════════════
          CONTENU PRINCIPAL
      ══════════════════════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-6 pb-12 space-y-6">
        {/* Description */}
        {course.description && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-3">
                À propos de cette formation
              </h2>
              <p className="text-slate-400 leading-relaxed">
                {course.description}
              </p>
              {course.prerequisites?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-sm font-medium text-slate-300 mb-2">
                    Prérequis
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {course.prerequisites.map((p, i) => (
                      <span
                        key={i}
                        className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-1"
                      >
                        <CheckCircle className="w-3 h-3" /> {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Lecteur de contenu ── */}
        <AnimatePresence>
          {selectedContent && (
            <motion.div
              id="content-viewer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="bg-gradient-to-br from-blue-500/5 to-indigo-500/5 border border-blue-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-sm font-semibold text-blue-400">
                    Lecture en cours
                  </span>
                  <span className="text-sm text-slate-500">
                    — {selectedContent.content.title}
                  </span>
                </div>
                <ContentViewer
                  content={selectedContent.content}
                  formationId={courseId!}
                  moduleId={selectedContent.moduleId}
                  canAccess={canAccess}
                  isLearner={currentUser?.role === "learner"}
                  onComplete={() =>
                    handleContentComplete(
                      selectedContent.moduleId,
                      selectedContent.content.id,
                    )
                  }
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Modules & contenus ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                Contenu de la formation
                <span className="ml-auto text-sm font-normal text-slate-500">
                  {modules.length} module{modules.length > 1 ? "s" : ""}
                </span>
              </h2>
            </div>

            {modules.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                Aucun module disponible
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {[...modules]
                  .sort((a, b) => a.order - b.order)
                  .map((module, index) => {
                    const isOpen = openModuleId === module.id;
                    const contenus = moduleContenus[module.id] || [];
                    const isLoadingC = loadingContenus[module.id];
                    const quizStatus = moduleQuizStatus[module.id];
                    const modProg = getModuleProgress(module.id);

                    return (
                      <div key={module.id}>
                        {/* En-tête module */}
                        {/* En-tête module */}
                        <div className="w-full flex items-center gap-3 px-6 py-4 hover:bg-white/5 transition-colors">
                          <button
                            onClick={() => handleToggleModule(module.id)}
                            className="flex-1 min-w-0 flex items-center gap-4 text-left group"
                          >
                            {/* Numéro */}
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                                isOpen
                                  ? "bg-blue-600 text-white"
                                  : "bg-white/10 text-slate-400 group-hover:bg-white/15"
                              }`}
                            >
                              {index + 1}
                            </div>

                            {/* Titre + description */}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white">
                                {module.title}
                              </p>
                              {module.description && (
                                <p className="text-xs text-slate-500 truncate mt-0.5">
                                  {module.description}
                                </p>
                              )}
                            </div>

                            {/* Progression + durée + chevron */}
                            <div className="flex items-center gap-3 shrink-0">
                              {currentUser?.role === "learner" &&
                                isEnrolled && (
                                  <div className="hidden sm:flex items-center gap-2">
                                    <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-blue-500 rounded-full"
                                        style={{ width: `${modProg}%` }}
                                      />
                                    </div>
                                    <span className="text-xs text-slate-500">
                                      {modProg}%
                                    </span>
                                  </div>
                                )}

                              {module.duration > 0 && (
                                <span className="text-xs text-slate-500 hidden sm:block">
                                  {module.duration} min
                                </span>
                              )}

                              <div
                                className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                              >
                                <ChevronDown className="w-4 h-4 text-slate-500" />
                              </div>
                            </div>
                          </button>

                          {canAccess && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(
                                  `/app/courses/${courseId}/modules/${module.id}/quiz/${quizStatus?.quizId ?? "0"}`,
                                );
                              }}
                              className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                                quizStatus?.termine
                                  ? "text-green-400 border-green-500/20 bg-green-500/5 hover:bg-green-500/10"
                                  : "text-purple-400 border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10"
                              }`}
                            >
                              {quizStatus?.termine ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                <Award className="w-4 h-4" />
                              )}
                              {quizStatus?.termine
                                ? "Quiz terminé"
                                : "Passer le quiz"}
                            </button>
                          )}
                        </div>

                        {/* Liste des contenus */}
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden bg-black/20"
                            >
                              {isLoadingC ? (
                                <div className="flex justify-center py-8">
                                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                                </div>
                              ) : contenus.length === 0 ? (
                                <p className="text-center text-sm text-slate-600 py-6">
                                  Aucun contenu dans ce module
                                </p>
                              ) : (
                                <div className="py-2">
                                  {contenus.map((c, ci) => {
                                    const isSelected =
                                      selectedContent?.content.id === c.id;
                                    const isDone = c.progression?.complete;
                                    return (
                                      <motion.div
                                        key={c.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: ci * 0.05 }}
                                        className={`w-full transition-all ${
                                          isSelected
                                            ? "bg-blue-500/10 border-l-2 border-blue-500"
                                            : "hover:bg-white/5 border-l-2 border-transparent"
                                        } ${!canAccess ? "opacity-50" : ""}`}
                                      >
                                        <div
                                          onClick={() =>
                                            handleSelectContent(module.id, c)
                                          }
                                          className={`w-full flex items-center gap-3 px-6 py-3 text-left ${
                                            !canAccess
                                              ? "cursor-not-allowed"
                                              : "cursor-pointer"
                                          }`}
                                        >
                                          {/* Icône état */}
                                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white/5">
                                            {!canAccess ? (
                                              <Lock className="w-3.5 h-3.5 text-slate-600" />
                                            ) : (
                                              <ContentIcon
                                                type={c.type}
                                                className={`w-3.5 h-3.5 ${isDone ? "opacity-90" : ""}`}
                                              />
                                            )}
                                          </div>
                                          {/* Infos */}
                                          <div className="flex-1 min-w-0">
                                            <p
                                              className={`text-sm font-medium truncate ${
                                                isSelected
                                                  ? "text-blue-400"
                                                  : isDone
                                                    ? "text-slate-500"
                                                    : "text-slate-300"
                                              }`}
                                            >
                                              {c.title}
                                            </p>
                                            {c.summary && (
                                              <p className="text-xs text-slate-600 truncate">
                                                {c.summary}
                                              </p>
                                            )}
                                          </div>
                                          {/* Badges */}
                                          <div className="flex items-center gap-2 shrink-0">
                                            {c.duration > 0 && (
                                              <span className="text-xs text-slate-600">
                                                {c.duration} min
                                              </span>
                                            )}
                                            {isDone && (
                                              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                                                ✓ Terminé
                                              </span>
                                            )}
                                            {isSelected && !isDone && (
                                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                En cours
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </motion.div>
                                    );
                                  })}
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Message inscription si apprenant non inscrit */}
        {currentUser?.role === "learner" && !isEnrolled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center py-6"
          >
            <div className="inline-flex flex-col items-center gap-3 px-8 py-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20">
              <Lock className="w-10 h-10 text-blue-500" />
              <p className="text-white font-semibold">
                Inscrivez-vous pour accéder aux contenus
              </p>
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all"
              >
                {enrolling ? "Inscription..." : "S'inscrire gratuitement"}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
