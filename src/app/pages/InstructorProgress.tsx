// src/app/pages/InstructorProgress.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Users,
  TrendingUp,
  Download,
  Loader2,
  Search,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getProgressionFormateur } from "../services/progressionService";
import { getFormations } from "../services/formationService";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from "sonner";
import type { Course } from "../types";

export const InstructorProgress: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [formations, setFormations] = useState<Course[]>([]);
  const [selectedFormation, setSelectedFormation] = useState<string>("");
  const [progressionData, setProgressionData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingFormations, setLoadingFormations] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!currentUser) return;
    getFormations({ mine: true })
      .then((data) => {
        setFormations(data);
        if (data.length > 0) setSelectedFormation(data[0].id);
      })
      .catch(() => toast.error("Impossible de charger les formations"))
      .finally(() => setLoadingFormations(false));
  }, []);

  useEffect(() => {
    if (!selectedFormation) return;
    setLoading(true);
    getProgressionFormateur(selectedFormation)
      .then(setProgressionData)
      .catch(() => toast.error("Impossible de charger la progression"))
      .finally(() => setLoading(false));
  }, [selectedFormation]);

  if (
    !currentUser ||
    (currentUser.role !== "instructor" && currentUser.role !== "admin")
  ) {
    navigate("/app");
    return null;
  }

  const apprenants = progressionData?.apprenants ?? [];
  const filtered = apprenants.filter(
    (a: any) =>
      search === "" ||
      `${a.prenom} ${a.nom}`.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()),
  );

  const avgProgress =
    apprenants.length > 0
      ? Math.round(
          apprenants.reduce((s: number, a: any) => s + a.pourcentage, 0) /
            apprenants.length,
        )
      : 0;

  const completed = apprenants.filter((a: any) => a.complete).length;

  // Export CSV
  const exportCSV = () => {
    const rows = [
      ["Prénom", "Nom", "Email", "Progression (%)", "Terminé"],
      ...apprenants.map((a: any) => [
        a.prenom,
        a.nom,
        a.email,
        a.pourcentage,
        a.complete ? "Oui" : "Non",
      ]),
    ];
    const csv = rows.map((r) => r.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `progression_${selectedFormation}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV téléchargé !");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/30">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/app")}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Retour
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            Progression des apprenants
          </h1>
        </motion.div>

        {/* Sélection formation */}
        <div className="flex flex-wrap gap-4 items-center">
          <Select
            value={selectedFormation}
            onValueChange={setSelectedFormation}
          >
            <SelectTrigger className="w-72">
              <SelectValue placeholder="Choisir une formation" />
            </SelectTrigger>
            <SelectContent>
              {formations.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {progressionData && (
            <Button variant="outline" onClick={exportCSV} className="gap-2">
              <Download className="w-4 h-4" /> Exporter CSV
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          </div>
        ) : progressionData ? (
          <>
            {/* Stats globales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold dark:text-white">
                      {progressionData.nb_inscrits}
                    </p>
                    <p className="text-sm text-gray-500">Apprenants inscrits</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold dark:text-white">
                      {avgProgress}%
                    </p>
                    <p className="text-sm text-gray-500">Progression moyenne</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold dark:text-white">
                      {completed}
                    </p>
                    <p className="text-sm text-gray-500">
                      Formations terminées
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Liste apprenants */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <CardTitle>Progression par apprenant</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Rechercher un apprenant..."
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filtered.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">
                    Aucun apprenant inscrit
                  </p>
                ) : (
                  <div className="space-y-4">
                    {filtered.map((a: any) => (
                      <div
                        key={a.user_id}
                        className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0">
                          {a.prenom[0]}
                          {a.nom[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold dark:text-white truncate">
                            {a.prenom} {a.nom}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {a.email}
                          </p>
                          <Progress
                            value={a.pourcentage}
                            className="h-1.5 mt-2"
                          />
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-sm font-bold dark:text-white">
                            {a.pourcentage}%
                          </span>
                          {a.complete ? (
                            <Badge className="bg-green-100 text-green-700">
                              ✓ Terminé
                            </Badge>
                          ) : (
                            <Badge variant="secondary">En cours</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  );
};
