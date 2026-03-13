import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { Search, Filter, Plus, BookOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { mockCourses, mockModules } from '../data/mockData';
import { CourseCard } from '../components/CourseCard';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';

export const Courses: React.FC = () => {
  const { currentUser, courses, setCourses, userProgress } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
  const [showMyCourses, setShowMyCourses] = useState(false);

  useEffect(() => {
    // Initialization now handled in AppContext
  }, []);

  const categories = ['all', ...Array.from(new Set(courses.map(c => c.category)))];
  const levels = ['all', 'Débutant', 'Intermédiaire', 'Avancé'];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    const matchesLevel = selectedLevel === 'all' || course.level === selectedLevel;

    let matchesMyCourses = true;
    if (showMyCourses && currentUser) {
      if (currentUser.role === 'admin' || currentUser.role === 'instructor') {
        matchesMyCourses = course.instructorId === currentUser.id;
      } else if (currentUser.role === 'learner') {
        matchesMyCourses = !!userProgress[`${currentUser.id}-${course.id}`];
      }
    }
    
    return matchesSearch && matchesCategory && matchesLevel && matchesMyCourses;
  });

  const handleEditCourse = (courseId: string) => {
    toast.info('Redirection vers l\'éditeur de formation...');
    navigate(`/app/courses/edit/${courseId}`);
  };

  const handleDeleteCourse = (courseId: string) => {
    setCourseToDelete(courseId);
  };

  const confirmDeleteCourse = () => {
    if (courseToDelete) {
      setCourses(courses.filter(c => c.id !== courseToDelete));
      toast.success('Formation supprimée avec succès !');
      setCourseToDelete(null);
    }
  };

  const isAdminOrInstructor = currentUser?.role === 'admin' || currentUser?.role === 'instructor';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 dark:from-slate-950 dark:to-purple-950/30">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Catalogue de formations
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {showMyCourses
                ? `${filteredCourses.length} formation${filteredCourses.length > 1 ? 's' : ''} trouvée${filteredCourses.length > 1 ? 's' : ''}`
                : `Explorez ${courses.length} formations disponibles`}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Bouton Mes formations pour apprenant et formateur (à gauche de Créer) */}
            {(currentUser?.role === 'learner' || currentUser?.role === 'instructor') && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => setShowMyCourses(!showMyCourses)}
                  variant={showMyCourses ? 'default' : 'outline'}
                  className={showMyCourses
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white gap-2'
                    : 'border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-950/30 gap-2'
                  }
                >
                  <BookOpen className="w-5 h-5" />
                  Mes formations
                </Button>
              </motion.div>
            )}

            {/* Bouton Créer une formation pour formateur et admin */}
            {(currentUser?.role === 'instructor' || currentUser?.role === 'admin') && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => navigate('/app/courses/create')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Créer une formation
                </Button>
              </motion.div>
            )}

            {/* Bouton Mes formations pour admin (à droite de Créer) */}
            {currentUser?.role === 'admin' && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => setShowMyCourses(!showMyCourses)}
                  variant={showMyCourses ? 'default' : 'outline'}
                  className={showMyCourses
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white gap-2'
                    : 'border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-950/30 gap-2'
                  }
                >
                  <BookOpen className="w-5 h-5" />
                  Mes formations
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Rechercher une formation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <SelectValue placeholder="Catégorie" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.filter(c => c !== 'all').map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Niveau" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les niveaux</SelectItem>
                {levels.filter(l => l !== 'all').map(level => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters */}
          <div className="flex flex-wrap gap-2">
            {searchQuery && (
              <Badge variant="secondary" className="gap-1">
                Recherche: {searchQuery}
              </Badge>
            )}
            {selectedCategory !== 'all' && (
              <Badge variant="secondary">
                {selectedCategory}
              </Badge>
            )}
            {selectedLevel !== 'all' && (
              <Badge variant="secondary">
                {selectedLevel}
              </Badge>
            )}
          </div>
        </motion.div>

        {/* Courses Grid */}
        <AnimatePresence mode="wait">
          {filteredCourses.length > 0 ? (
            <motion.div
              key="courses-grid"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredCourses.map((course, index) => {
                const progress = currentUser 
                  ? userProgress[`${currentUser.id}-${course.id}`]?.overallProgress 
                  : undefined;
                
                return (
                  <motion.div
                    key={course.id}
                    variants={itemVariants}
                    layout
                  >
                    <CourseCard
                      course={course}
                      progress={progress}
                      onView={() => navigate(`/app/courses/${course.id}`)}
                      onEdit={isAdminOrInstructor ? () => handleEditCourse(course.id) : undefined}
                      onDelete={isAdminOrInstructor ? () => handleDeleteCourse(course.id) : undefined}
                      showAdminActions={isAdminOrInstructor}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="no-results"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-16"
            >
              <div className="inline-block p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-sm">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                  Aucune formation trouvée
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {showMyCourses
                    ? currentUser?.role === 'learner'
                      ? 'Vous n\'êtes inscrit à aucune formation pour le moment'
                      : 'Vous n\'avez pas encore créé de formation'
                    : 'Essayez de modifier vos filtres de recherche'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!courseToDelete} onOpenChange={() => setCourseToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette formation ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCourseToDelete(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmDeleteCourse}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};