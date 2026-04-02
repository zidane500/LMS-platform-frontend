// src/app/pages/Profile.tsx
import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Globe,
  Award,
  BookOpen,
  TrendingUp,
  Edit,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import {
  getMesProgressions,
  getProgression,
} from "../services/progressionService";
import type {
  ProgressionResume,
  ProgressionFormation,
} from "../services/progressionService";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { toast } from "sonner";

export const Profile: React.FC = () => {
  const { currentUser } = useApp();
  const navigate = useNavigate();

  const [progressions, setProgressions] = useState<ProgressionResume[]>([]);
  const [allBadges, setAllBadges] = useState<any[]>([]);
  const [allTentatives, setAllTentatives] = useState<any[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(false);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "learner") return;
    setLoadingProgress(true);
    getMesProgressions()
      .then(async (data) => {
        setProgressions(data);
        // Charger les détails de chaque formation pour badges et quiz
        const details = await Promise.all(
          data.map((p) => getProgression(p.formation_id).catch(() => null)),
        );
        const badges = details.flatMap((d) => d?.badges ?? []);
        const tentatives = details.flatMap((d) => d?.tentatives_quiz ?? []);
        setAllBadges(badges);
        setAllTentatives(tentatives);
      })
      .catch(() => toast.error("Impossible de charger la progression"))
      .finally(() => setLoadingProgress(false));
  }, [currentUser]);

  if (!currentUser) {
    navigate("/login");
    return null;
  }

  const avgQuizScore =
    allTentatives.length > 0
      ? Math.round(
          allTentatives.reduce(
            (sum: number, t: any) => sum + t.pourcentage,
            0,
          ) / allTentatives.length,
        )
      : 0;

  const quizzesReussis = allTentatives.filter((t: any) => t.reussi).length;

  const avatarUrl = currentUser.avatar
    ? `${currentUser.avatar}?v=${currentUser.avatar.split("/").pop()}`
    : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 dark:from-slate-950 dark:to-purple-950/30">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className="h-48 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl" />
          <div className="absolute bottom-0 left-8 transform translate-y-1/2">
            <div className="w-32 h-32 rounded-full bg-white dark:bg-slate-900 p-1 shadow-xl">
              <Avatar className="w-full h-full">
                <AvatarImage
                  src={avatarUrl}
                  className="object-cover rounded-full"
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-4xl rounded-full">
                  {currentUser.firstName[0]}
                  {currentUser.lastName[0]}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </motion.div>

        {/* Nom + bouton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="ml-44 space-y-2"
        >
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold dark:text-white">
                {currentUser.firstName} {currentUser.lastName}
              </h1>
              <Badge className="capitalize mt-2">
                {currentUser.role === "learner"
                  ? "Apprenant"
                  : currentUser.role === "instructor"
                    ? "Formateur"
                    : "Administrateur"}
              </Badge>
            </div>
            <Button
              onClick={() => navigate("/app/profile/edit")}
              className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600"
            >
              <Edit className="w-4 h-4" /> Modifier mon profil
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold dark:text-white">
                  {progressions.length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Formations
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold dark:text-white">
                  {avgQuizScore}%
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Score moyen
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold dark:text-white">
                  {allBadges.length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Badges
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold dark:text-white">
                  {quizzesReussis}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Quiz réussis
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Tabs defaultValue="info" className="space-y-6">
            <TabsList>
              <TabsTrigger value="info">Informations</TabsTrigger>
              <TabsTrigger value="progress">Progression</TabsTrigger>
              <TabsTrigger value="badges">Badges</TabsTrigger>
            </TabsList>

            {/* ── Informations ── */}
            <TabsContent value="info">
              <Card>
                <CardHeader>
                  <CardTitle>Informations personnelles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Nom complet</p>
                        <p className="font-medium dark:text-white">
                          {currentUser.firstName} {currentUser.lastName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium dark:text-white">
                          {currentUser.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Téléphone</p>
                        <p className="font-medium dark:text-white">
                          {currentUser.phone || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">
                          Date de naissance
                        </p>
                        <p className="font-medium dark:text-white">
                          {currentUser.dateOfBirth
                            ? new Date(
                                currentUser.dateOfBirth,
                              ).toLocaleDateString("fr-FR")
                            : "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Langue préférée</p>
                        <p className="font-medium dark:text-white capitalize">
                          {currentUser.preferredLanguage}
                        </p>
                      </div>
                    </div>
                  </div>
                  {(currentUser.targetDomains?.length ?? 0) > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">
                        Domaines d'intérêt
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {currentUser.targetDomains!.map((d, i) => (
                          <Badge key={i} variant="secondary">
                            {d}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {(currentUser.technologies?.length ?? 0) > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Technologies</p>
                      <div className="flex flex-wrap gap-2">
                        {currentUser.technologies!.map((t, i) => (
                          <Badge key={i}>{t}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Progression ── */}
            <TabsContent value="progress">
              <Card>
                <CardHeader>
                  <CardTitle>Ma progression</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingProgress ? (
                    <div className="flex justify-center py-8">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : progressions.length > 0 ? (
                    <div className="space-y-6">
                      {progressions.map((p) => (
                        <div key={p.formation_id} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-semibold dark:text-white">
                                {p.formation_titre}
                              </p>
                              {p.complete && (
                                <span className="text-xs text-green-600 font-medium">
                                  ✓ Terminée
                                </span>
                              )}
                            </div>
                            <Badge
                              variant={p.complete ? "default" : "secondary"}
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
                    <div className="text-center py-8 text-gray-500">
                      Aucune formation inscrite
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Historique quiz */}
              {allTentatives.length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Historique des quiz</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {allTentatives.slice(0, 10).map((t: any, i: number) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-3 h-3 rounded-full ${t.reussi ? "bg-green-500" : "bg-red-500"}`}
                            />
                            <span className="text-sm dark:text-white">
                              Quiz {i + 1}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {t.score}/{t.score_max} pts
                            </span>
                            <Badge
                              variant={t.reussi ? "default" : "destructive"}
                            >
                              {t.pourcentage}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ── Badges ── */}
            <TabsContent value="badges">
              <Card>
                <CardHeader>
                  <CardTitle>Mes badges ({allBadges.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {allBadges.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {allBadges.map((badge: any, i: number) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: i * 0.05, type: "spring" }}
                          className="flex flex-col items-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-xl hover:shadow-lg transition-shadow"
                        >
                          <span className="text-5xl mb-2">{badge.icone}</span>
                          <p className="font-semibold text-sm text-center dark:text-white">
                            {badge.nom}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                            {badge.description}
                          </p>
                          {badge.obtenu_le && (
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(badge.obtenu_le).toLocaleDateString(
                                "fr-FR",
                              )}
                            </p>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Aucun badge obtenu pour le moment
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};
