import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate, useLocation } from "react-router";
import { Search, Plus, BookOpen, RefreshCw, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getFormations,
  getCategories,
  getInstructors,
  deleteFormation,
} from "../services/formationService";
import { CourseCard } from "../components/CourseCard";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { toast } from "sonner";
import type { Course } from "../types";
import axios from "axios";
import type { Instructor } from "../services/formationService";
import { useUnlockedFormations } from "../hooks/useUnlockedFormations";

export const Courses: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const location = useLocation();

  // ✅ true quand on est sur /formations ou /formations/:id
  const isPublicCoursesPage = location.pathname.startsWith("/formations");

  const isInstructorOrAdmin =
    !isPublicCoursesPage &&
    (currentUser?.role === "instructor" || currentUser?.role === "admin");

  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Filtres ──────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [selectedStatut, setSelectedStatut] = useState("all");
  const [selectedInstructor, setSelectedInstructor] = useState("all");
  const [showMine, setShowMine] = useState(false);
  // ✅ Fix 5 — Filtre formations codées
  const [filtreType, setFiltreType] = useState<"all" | "normale" | "codee">(
    "all",
  );

  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [certificatFormationIds, setCertificatFormationIds] = useState<
    string[]
  >([]);

  const { checkUnlocked } = useUnlockedFormations();

  // ── Chargement des formations ─────────────────────────────
  const loadCourses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getFormations({
        search: searchQuery,
        categorie: selectedCategory,
        niveau: selectedLevel,
        mine: showMine,
        statut: selectedStatut !== "all" ? selectedStatut : undefined,
        formateur_id:
          selectedInstructor !== "all" ? selectedInstructor : undefined,
        // ✅ Fix 5 — passer le filtre is_coded
        is_coded: filtreType === "codee" ? true : undefined,
      });
      setCourses(data);
    } catch {
      toast.error("Impossible de charger les formations");
    } finally {
      setLoading(false);
    }
  }, [
    searchQuery,
    selectedCategory,
    selectedLevel,
    showMine,
    selectedStatut,
    selectedInstructor,
    filtreType,
  ]);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {});
    getInstructors()
      .then(setInstructors)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadCourses(), searchQuery ? 400 : 0);
    return () => clearTimeout(t);
  }, [loadCourses]);

  const displayedCourses =
    filtreType === "normale" ? courses.filter((c) => !c.is_coded) : courses;

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    setDeleting(true);
    try {
      await deleteFormation(courseToDelete);
      setCourses((prev) => prev.filter((c) => c.id !== courseToDelete));
      toast.success("Formation supprimée avec succès");
      setCourseToDelete(null);
    } catch (error: unknown) {
      if (axios.isAxiosError(error))
        toast.error(error.response?.data?.message || "Erreur");
      else toast.error("Une erreur est survenue");
    } finally {
      setDeleting(false);
    }
  };

  const canEditCourse = (course: Course) => {
    // ✅ Sur la page publique, personne ne doit modifier/supprimer
    if (isPublicCoursesPage) return false;

    if (currentUser?.role === "admin") return true;

    if (currentUser?.role === "instructor") {
      return String(course.instructorId) === String(currentUser.id);
    }

    return false;
  };
  const handleViewCourse = (courseId: string) => {
    // ✅ Si on est dans la page publique, toujours rester en public
    if (isPublicCoursesPage) {
      navigate(`/formations/${courseId}`);
      return;
    }

    // ✅ Sinon, dans l'espace connecté
    navigate(`/app/courses/${courseId}`);
  };

  const handleTryEnroll = (courseId: string) => {
    // ✅ Sur la page publique, "Essai de l'obtenir" ouvre aussi le détail public
    if (isPublicCoursesPage) {
      navigate(`/formations/${courseId}`);
      return;
    }

    // ✅ Dans l'espace app
    if (currentUser) {
      navigate(`/app/courses/${courseId}`);
      return;
    }

    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/10">
      <main className="flex-1 w-full max-w-7xl mx-auto p-6 space-y-6">
        {/* ── En-tête ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-600" /> Formations
            </h1>
            <p className="text-gray-500 mt-1">
              {displayedCourses.length} formation(s) trouvée(s)
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={loadCourses} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </Button>
            {isInstructorOrAdmin && (
              <Button
                onClick={() => navigate("/app/courses/create")}
                className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600"
              >
                <Plus className="w-4 h-4" /> Créer une formation
              </Button>
            )}
          </div>
        </div>

        {/* ── Filtres ── */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Recherche */}
          <div className="relative flex-1 min-w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="pl-10"
            />
          </div>

          {/* Catégorie */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Niveau */}
          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Niveau" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les niveaux</SelectItem>
              <SelectItem value="debutant">Débutant</SelectItem>
              <SelectItem value="intermediaire">Intermédiaire</SelectItem>
              <SelectItem value="avance">Avancé</SelectItem>
            </SelectContent>
          </Select>

          {/* Formateur */}
          {instructors.length > 0 && (
            <Select
              value={selectedInstructor}
              onValueChange={setSelectedInstructor}
            >
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Formateur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les formateurs</SelectItem>
                {instructors.map((inst) => (
                  <SelectItem key={inst.id} value={inst.id}>
                    {inst.prenom} {inst.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Statut */}
          {isInstructorOrAdmin && (
            <Select value={selectedStatut} onValueChange={setSelectedStatut}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Publiées</SelectItem>
                <SelectItem value="brouillon">🗒 Brouillons</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Mes formations */}
          {isInstructorOrAdmin && (
            <Button
              variant={showMine ? "default" : "outline"}
              onClick={() => setShowMine(!showMine)}
              className={
                showMine ? "bg-gradient-to-r from-blue-600 to-indigo-600" : ""
              }
            >
              {showMine ? "✓ Mes formations" : "Mes formations"}
            </Button>
          )}

          {/* ✅ REMPLACE UNIQUEMENT LE BOUTON "Codées" */}
          <Select
            value={filtreType}
            onValueChange={(v) =>
              setFiltreType(v as "all" | "normale" | "codee")
            }
          >
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Type de formation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les formations</SelectItem>
              <SelectItem value="normale">
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  Formation normale
                </span>
              </SelectItem>
              <SelectItem value="codee">
                <span className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-purple-500" />
                  Formation codée
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* ── Grille de formations ── */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displayedCourses.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-500">
              {filtreType === "codee"
                ? "Aucune formation codée trouvée"
                : "Aucune formation trouvée"}
            </p>
            <p className="text-gray-400 mt-1">
              {filtreType === "codee"
                ? "Il n'existe pas encore de formations codées correspondantes"
                : "Essayez de modifier vos filtres de recherche"}
            </p>
          </div>
        ) : (
          <AnimatePresence>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {displayedCourses.map((course, i) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <CourseCard
                    course={course}
                    isUnlocked={
                      isPublicCoursesPage
                        ? !course.is_coded
                        : !course.is_coded ||
                          (course as any).aAcces === true ||
                          checkUnlocked(String(course.id))
                    }
                    isOwner={
                      !isPublicCoursesPage &&
                      currentUser?.id === (course as any).instructorId
                    }
                    hasCertificate={
                      !isPublicCoursesPage &&
                      certificatFormationIds.includes(String(course.id))
                    }
                    isEnrolled={
                      !isPublicCoursesPage &&
                      ((course as any).isEnrolled ?? false)
                    }
                    onView={() => handleViewCourse(course.id)}
                    onEnroll={() => handleTryEnroll(course.id)}
                    onEdit={
                      canEditCourse(course)
                        ? () => navigate(`/app/courses/edit/${course.id}`)
                        : undefined
                    }
                    onDelete={
                      canEditCourse(course)
                        ? () => setCourseToDelete(course.id)
                        : undefined
                    }
                    showAdminActions={canEditCourse(course)}
                  />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </main>

      {/* ── Modale suppression ── */}
      <Dialog
        open={!!courseToDelete}
        onOpenChange={() => setCourseToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la formation ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Tous les modules et contenus seront
              supprimés.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCourseToDelete(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCourse}
              disabled={deleting}
            >
              {deleting ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 bg-white dark:bg-gray-950">
        <div className="flex justify-center">
          <p className="text-xs text-center text-gray-500">
            © {new Date().getFullYear()} LMS. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
};
