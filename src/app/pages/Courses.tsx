// src/app/pages/Courses.tsx — connecté au vrai backend
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { Search, Plus, BookOpen, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getFormations, getCategories, deleteFormation } from '../services/formationService';
import { CourseCard } from '../components/CourseCard';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import type { Course } from '../types';
import axios from 'axios';

export const Courses: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses]           = useState<Course[]>([]);
  const [categories, setCategories]     = useState<string[]>([]);
  const [loading, setLoading]           = useState(true);
  const [searchQuery, setSearchQuery]   = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel]       = useState('all');
  const [courseToDelete, setCourseToDelete]     = useState<string | null>(null);
  const [deleting, setDeleting]                 = useState(false);
  const [showMine, setShowMine]                 = useState(false);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getFormations({
        search:    searchQuery,
        categorie: selectedCategory,
        niveau:    selectedLevel,
        mine:      showMine,
      });
      setCourses(data);
    } catch {
      toast.error('Impossible de charger les formations');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedLevel, showMine]);

  // Charger les catégories une seule fois
  useEffect(() => {
    getCategories().then(cats => setCategories(cats)).catch(() => {});
  }, []);

  // Recharger à chaque changement de filtre (avec debounce pour la recherche)
  useEffect(() => {
    const t = setTimeout(() => loadCourses(), searchQuery ? 400 : 0);
    return () => clearTimeout(t);
  }, [loadCourses]);

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    setDeleting(true);
    try {
      await deleteFormation(courseToDelete);
      setCourses(prev => prev.filter(c => c.id !== courseToDelete));
      toast.success('✅ Formation supprimée avec succès');
      setCourseToDelete(null);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) toast.error(error.response?.data?.message || 'Erreur');
      else toast.error('Une erreur est survenue');
    } finally {
      setDeleting(false);
    }
  };

  const canCreate = currentUser?.role === 'instructor' || currentUser?.role === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/10">
      <div className="max-w-7xl mx-auto p-6 space-y-6">

        {/* En-tête */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-600" /> Formations
            </h1>
            <p className="text-gray-500 mt-1">{courses.length} formation(s) disponible(s)</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={loadCourses} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </Button>
            {canCreate && (
              <Button onClick={() => navigate('/app/courses/create')} className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600">
                <Plus className="w-4 h-4" /> Créer une formation
              </Button>
            )}
          </div>
        </div>

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher par titre ou description..."
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Catégorie" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Niveau" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les niveaux</SelectItem>
              <SelectItem value="debutant">Débutant</SelectItem>
              <SelectItem value="intermediaire">Intermédiaire</SelectItem>
              <SelectItem value="avance">Avancé</SelectItem>
            </SelectContent>
          </Select>
          {(currentUser?.role === 'instructor' || currentUser?.role === 'admin') && (
            <Button
              variant={showMine ? 'default' : 'outline'}
              onClick={() => setShowMine(!showMine)}
            >
              {showMine ? 'Mes formations ✓' : 'Mes formations'}
            </Button>
          )}
        </div>

        {/* Grille de formations */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-500">Aucune formation trouvée</p>
            <p className="text-gray-400 mt-1">Essayez de modifier vos filtres de recherche</p>
          </div>
        ) : (
          <AnimatePresence>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {courses.map((course, i) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <CourseCard
                    course={course}
                    onView={() => navigate(`/app/courses/${course.id}`)}
                    onEdit={canCreate ? () => navigate(`/app/courses/edit/${course.id}`) : undefined}
                    onDelete={canCreate ? () => setCourseToDelete(course.id) : undefined}
                    showAdminActions={canCreate}
                  />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* ── Modale confirmation suppression ── */}
      <Dialog open={!!courseToDelete} onOpenChange={() => setCourseToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la formation ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Tous les modules et contenus associés seront supprimés.
              Les apprenants inscrits seront notifiés.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCourseToDelete(null)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDeleteCourse} disabled={deleting}>
              {deleting ? 'Suppression...' : 'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
