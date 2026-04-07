// src/app/pages/Dashboard.tsx
import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import {
  BookOpen,
  TrendingUp,
  Award,
  Trophy,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import {
  getMesProgressions,
  getProgression,
} from "../services/progressionService";
import { getFormation, getFormations } from "../services/formationService";
import { CourseCard } from "../components/CourseCard";
import { ProgressCard } from "../components/ProgressCard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Button } from "../components/ui/button";
import type { Course } from "../types";
import type { ProgressionResume } from "../services/progressionService";

export const Dashboard: React.FC = () => {
  const { currentUser } = useApp();
  const navigate = useNavigate();

  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [progressions, setProgressions] = useState<ProgressionResume[]>([]);
  const [progressByFormation, setProgressByFormation] = useState<
    Record<string, number>
  >({});
  const [allBadges, setAllBadges] = useState<any[]>([]);
  const [allTentatives, setAllTentatives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "learner") {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const progs = await getMesProgressions();
        setProgressions(progs);

        const progressMap: Record<string, number> = {};
        progs.forEach((p) => {
          progressMap[String(p.formation_id)] = p.pourcentage_global;
        });
        setProgressByFormation(progressMap);

        const allCourses = await getFormations();

        const enrolledInProgress = allCourses.filter((course) => {
          const enrolled = (course as any).isEnrolled === true;
          if (!enrolled) return false;

          const progress = progressMap[String(course.id)] ?? 0;
          return progress < 100;
        });

        setEnrolledCourses(enrolledInProgress);

        const details = await Promise.all(
          progs.map((p) => getProgression(p.formation_id).catch(() => null)),
        );

        setAllBadges(details.flatMap((d) => d?.badges ?? []));
        setAllTentatives(details.flatMap((d) => d?.tentatives_quiz ?? []));
      } catch {
        /* silencieux */
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [currentUser]);

  if (!currentUser) return null;

  const isAdminOrInstructor =
    currentUser.role === "admin" || currentUser.role === "instructor";

  const avgProgress =
    progressions.length > 0
      ? Math.round(
          progressions.reduce((s, p) => s + p.pourcentage_global, 0) /
            progressions.length,
        )
      : 0;

  const quizzesReussis = allTentatives.filter((t: any) => t.reussi).length;

  const [activeTab, setActiveTab] = useState<"progression" | "badges">(
    "progression",
  );

  // Dédupliquer les badges
  const badgesUniques = Array.from(
    new Map(allBadges.map((b) => [b.code, b])).values(),
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/30">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Bienvenue, {currentUser.firstName} !
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {currentUser.role === "learner"
              ? "Continuez votre parcours d'apprentissage"
              : currentUser.role === "instructor"
                ? "Gérez vos formations"
                : "Tableau de bord administrateur"}
          </p>
        </motion.div>

        {/* ── APPRENANT ── */}
        {currentUser.role === "learner" && (
          <>
            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <ProgressCard
                title="Formations actives"
                value={enrolledCourses.length}
                icon="target"
                color="blue"
                suffix=""
              />
              <ProgressCard
                title="Progression moyenne"
                value={avgProgress}
                icon="zap"
                color="purple"
              />
              <ProgressCard
                title="Badges obtenus"
                value={badgesUniques.length}
                icon="award"
                color="green"
                suffix=""
              />
              <ProgressCard
                title="Quiz réussis"
                value={quizzesReussis}
                icon="trophy"
                color="orange"
                suffix=""
              />
            </motion.div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : (
              <>
                {/* Progression + Badges en onglets */}
                {(progressions.length > 0 || true) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card>
                      <CardHeader className="pb-0">
                        <div className="flex gap-1 border-b border-gray-200 dark:border-slate-700">
                          <button
                            onClick={() => setActiveTab("progression")}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                              activeTab === "progression"
                                ? "border-purple-600 text-purple-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
                            }`}
                          >
                            <TrendingUp className="w-4 h-4" /> Ma progression
                          </button>
                          <button
                            onClick={() => setActiveTab("badges")}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                              activeTab === "badges"
                                ? "border-yellow-500 text-yellow-500"
                                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
                            }`}
                          >
                            <Award className="w-4 h-4" /> Mes badges
                            {badgesUniques.length > 0 && (
                              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                                {badgesUniques.length}
                              </span>
                            )}
                          </button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        {activeTab === "progression" &&
                          (progressions.length > 0 ? (
                            <div className="space-y-4">
                              {progressions.map((p) => (
                                <div
                                  key={p.formation_id}
                                  className="space-y-2 cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() =>
                                    navigate(`/app/courses/${p.formation_id}`)
                                  }
                                >
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <p className="font-semibold dark:text-white text-sm">
                                        {p.formation_titre}
                                      </p>
                                      {p.complete && (
                                        <span className="text-xs text-green-600 font-medium">
                                          ✓ Terminée
                                        </span>
                                      )}
                                    </div>
                                    <Badge
                                      variant={
                                        p.complete ? "default" : "secondary"
                                      }
                                    >
                                      {p.pourcentage_global}%
                                    </Badge>
                                  </div>
                                  <Progress
                                    value={p.pourcentage_global}
                                    className="h-2"
                                  />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-center py-8 text-gray-500">
                              Aucune formation inscrite
                            </p>
                          ))}

                        {activeTab === "badges" && (
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <p className="text-sm font-semibold dark:text-white">
                                Mes badges récents
                              </p>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate("/app/badges")}
                                className="gap-1 text-xs text-violet-500 hover:text-violet-400"
                              >
                                Voir tous <ChevronRight className="w-3 h-3" />
                              </Button>
                            </div>

                            {badgesUniques.length > 0 ? (
                              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                                {badgesUniques
                                  .slice(0, 6)
                                  .map((badge: any, i: number) => (
                                    <motion.div
                                      key={i}
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{
                                        delay: i * 0.05,
                                        type: "spring",
                                      }}
                                      onClick={() => navigate("/app/badges")}
                                      className="flex flex-col items-center p-3 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-xl hover:shadow-lg transition-shadow cursor-pointer"
                                    >
                                      <span className="text-3xl mb-1">
                                        {badge.icone}
                                      </span>
                                      <p className="text-xs font-semibold text-center dark:text-white line-clamp-2">
                                        {badge.nom}
                                      </p>
                                    </motion.div>
                                  ))}
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <p className="text-gray-500 dark:text-gray-400 mb-4">
                                  Aucun badge obtenu pour le moment
                                </p>
                                <Button
                                  variant="outline"
                                  onClick={() => navigate("/app/courses")}
                                  className="gap-2"
                                >
                                  <BookOpen className="w-4 h-4" /> Commencer une
                                  formation
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Formations en cours */}
                {enrolledCourses.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-blue-600" />
                          Mes formations en cours
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {enrolledCourses.map((course, i) => (
                            <motion.div
                              key={course.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.1 }}
                            >
                              <CourseCard
                                course={course}
                                progress={
                                  progressByFormation[String(course.id)] ?? 0
                                }
                                onView={() =>
                                  navigate(`/app/courses/${course.id}`)
                                }
                              />
                            </motion.div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Aucune formation */}
                {enrolledCourses.length === 0 && (
                  <Card className="bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                    <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-4">
                      <div>
                        <h3 className="text-2xl font-bold mb-2">
                          Commencez votre apprentissage !
                        </h3>
                        <p className="text-blue-100">
                          Découvrez notre catalogue de formations
                        </p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        onClick={() => navigate("/app/courses")}
                        className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:shadow-xl transition-shadow whitespace-nowrap"
                      >
                        Voir les formations
                      </motion.button>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </>
        )}

        {/* ── FORMATEUR / ADMIN ── */}
        {isAdminOrInstructor && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-blue-600 to-purple-600 text-white">
              <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold mb-2">
                    Gérez vos formations
                  </h3>
                  <p className="text-blue-100">
                    Créez et suivez vos contenus pédagogiques
                  </p>
                </div>
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => navigate("/app/courses")}
                    className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:shadow-xl transition-shadow whitespace-nowrap"
                  >
                    Mes formations
                  </motion.button>
                  {currentUser.role === "instructor" && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      onClick={() => navigate("/app/instructor/progress")}
                      className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition-colors whitespace-nowrap"
                    >
                      📊 Progression apprenants
                    </motion.button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};
