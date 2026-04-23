import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import {
  Award,
  Download,
  FileCheck,
  Calendar,
  User,
  GraduationCap,
  Search,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getMesCertificats,
  genererCertificat,
} from "../services/certificatService";
import {
  getMesProgressions,
  getProgression,
} from "../services/progressionService";
import { generateCertificatePDF } from "../utils/certificateGenerator";
import type { Certificate } from "../utils/certificateGenerator";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { toast } from "sonner";

export const Certificates: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // ── Charger les certificats existants + vérifier les éligibles ──
  useEffect(() => {
    if (
      !currentUser ||
      (currentUser.role !== "learner" && currentUser.role !== "instructor")
    ) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        // Récupérer certificats existants
        const certs = await getMesCertificats();
        setCertificates(certs);

        // Vérifier les formations éligibles et générer automatiquement
        const progressions = await getMesProgressions();
        const completees = progressions.filter((p) => p.complete);

        for (const prog of completees) {
          // Si pas encore de certificat pour cette formation
          const dejaPresent = certs.some(
            (c) => (c as any).formation_id === prog.formation_id,
          );
          if (!dejaPresent) {
            try {
              const newCert = await genererCertificat(prog.formation_id);
              setCertificates((prev) => [...prev, newCert]);
            } catch {
              // Formation complète mais quiz pas encore réussi — silencieux
            }
          }
        }
      } catch {
        toast.error("Impossible de charger les certificats");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [currentUser]);

  const handleDownload = async (cert: Certificate) => {
    setDownloading(cert.id);
    try {
      await generateCertificatePDF(cert);
      toast.success("Certificat téléchargé !");
    } catch {
      toast.error("Erreur lors du téléchargement");
    } finally {
      setDownloading(null);
    }
  };

  const getMentionStyle = (mention: string) => {
    switch (mention) {
      case "Excellent":
        return "bg-gradient-to-r from-green-500 to-emerald-500 text-white";
      case "Très Bien":
        return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white";
      case "Bien":
        return "bg-gradient-to-r from-purple-500 to-pink-500 text-white";
      case "Passable":
        return "bg-gradient-to-r from-orange-500 to-yellow-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getMentionIcon = (mention: string) => {
    switch (mention) {
      case "Excellent":
        return "🥇";
      case "Très Bien":
        return "🥈";
      case "Bien":
        return "🥉";
      default:
        return "🎓";
    }
  };

  const filtered = certificates.filter(
    (c) =>
      search === "" ||
      c.courseName.toLowerCase().includes(search.toLowerCase()) ||
      c.learnerName.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase()),
  );

  const excellentes = certificates.filter(
    (c) => c.mention === "Excellent" || c.mention === "Très Bien",
  ).length;

  if (!currentUser) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 dark:from-slate-950 dark:to-purple-950/30">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
            <Award className="w-10 h-10 text-purple-600" />
            Mes Certificats
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Téléchargez vos certificats de réussite — générés automatiquement à
            la fin de chaque formation
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <FileCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold dark:text-white">
                  {certificates.length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Certificats disponibles
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold dark:text-white">
                  {certificates.length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Formations complétées
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold dark:text-white">
                  {excellentes}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Excellentes mentions
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search */}
        {certificates.length > 0 && (
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un certificat..."
              className="pl-10"
            />
          </div>
        )}

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="text-center space-y-4">
                <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto" />
                <p className="text-gray-500">
                  Vérification des formations complétées...
                </p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Award className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {search
                    ? "Aucun certificat trouvé"
                    : "Aucun certificat disponible"}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {search
                    ? "Essayez de modifier votre recherche"
                    : "Complétez une formation et réussissez un quiz pour obtenir votre certificat automatiquement"}
                </p>
                {!search && (
                  <Button
                    onClick={() => navigate("/app/courses")}
                    className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600"
                  >
                    <GraduationCap className="w-4 h-4" /> Voir les formations
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence>
                {filtered.map((cert, i) => (
                  <motion.div
                    key={cert.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    whileHover={{ y: -4 }}
                  >
                    <Card className="overflow-hidden hover:shadow-xl transition-shadow">
                      {/* Barre de mention en haut */}
                      <div
                        className={`h-1.5 ${getMentionStyle(cert.mention).split(" text-")[0]}`}
                      />

                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-lg">
                                {getMentionIcon(cert.mention)}
                              </div>
                              <div>
                                <CardTitle className="text-sm leading-tight dark:text-white">
                                  {cert.learnerName}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                  Apprenant certifié
                                </CardDescription>
                              </div>
                            </div>
                          </div>
                          <Badge
                            className={`${getMentionStyle(cert.mention)} border-0 text-xs shrink-0`}
                          >
                            {cert.mention}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-start gap-2">
                            <GraduationCap className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Formation
                              </p>
                              <p className="text-sm font-semibold dark:text-white truncate">
                                {cert.courseName}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <User className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Formateur
                              </p>
                              <p className="text-sm font-medium dark:text-white truncate">
                                {cert.trainerName}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <Calendar className="w-4 h-4 text-pink-600 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Date d'émission
                              </p>
                              <p className="text-sm font-medium dark:text-white">
                                {new Date(cert.date).toLocaleDateString(
                                  "fr-FR",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  },
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-gray-200 dark:border-slate-700">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Score moyen des quiz
                            </span>
                            <span className="text-sm font-bold text-indigo-600">
                              {cert.averageScore.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${getMentionStyle(cert.mention).split(" text-")[0]}`}
                              style={{ width: `${cert.averageScore}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 font-mono truncate">
                            N° {cert.id.slice(-16)}
                          </p>
                        </div>

                        <Button
                          onClick={() => handleDownload(cert)}
                          disabled={downloading === cert.id}
                          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 gap-2"
                        >
                          {downloading === cert.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />{" "}
                              Génération PDF...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4" /> Télécharger PDF
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
