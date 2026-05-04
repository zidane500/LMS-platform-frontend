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
  Play,
  FileText,
  Music,
  Box,
  Video,
  Loader2,
  CheckCircle,
  Lock,
  Edit,
  Award,
  Star,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getFormation, enrollFormation } from "../services/formationService";
import { getContenus } from "../services/contenuService";
import { ContentViewer } from "../components/ContentViewer";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import axios from "axios";
import type { Course, Content, ContentType } from "../types";
import { CodedFormationLock } from "../components/CodedFormationLock";
import { verifierAccesFormation } from "../services/formationService";
import { useTimeTracking } from "../hooks/useTimeTracking";
import { CourseChat } from "../components/CourseChat";
import { FeedbackModal } from "../components/FeedbackModal";
import { FormationFeedbacks } from "../components/FormationFeedbacks";
import { useUnlockedFormations } from "../hooks/useUnlockedFormations";
import api from "../services/api";

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
  const { markUnlocked } = useUnlockedFormations();

  const [chatOpen, setChatOpen] = useState(false);

  const [course, setCourse] = useState<
    (Course & { isEnrolled?: boolean }) | null
  >(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isCoded, setIsCoded] = useState(false);
  const [aAcces, setAAcces] = useState(true);
  const [checkingAcces, setCheckingAcces] = useState(true);

  const [moduleContenus, setModuleContenus] = useState<
    Record<string, (Content & { progression?: any })[]>
  >({});
  const [loadingContenus, setLoadingContenus] = useState<
    Record<string, boolean>
  >({});
  const [progressionData, setProgressionData] =
    useState<ProgressionFormation | null>(null);

  // ✅ Correction : syntaxe correcte pour useState avec Record
  const [moduleQuizStatus, setModuleQuizStatus] = useState<
    Record<string, { quizId: string | null; termine: boolean }>
  >({});

  const [openModuleId, setOpenModuleId] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<{
    moduleId: string;
    content: Content & { progression?: any };
  } | null>(null);

  // ── Feedback ──────────────────────────────────────────────
  // ✅ Correction : séparer les states
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [pendingQuizNav, setPendingQuizNav] = useState<string | null>(null);
  const [monFeedback, setMonFeedback] = useState<any>(null);
  const [feedbackRefresh, setFeedbackRefresh] = useState(0);

  // ── Rôles ─────────────────────────────────────────────────
  const isInstructorOrAdmin =
    currentUser?.role === "instructor" || currentUser?.role === "admin";
  const isOwnerInstructor =
    isInstructorOrAdmin &&
    String((course as any)?.instructorId) === String(currentUser?.id);
  const canAccessForTracking =
    isOwnerInstructor || currentUser?.role === "admin" || isEnrolled;

  useTimeTracking(courseId ?? "", Boolean(courseId && canAccessForTracking));

  // ── Charger mon feedback ──────────────────────────────────
  useEffect(() => {
    if (!courseId || !currentUser) return;
    api
      .get(`/formations/${courseId}/feedbacks/mon-feedback`)
      .then((res) => {
        console.log("📥 Feedback chargé:", res.data);
        setMonFeedback(res.data);
      })
      .catch(() => {});
  }, [courseId, currentUser, feedbackRefresh]);

  // ── Progression ───────────────────────────────────────────
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
      const nbTentatives = (progression?.tentatives_quiz ?? []).filter(
        (t) => String(t.quiz_id) === String(quiz.id),
      ).length;
      const toutesEpuisees = nbTentatives >= quiz.nb_tentatives_max;
      setModuleQuizStatus((prev) => ({
        ...prev,
        [moduleId]: { quizId: quiz.id, termine: toutesEpuisees },
      }));
    } catch {
      setModuleQuizStatus((prev) => ({
        ...prev,
        [moduleId]: { quizId: null, termine: false },
      }));
    }
  };

  // ── Chargement ────────────────────────────────────────────
  useEffect(() => {
    if (!courseId) return;
    setPageLoading(true);
    setModuleQuizStatus({});

    getFormation(courseId)
      .then(async (c) => {
        setCourse(c);
        const enrolled = (c as any).isEnrolled ?? false;
        setIsEnrolled(enrolled);

        if (
          (currentUser?.role === "learner" ||
            currentUser?.role === "instructor") &&
          enrolled
        ) {
          const progression = await chargerProgression(courseId);
          const mods = c.modules ?? [];
          await Promise.all(
            mods.map(async (module) => {
              try {
                const data = await getContenus(courseId, module.id);
                setModuleContenus((prev) => ({ ...prev, [module.id]: data }));
              } catch {}
              await chargerStatutQuiz(courseId, module.id, progression);
            }),
          );
        }
      })
      .catch(() => {
        toast.error("Formation introuvable");
        navigate("/app/courses");
      })
      .finally(() => setPageLoading(false));
  }, [courseId, currentUser]);

  useEffect(() => {
    if (!courseId || !currentUser) return;
    if (currentUser.role === "admin") {
      setIsCoded(false);
      setAAcces(true);
      setCheckingAcces(false);
      return;
    }
    verifierAccesFormation(courseId)
      .then((data) => {
        setIsCoded(data.is_coded);
        const estProp = (data as any).est_proprietaire === true;
        const hasAcces = data.a_acces || estProp;
        setAAcces(hasAcces);
        if (hasAcces && data.is_coded) markUnlocked(courseId); // ✅ Fix 2
      })
      .catch(() => setAAcces(true))
      .finally(() => setCheckingAcces(false));
  }, [courseId, currentUser]);

  // ── Progression helpers ───────────────────────────────────
  const getModuleProgress = (moduleId: string): number => {
    if (progressionData?.modules?.length) {
      const mp = progressionData.modules.find(
        (m) => String(m.module_id) === String(moduleId),
      );
      if (mp) return mp.pourcentage ?? 0;
    }
    const c = moduleContenus[moduleId] || [];
    if (c.length === 0) return 0;
    return Math.round(
      (c.filter((x) => x.progression?.complete).length / c.length) * 100,
    );
  };

  const getTotalProgress = (): number => {
    if (progressionData) return progressionData.pourcentage_global ?? 0;
    const all = Object.values(moduleContenus).flat();
    if (all.length === 0) return 0;
    return Math.round(
      (all.filter((c) => c.progression?.complete).length / all.length) * 100,
    );
  };

  // ── Fix 3 — Vérifier si un module est complet (contenus + quiz réussi) ──
  const isModuleComplete = (moduleId: string): boolean => {
    const progress = getModuleProgress(moduleId);
    if (progress < 100) return false;

    const quizStatus = moduleQuizStatus[moduleId];
    if (!quizStatus?.quizId) return true; // pas de quiz = seulement contenus

    // Vérifier qu'au moins une tentative est réussie
    const tentatives = progressionData?.tentatives_quiz ?? [];
    const quizTentatives = tentatives.filter(
      (t: any) => String(t.quiz_id) === String(quizStatus.quizId),
    );
    return quizTentatives.some((t: any) => t.reussi === true);
  };

  // ── Fix 3 — Vérifier si un module est accessible ─────────
  const modules = course?.modules ?? [];
  const sortedModules = [...modules].sort((a, b) => a.order - b.order);

  const isModuleUnlocked = (index: number): boolean => {
    if (!canAccess) return false;

    // ✅ Admin → accès total à tous les modules
    if (currentUser?.role === "admin") return true;

    // ✅ Créateur de la formation (propriétaire) → accès total
    if (isOwnerInstructor) return true;

    // Premier module toujours accessible
    if (index === 0) return true;

    // Module N accessible si module N-1 est complet (pour les apprenants)
    const prevModule = sortedModules[index - 1];
    return isModuleComplete(prevModule.id);
  };

  // ── Dernier module ────────────────────────────────────────
  const lastModuleId = sortedModules[sortedModules.length - 1]?.id ?? null;

  // ── Fix 3 — Click sur le bouton quiz ─────────────────────
  const handleQuizClick = (
    e: React.MouseEvent,
    moduleId: string,
    quizId: string | null,
    moduleIndex: number,
  ) => {
    e.stopPropagation();

    // Vérifier que le module est accessible (module précédent complété)
    if (!isModuleUnlocked(moduleIndex)) {
      const prevModule = sortedModules[moduleIndex - 1];
      toast.error(
        `Terminez d'abord le module "${prevModule?.title ?? "précédent"}" et son quiz.`,
      );
      return;
    }

    // Vérifier que tous les contenus du module sont terminés à 100%
    const moduleProgress = getModuleProgress(moduleId);
    if (moduleProgress < 100) {
      const contenusRestants = (moduleContenus[moduleId] || []).filter(
        (c) => !c.progression?.complete,
      ).length;
      toast.warning(
        `📚 Terminez tous les contenus du module avant d'accéder au quiz.\n${contenusRestants} contenu(s) restant(s).`,
        { duration: 4000 },
      );
      return;
    }

    const target = `/app/courses/${courseId}/modules/${moduleId}/quiz/${quizId ?? "0"}`;
    const isLastModule = moduleId === lastModuleId;
    const isStudying =
      currentUser?.role === "learner" ||
      (currentUser?.role === "instructor" && isEnrolled && !isOwnerInstructor);

    // ✅ Vérifie si l'utilisateur a déjà donné un feedback
    const alreadyHasFeedback = !!(monFeedback && monFeedback.note);

    if (isLastModule && isStudying && !alreadyHasFeedback && canAccess) {
      setPendingQuizNav(target);
      setShowFeedbackModal(true);
    } else {
      navigate(target);
    }
  };

  // ── Chargement module ─────────────────────────────────────
  const handleToggleModule = async (moduleId: string, moduleIndex: number) => {
    // Fix 3 — Vérifier accès
    if (!isModuleUnlocked(moduleIndex) && canAccess) {
      const prevModule = sortedModules[moduleIndex - 1];
      toast.error(
        `Terminez le module "${prevModule?.title ?? "précédent"}" et son quiz pour accéder à celui-ci.`,
      );
      return;
    }

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

  const handleSelectContent = (
    moduleId: string,
    content: Content & { progression?: any },
  ) => {
    // ✅ Admin ou créateur peuvent voir tous les contenus sans vérification
    if (currentUser?.role === "admin" || isOwnerInstructor) {
      setSelectedContent({ moduleId, content });
      setTimeout(
        () =>
          document
            .getElementById("content-viewer")
            ?.scrollIntoView({ behavior: "smooth", block: "start" }),
        100,
      );
      return;
    }

    // Pour les apprenants : vérifier l'inscription
    if (!canAccess) {
      toast.error("Inscrivez-vous pour accéder aux contenus");
      return;
    }

    setSelectedContent({ moduleId, content });
    setTimeout(
      () =>
        document
          .getElementById("content-viewer")
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      100,
    );
  };

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

  const handleEnroll = async () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    setEnrolling(true);
    try {
      await enrollFormation(courseId!);
      setIsEnrolled(true);
      toast.success("Inscription réussie !");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 409) {
          setIsEnrolled(true);
          toast.info("Vous êtes déjà inscrit");
        } else toast.error(error.response?.data?.message || "Erreur");
      }
    } finally {
      setEnrolling(false);
    }
  };

  // ── Guards ────────────────────────────────────────────────
  if (pageLoading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
          <p className="text-slate-400">Chargement de la formation...</p>
        </div>
      </div>
    );

  if (checkingAcces)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );

  if (isCoded && !aAcces)
    return (
      <CodedFormationLock
        formationId={courseId!}
        formationTitre={course?.title ?? ""}
        onAccesAccorde={() => {
          setAAcces(true);
          markUnlocked(courseId!); // ✅ Fix 2
        }}
      />
    );

  if (!course) return null;

  const isOwner =
    isInstructorOrAdmin &&
    String((course as any).instructorId) === String(currentUser?.id);
  const canAccess =
    isOwnerInstructor || currentUser?.role === "admin" || isEnrolled;
  const totalProgress = getTotalProgress();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* Bouton retour */}
      <div className="max-w-6xl mx-auto px-6 pt-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/app/courses")}
          className="gap-2 text-slate-400 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4" /> Retour aux formations
        </Button>
      </div>

      {/* HERO */}
      <div className="max-w-7xl mx-auto px-6 pt-4 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 26, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="group relative overflow-hidden rounded-[34px] border border-white/10 bg-[#050816] shadow-[0_35px_120px_rgba(0,0,0,0.58)]"
        >
          <div className="absolute inset-0">
            {course.thumbnail && (
              <img
                src={course.thumbnail}
                alt={course.title}
                className="h-full w-full object-cover opacity-[0.09] scale-110"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}
            <div className="absolute -top-24 left-6 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-slate-950/72 to-slate-950/22" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/88 via-transparent to-transparent" />
          </div>
          <div className="pointer-events-none absolute inset-[1px] rounded-[33px] border border-white/5" />

          <div className="relative z-10 grid min-h-[380px] grid-cols-1 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="px-8 py-10 lg:px-12">
              {/* Badges catégorie + niveau */}
              <div className="mb-5 flex flex-wrap items-center gap-2.5">
                {course.category && (
                  <span className="inline-flex items-center rounded-full border border-blue-400/20 bg-blue-500/15 px-3.5 py-1.5 text-xs font-semibold text-blue-200">
                    {course.category}
                  </span>
                )}
                <span
                  className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-semibold ${
                    course.level === "Débutant"
                      ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-200"
                      : course.level === "Intermédiaire"
                        ? "border-amber-400/20 bg-amber-500/15 text-amber-200"
                        : "border-rose-400/20 bg-rose-500/15 text-rose-200"
                  }`}
                >
                  {course.level}
                </span>
              </div>

              <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl xl:text-5xl">
                {course.title}
              </h1>
              <p className="mt-4 text-sm leading-7 text-slate-300/90">
                Développez vos compétences avec une expérience d'apprentissage
                fluide et interactive.
              </p>

              {/* Stats */}

              {/* Stats */}
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm text-slate-200 backdrop-blur-2xl">
                  <Clock className="h-4 w-4 text-blue-400" />
                  <span>{course.estimatedDuration}h de contenu</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm text-slate-200 backdrop-blur-2xl">
                  <BookOpen className="h-4 w-4 text-indigo-400" />
                  <span>
                    {modules.length} module{modules.length > 1 ? "s" : ""}
                  </span>
                </div>

                {/* ✅ Section formateur et chat - AJOUTER CE BLOQUE */}
                {(course as any).instructor && canAccess && (
                  <>
                    {/* Nom du formateur */}
                    <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm text-slate-200 backdrop-blur-2xl">
                      <Users className="h-4 w-4 text-violet-400" />
                      <span>
                        {(course as any).instructor.firstName}{" "}
                        {(course as any).instructor.lastName}
                      </span>
                    </div>

                    {/* ✅ BOUTON DISCUSSION */}
                    {!isOwnerInstructor && !isOwner && (
                      <button
                        onClick={() => setChatOpen(true)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-sm text-blue-300 hover:bg-blue-500/20 transition"
                      >
                        💬 Discussion
                      </button>
                    )}

                    {/* ✅ CHAT */}
                    <CourseChat
                      formationId={courseId!}
                      instructorName={`${(course as any).instructor.firstName} ${(course as any).instructor.lastName}`}
                      instructorId={String((course as any).instructorId)}
                      open={chatOpen}
                      onClose={() => setChatOpen(false)}
                    />
                  </>
                )}
              </div>

              {/* CTA */}
              <div className="mt-9 flex flex-wrap items-center gap-4">
                {currentUser?.role === "learner" ||
                (currentUser?.role === "instructor" && !isOwner) ? (
                  isEnrolled ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/15 px-5 py-3 text-sm font-semibold text-emerald-300">
                        <CheckCircle className="h-4 w-4" /> Vous êtes inscrit
                      </div>
                      <div className="min-w-[220px] rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                        <div className="mb-2 flex items-center justify-between text-xs">
                          <span className="text-slate-400">Progression</span>
                          <span className="font-semibold text-blue-300">
                            {totalProgress}%
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${totalProgress}%` }}
                            transition={{ duration: 1.1, ease: "easeOut" }}
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.985 }}
                      onClick={handleEnroll}
                      disabled={enrolling}
                      className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(59,130,246,0.3)] disabled:opacity-60"
                    >
                      {enrolling ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />{" "}
                          Inscription...
                        </>
                      ) : (
                        <>
                          <Award className="h-4 w-4" /> S'inscrire gratuitement
                        </>
                      )}
                    </motion.button>
                  )
                ) : isInstructorOrAdmin ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center gap-2 rounded-2xl border border-blue-400/20 bg-blue-500/15 px-5 py-3 text-sm font-medium text-blue-200">
                      <BookOpen className="h-4 w-4" /> Accès formateur
                    </div>
                    {(isOwner || currentUser?.role === "admin") && (
                      <button
                        onClick={() =>
                          navigate(`/app/courses/edit/${courseId}`)
                        }
                        className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-medium text-slate-200 hover:bg-white/15 transition"
                      >
                        <Edit className="h-4 w-4" /> Modifier
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            {/* RIGHT SIDE — COURBE PREMIUM */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <motion.div
                  initial={{ opacity: 0, x: 20, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
                  className="relative h-[280px] w-full max-w-[430px] overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.05))] backdrop-blur-2xl shadow-[0_24px_70px_rgba(0,0,0,0.35)]"
                >
                  <div className="absolute -top-12 left-10 h-32 w-32 rounded-full bg-blue-500/20 blur-3xl" />
                  <div className="absolute -bottom-10 right-10 h-36 w-36 rounded-full bg-violet-500/20 blur-3xl" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.12),transparent_25%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.10),transparent_28%)]" />

                  {/* header */}
                  <div className="absolute left-6 top-5 z-10">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">
                      Analytics
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-white">
                      Continuez à progresser avec nous
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">
                      Progression d’apprentissage
                    </p>
                  </div>

                  {/* badge */}
                  <div className="absolute right-6 top-6 z-10 rounded-full border border-emerald-400/20 bg-emerald-500/15 px-3 py-1 text-[11px] font-medium text-emerald-300">
                    +18.4%
                  </div>

                  {/* grid */}
                  <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:34px_34px]" />

                  {/* labels bottom */}
                  <div className="absolute bottom-5 left-6 right-6 flex justify-between text-[11px] text-slate-500">
                    <span>Jan</span>
                    <span>Mar</span>
                    <span>Mai</span>
                    <span>Juil</span>
                    <span>Sep</span>
                  </div>

                  {/* chart */}
                  <svg
                    viewBox="0 0 430 280"
                    className="absolute inset-0 h-full w-full"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient
                        id="curveFillGradient"
                        x1="0%"
                        y1="0%"
                        x2="0%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="rgba(56,189,248,0.26)" />
                        <stop offset="55%" stopColor="rgba(96,165,250,0.12)" />
                        <stop offset="100%" stopColor="rgba(139,92,246,0.02)" />
                      </linearGradient>
                      <linearGradient
                        id="curveLineGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="#22d3ee" />
                        <stop offset="50%" stopColor="#60a5fa" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                      <filter id="curveGlow">
                        <feGaussianBlur stdDeviation="5" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    <motion.path
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.9 }}
                      d="M 35 215 C 80 208, 110 194, 145 176 C 180 158, 210 164, 245 132 C 278 102, 315 108, 350 76 C 372 56, 392 48, 405 34 L 405 248 L 35 248 Z"
                      fill="url(#curveFillGradient)"
                    />

                    <motion.path
                      initial={{ pathLength: 0, opacity: 0.6 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{
                        duration: 1.9,
                        delay: 0.15,
                        ease: "easeOut",
                      }}
                      d="M 35 215 C 80 208, 110 194, 145 176 C 180 158, 210 164, 245 132 C 278 102, 315 108, 350 76 C 372 56, 392 48, 405 34"
                      fill="none"
                      stroke="url(#curveLineGradient)"
                      strokeWidth="5"
                      strokeLinecap="round"
                      filter="url(#curveGlow)"
                    />

                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{
                        duration: 1.9,
                        delay: 0.15,
                        ease: "easeOut",
                      }}
                      d="M 35 215 C 80 208, 110 194, 145 176 C 180 158, 210 164, 245 132 C 278 102, 315 108, 350 76 C 372 56, 392 48, 405 34"
                      fill="none"
                      stroke="url(#curveLineGradient)"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                    />

                    {[
                      { cx: 35, cy: 215 },
                      { cx: 145, cy: 176 },
                      { cx: 245, cy: 132 },
                      { cx: 350, cy: 76 },
                      { cx: 405, cy: 34 },
                    ].map((point, i) => (
                      <g key={i}>
                        <motion.circle
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            duration: 0.35,
                            delay: 0.45 + i * 0.12,
                          }}
                          cx={point.cx}
                          cy={point.cy}
                          r="8"
                          fill="rgba(96,165,250,0.14)"
                        />
                        <motion.circle
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            duration: 0.35,
                            delay: 0.45 + i * 0.12,
                          }}
                          cx={point.cx}
                          cy={point.cy}
                          r="4.5"
                          fill="#93c5fd"
                        />
                        <motion.circle
                          animate={{
                            scale: [1, 1.45, 1],
                            opacity: [0.45, 0.15, 0.45],
                          }}
                          transition={{
                            duration: 2.8,
                            repeat: Infinity,
                            delay: i * 0.2,
                          }}
                          cx={point.cx}
                          cy={point.cy}
                          r="11"
                          fill="rgba(139,92,246,0.18)"
                        />
                      </g>
                    ))}
                  </svg>

                  {/* footer */}
                  <div className="absolute bottom-10 left-6 z-10">
                    <p className="text-sm font-semibold text-white">
                      Votre croissance augmente toujours
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* CONTENU */}
      <div className="max-w-6xl mx-auto px-6 pb-12 space-y-6">
        {/* Description */}
        {course.description && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-3">
              À propos de cette formation
            </h2>
            <p className="text-slate-400 leading-relaxed">
              {course.description}
            </p>
            {course.prerequisites?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-3 flex-wrap">
                <p className="text-sm font-medium text-slate-300 whitespace-nowrap">
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
        )}

        {/* Lecteur de contenu */}
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
                </div>
                <ContentViewer
                  content={selectedContent.content}
                  formationId={courseId!}
                  moduleId={selectedContent.moduleId}
                  canAccess={canAccess}
                  isLearner={
                    currentUser?.role === "learner" ||
                    (currentUser?.role === "instructor" &&
                      isEnrolled &&
                      !isOwnerInstructor)
                  }
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

        {/* Modules */}
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
                {sortedModules.map((module, index) => {
                  const isOpen = openModuleId === module.id;
                  const contenus = moduleContenus[module.id] || [];
                  const isLoadingC = loadingContenus[module.id];
                  const quizStatus = moduleQuizStatus[module.id];
                  const modProg = getModuleProgress(module.id);
                  // ✅ Fix 3 — Vérifier si ce module est accessible
                  const moduleAccess = isModuleUnlocked(index);
                  const isLastModule = module.id === lastModuleId;

                  return (
                    <div key={module.id}>
                      <div
                        className={`w-full flex items-center gap-3 px-6 py-4 transition-colors ${
                          moduleAccess ? "hover:bg-white/5" : "opacity-60"
                        }`}
                      >
                        <button
                          onClick={() => handleToggleModule(module.id, index)}
                          className="flex-1 min-w-0 flex items-center gap-4 text-left group"
                        >
                          {/* Numéro / lock */}
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                              !moduleAccess && canAccess
                                ? "bg-slate-700/50 text-slate-600"
                                : isOpen
                                  ? "bg-blue-600 text-white"
                                  : "bg-white/10 text-slate-400 group-hover:bg-white/15"
                            }`}
                          >
                            {!moduleAccess && canAccess ? (
                              <Lock className="w-4 h-4" />
                            ) : (
                              index + 1
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                              <p className="font-semibold text-white truncate">
                                {module.title}
                              </p>

                              {module.duration > 0 && (
                                <span className="text-xs text-slate-500 shrink-0">
                                  {module.duration} min
                                </span>
                              )}

                              {/* Message module verrouillé - visible seulement pour les apprenants */}
                              {!moduleAccess &&
                                canAccess &&
                                index > 0 &&
                                currentUser?.role !== "admin" &&
                                !isOwnerInstructor && (
                                  <span className="text-xs text-slate-600 shrink-0">
                                    🔒 Terminez le module {index} d'abord
                                  </span>
                                )}
                            </div>
                            {module.description && (
                              <p
                                className={`text-xs text-slate-500 mt-0.5 ${isOpen ? "" : "truncate"}`}
                              >
                                {module.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {currentUser?.role === "learner" && isEnrolled && (
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
                            <div
                              className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                            >
                              <ChevronDown className="w-4 h-4 text-slate-500" />
                            </div>
                          </div>
                        </button>

                        {/* Bouton quiz - Admin et créateur ont accès direct */}
                        {canAccess && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();

                              // ✅ Admin ou créateur → accès direct sans vérification
                              if (
                                currentUser?.role === "admin" ||
                                isOwnerInstructor
                              ) {
                                navigate(
                                  `/app/courses/${courseId}/modules/${module.id}/quiz/${quizStatus?.quizId ?? "0"}`,
                                );
                                return;
                              }

                              // Pour les apprenants, passer par handleQuizClick avec vérifications
                              handleQuizClick(
                                e,
                                module.id,
                                quizStatus?.quizId ?? null,
                                index,
                              );
                            }}
                            disabled={false}
                            className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                              quizStatus?.termine
                                ? "text-green-400 border-green-500/30 bg-green-500/10 hover:bg-green-500/20"
                                : "text-purple-400 border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 hover:scale-105"
                            }`}
                          >
                            {quizStatus?.termine ? (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                Quiz terminé
                              </>
                            ) : (
                              <>
                                <Award className="w-4 h-4" />
                                Passer le quiz
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Contenus du module */}
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
                                Aucun contenu
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
                                        className={`w-full flex items-center gap-3 px-6 py-3 ${
                                          !canAccess
                                            ? "cursor-not-allowed"
                                            : "cursor-pointer"
                                        }`}
                                      >
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white/5">
                                          {!canAccess ? (
                                            <Lock className="w-3.5 h-3.5 text-slate-600" />
                                          ) : (
                                            <ContentIcon
                                              type={c.type}
                                              className="w-3.5 h-3.5"
                                            />
                                          )}
                                        </div>
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

        {/* ✅ Fix 3 — Section feedbacks (visible par tous) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {/* Liste des avis */}
          <FormationFeedbacks
            formationId={courseId!}
            key={feedbackRefresh}
            onRefresh={() => setFeedbackRefresh((r) => r + 1)}
          />{" "}
        </motion.div>

        {/* CTA inscription */}
        {(currentUser?.role === "learner" ||
          (currentUser?.role === "instructor" && !isOwnerInstructor)) &&
          !isEnrolled && (
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

        {/* ✅ Fix 3 — Modal feedback */}
        <FeedbackModal
          open={showFeedbackModal}
          formationId={courseId!}
          formationTitre={course.title}
          onClose={() => {
            setShowFeedbackModal(false);
            // Si l'utilisateur passe, il va quand même au quiz
            if (pendingQuizNav) {
              navigate(pendingQuizNav);
              setPendingQuizNav(null);
            }
          }}
          onSubmitted={() => {
            setShowFeedbackModal(false);
            // Rafraîchir l'affichage des feedbacks
            setFeedbackRefresh((r) => r + 1);
            // Recharger le feedback de l'utilisateur
            api
              .get(`/formations/${courseId}/feedbacks/mon-feedback`)
              .then((res) => setMonFeedback(res.data))
              .catch(() => {});
            // Aller au quiz
            if (pendingQuizNav) {
              navigate(pendingQuizNav);
              setPendingQuizNav(null);
            }
          }}
        />
      </div>
    </div>
  );
};
