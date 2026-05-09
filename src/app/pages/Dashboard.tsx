import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import {
  BookOpen,
  TrendingUp,
  Award,
  Loader2,
  ChevronRight,
  Users,
  FileCheck,
  BarChart3,
  Shield,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import {
  getMesProgressions,
  getProgression,
} from "../services/progressionService";
import { getFormations } from "../services/formationService";
import { getProgressionFormateur } from "../services/progressionService";
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
import { InstructorChart } from "../components/InstructorChart";
import { ApprenantCharts } from "../components/ApprenantCharts";
import { AdminCharts } from "../components/AdminCharts";
import { LearningTimeChart } from "../components/LearningTimeChart";
import { AdminChartsExtra } from "../components/AdminChartsExtra";
import { getCertificats } from "../services/certificatService";
import { useUnlockedFormations } from "../hooks/useUnlockedFormations";
import api from "../services/api";

export const Dashboard: React.FC = () => {
  const { currentUser } = useApp();
  const navigate = useNavigate();

  // ── Apprenant / Formateur ─────────────────────────────────
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [progressions, setProgressions] = useState<ProgressionResume[]>([]);
  const [progressByFormation, setProgressByFormation] = useState<
    Record<string, number>
  >({});
  const [allBadges, setAllBadges] = useState<any[]>([]);
  const [allTentatives, setAllTentatives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"progression" | "badges">(
    "progression",
  );
  const [certificatFormationIds, setCertificatFormationIds] = useState<
    string[]
  >([]);

  const { checkUnlocked } = useUnlockedFormations();

  // ── Admin ─────────────────────────────────────────────────
  const [adminFormations, setAdminFormations] = useState<any[]>([]);
  const [adminProgressions, setAdminProgressions] = useState<
    {
      formationTitre: string;
      nbInscrits: number;
      taux: number;
    }[]
  >([]);
  const [adminLoading, setAdminLoading] = useState(false);

  // ── Charge données apprenant / formateur ─────────────────
  useEffect(() => {
    if (!currentUser || currentUser.role === "admin") {
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
        const inProgress = allCourses.filter((c) => {
          const enrolled = (c as any).isEnrolled === true;

          // Pour les formateurs, inclure aussi leurs propres formations créées
          const isOwner =
            currentUser.role === "instructor" &&
            String((c as any).instructorId) === String(currentUser?.id);

          return (
            (enrolled || isOwner) && (progressMap[String(c.id)] ?? 0) < 100
          );
        });

        setEnrolledCourses(inProgress);
        const details = await Promise.all(
          progs.map((p) => getProgression(p.formation_id).catch(() => null)),
        );
        setAllBadges(details.flatMap((d) => d?.badges ?? []));
        setAllTentatives(details.flatMap((d) => d?.tentatives_quiz ?? []));
      } catch {
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser]);

  // ── Charge données admin ─────────────────────────────────
  useEffect(() => {
    api
      .get("/certificats")
      .then((res) => {
        setCertificatFormationIds(
          res.data.map((c: any) => String(c.formation_id)),
        );
      })
      .catch(() => {});
    if (!currentUser || currentUser.role !== "admin") return;
    setAdminLoading(true);

    const loadAdmin = async () => {
      try {
        // ✅ Deux appels : publiées + brouillons
        const [publieesData, brouillonsData] = await Promise.all([
          getFormations(), // statut=publie par défaut
          getFormations({ statut: "brouillon" }), // statut=brouillon
        ]);

        const toutesFormations = [...publieesData, ...brouillonsData];

        // ✅ Ne garder que les formations créées par l'admin connecté
        const mesFormations = toutesFormations.filter(
          (f: any) => String(f.instructorId) === String(currentUser?.id),
        );

        setAdminFormations(mesFormations);

        // Progression uniquement sur MES publiées
        const mesPubliees = mesFormations.filter(
          (f: any) => f.statut === "publie",
        );
        const progressData = await Promise.all(
          mesPubliees.map(async (f) => {
            try {
              const data = await getProgressionFormateur(f.id);
              const taux =
                data.apprenants?.length > 0
                  ? Math.round(
                      data.apprenants.reduce(
                        (s: number, a: any) => s + a.pourcentage,
                        0,
                      ) / data.apprenants.length,
                    )
                  : 0;
              return {
                formationTitre: f.title || (f as any).titre || "Formation",
                nbInscrits: data.nb_inscrits ?? 0,
                taux,
              };
            } catch {
              return null;
            }
          }),
        );
        setAdminProgressions(progressData.filter(Boolean) as any[]);
      } catch {
      } finally {
        setAdminLoading(false);
      }
    };
    loadAdmin();
  }, [currentUser]);

  if (!currentUser) return null;

  const isInstructor = currentUser.role === "instructor";
  const isAdmin = currentUser.role === "admin";
  const isLearner = currentUser.role === "learner";

  const avgProgress =
    progressions.length > 0
      ? Math.round(
          progressions.reduce((s, p) => s + p.pourcentage_global, 0) /
            progressions.length,
        )
      : 0;
  const quizzesReussis = allTentatives.filter((t: any) => t.reussi).length;
  const badgesUniques = Array.from(
    new Map(allBadges.map((b) => [b.code, b])).values(),
  );

  const publies = adminFormations.filter(
    (f: any) => f.statut === "publie",
  ).length;
  const brouillons = adminFormations.filter(
    (f: any) => f.statut === "brouillon",
  ).length;

  // ── Catégories uniques pour le filtre ─────────────────────
  const categories = Array.from(
    new Set(adminFormations.map((f: any) => f.category).filter(Boolean)),
  ).sort();

  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // ── Progressions filtrées par catégorie ─────────────────
  const filteredProgressions =
    selectedCategory === "all"
      ? adminProgressions
      : adminProgressions.filter((p) => {
          const formation = adminFormations.find(
            (f: any) => (f.title || f.titre) === p.formationTitre,
          );
          return formation?.category === selectedCategory;
        });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/30">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Bienvenue, {currentUser.firstName} !
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isLearner
              ? "Continuez votre parcours d'apprentissage"
              : isInstructor
                ? "Gérez vos formations et suivez vos apprenants"
                : "Tableau de bord administrateur"}
          </p>
        </motion.div>

        {/* ════════════════════════════════════════
            DASHBOARD ADMIN
        ════════════════════════════════════════ */}

        {isAdmin && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <ProgressCard
                title="Formations totales"
                value={adminFormations.length}
                icon="target"
                color="blue"
                suffix=""
              />
              <ProgressCard
                title="Publiées"
                value={publies}
                icon="award"
                color="green"
                suffix=""
              />
              <ProgressCard
                title="Brouillons"
                value={brouillons}
                icon="zap"
                color="purple"
                suffix=""
              />
              <ProgressCard
                title="Formations suivies"
                value={adminProgressions.reduce((s, p) => s + p.nbInscrits, 0)}
                icon="trophy"
                color="orange"
                suffix=""
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.13 }}
            >
              <AdminCharts />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
            >
              <AdminChartsExtra />
            </motion.div>

            {/* Stats globales */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Espace formateur</h3>
                    <p className="text-blue-100 text-sm">
                      🎓 Gérez vos formations et suivez vos apprenants
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      onClick={() => navigate("/app/instructor/progress")}
                      className="px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition-colors text-sm"
                    >
                      📊 Progression apprenants
                    </motion.button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ── Pour admin  ── */}
            {currentUser?.role === "admin" && (
              <div className="mt-8">
                <InstructorChart />
              </div>
            )}

            {/* Boutons actions */}

            {/* Progression apprenants par formation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      Progression des apprenants par formation
                    </CardTitle>

                    {/* ✅ Filtre par catégorie */}
                    {categories.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Catégorie :
                        </span>
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="text-xs sm:text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                        >
                          <option value="all">Toutes</option>
                          {categories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {adminLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                  ) : filteredProgressions.length === 0 ? (
                    <p className="text-center py-8 text-gray-500">
                      Aucune formation avec des apprenants inscrits
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {filteredProgressions.map((p, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-semibold dark:text-white text-sm">
                                {p.formationTitre}
                              </p>
                              <p className="text-xs text-gray-500">
                                <Users className="w-3 h-3 inline mr-1" />
                                {p.nbInscrits} apprenant
                                {p.nbInscrits > 1 ? "s" : ""} inscrit
                                {p.nbInscrits > 1 ? "s" : ""}
                              </p>
                            </div>
                            <Badge
                              variant={p.taux >= 100 ? "default" : "secondary"}
                            >
                              {p.taux}% moy.
                            </Badge>
                          </div>
                          <Progress value={p.taux} className="h-2" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}

        {/* ════════════════════════════════════════
            DASHBOARD APPRENANT / FORMATEUR
        ════════════════════════════════════════ */}
        {(isLearner || isInstructor) && (
          <>
            {/* Stats apprenant */}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <ProgressCard
                title="Formations suivies"
                value={progressions.length}
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

            {/* ── Pour apprenant ── */}
            {(isLearner || isInstructor) && (
              <div className="mt-8">
                <ApprenantCharts />
              </div>
            )}

            {(isLearner || isInstructor) && (
              <div className="mt-6">
                <LearningTimeChart />
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : (
              <>
                {/* Onglets progression / badges */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
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
                              {badgesUniques.map((badge: any, i: number) => (
                                <motion.div
                                  key={badge.code ?? i}
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{
                                    delay: i * 0.03,
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

                {/* Formations en cours */}
                {enrolledCourses.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-blue-600" /> Mes
                          formations en cours
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
                                isUnlocked={
                                  !course.is_coded ||
                                  (course as any).aAcces === true ||
                                  checkUnlocked(String(course.id))
                                }
                                isOwner={
                                  currentUser?.id ===
                                  (course as any).instructorId
                                }
                                hasCertificate={certificatFormationIds.includes(
                                  String(course.id),
                                )}
                                progress={
                                  progressByFormation[String(course.id)] ?? 0
                                }
                                isEnrolled={true}
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
                {/* Bloc formateur */}
                {isInstructor && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Card className="bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                      <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-bold mb-1">
                            🎓 Espace Formateur
                          </h3>
                          <p className="text-blue-100 text-sm">
                            Gérez vos formations et suivez vos apprenants
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            onClick={() => navigate("/app/instructor/progress")}
                            className="px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition-colors text-sm"
                          >
                            📊 Progression apprenants
                          </motion.button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
                {/* ── Pour instructor ── */}
                {currentUser?.role === "instructor" && (
                  <div className="mt-8">
                    <InstructorChart />
                  </div>
                )}

                {/* CTA si aucune formation */}
                {enrolledCourses.length === 0 && progressions.length === 0 && (
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
      </div>
      {/* ── FOOTER ── */}
      <footer className="bg-gray-950 text-gray-400 pt-16 pb-8">
        <p className="text-xs text-center">
          © {new Date().getFullYear()} LMS. Tous droits réservés.
        </p>
      </footer>
    </div>
  );
};
