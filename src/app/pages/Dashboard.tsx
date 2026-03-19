import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { BookOpen, TrendingUp, Award, Clock, FileCheck, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { mockCourses, mockProgress, mockModules, mockInstructorRequests } from '../data/mockData';
import { CourseCard } from '../components/CourseCard';
import { ProgressCard } from '../components/ProgressCard';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

export const Dashboard: React.FC = () => {
  const { currentUser, courses, setCourses, userProgress, setUserProgress, instructorRequests } = useApp();
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState<typeof mockCourses>([]);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);

  useEffect(() => {
    // Initialization now handled in AppContext
  }, []);

  useEffect(() => {
    if (currentUser && courses.length > 0) {
      const enrolled = courses.filter(course => 
        userProgress[`${currentUser.id}-${course.id}`]
      );
      setEnrolledCourses(enrolled);
    }
  }, [currentUser, courses, userProgress]);

  if (!currentUser) {
    return null;
  }

  const userProgressData = Object.values(userProgress).filter(
    p => p.userId === currentUser.id
  );

  const totalBadges = userProgressData.reduce((sum, p) => sum + p.badges.length, 0);
  const avgProgress = userProgressData.length > 0
    ? Math.round(userProgressData.reduce((sum, p) => sum + p.overallProgress, 0) / userProgressData.length)
    : 0;
  const totalQuizzes = userProgressData.reduce((sum, p) => sum + p.quizAttempts.length, 0);

  const isAdminOrInstructor = currentUser.role === 'admin' || currentUser.role === 'instructor';

  // Vérifier s'il y a une demande de formateur pour l'utilisateur actuel
  const userInstructorRequest = instructorRequests.find(req => req.userId === currentUser.id);

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
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/30">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Bienvenue, {currentUser.firstName} !
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Continuez votre parcours d'apprentissage
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <motion.div variants={itemVariants}>
            <ProgressCard
              title="Formations actives"
              value={enrolledCourses.length}
              icon="target"
              color="blue"
              suffix=""
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <ProgressCard
              title="Progression moyenne"
              value={avgProgress}
              icon="zap"
              color="purple"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <ProgressCard
              title="Badges obtenus"
              value={totalBadges}
              icon="award"
              color="green"
              suffix=""
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <ProgressCard
              title="Quiz complétés"
              value={totalQuizzes}
              icon="trophy"
              color="orange"
              suffix=""
            />
          </motion.div>
        </motion.div>

        {/* Instructor Request Status - Visible uniquement si une demande existe */}
        {userInstructorRequest && currentUser.role === 'learner' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className={
              userInstructorRequest.status === 'pending'
                ? 'border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20 dark:border-yellow-800'
                : userInstructorRequest.status === 'accepted'
                ? 'border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800'
                : 'border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-800'
            }>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${
                    userInstructorRequest.status === 'pending'
                      ? 'bg-yellow-100 dark:bg-yellow-900/30'
                      : userInstructorRequest.status === 'accepted'
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : 'bg-red-100 dark:bg-red-900/30'
                  }`}>
                    {userInstructorRequest.status === 'pending' && (
                      <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                    )}
                    {userInstructorRequest.status === 'accepted' && (
                      <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                    )}
                    {userInstructorRequest.status === 'rejected' && (
                      <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {userInstructorRequest.status === 'pending' && 'Demande de formateur en cours'}
                        {userInstructorRequest.status === 'accepted' && 'Demande de formateur acceptée !'}
                        {userInstructorRequest.status === 'rejected' && 'Demande de formateur refusée'}
                      </h3>
                      <Badge
                        variant={
                          userInstructorRequest.status === 'accepted'
                            ? 'default'
                            : userInstructorRequest.status === 'rejected'
                            ? 'destructive'
                            : 'secondary'
                        }
                        className={
                          userInstructorRequest.status === 'pending'
                            ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                            : ''
                        }
                      >
                        {userInstructorRequest.status === 'pending' && 'En attente'}
                        {userInstructorRequest.status === 'accepted' && 'Acceptée'}
                        {userInstructorRequest.status === 'rejected' && 'Refusée'}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {userInstructorRequest.status === 'pending' && 
                        'Votre candidature pour devenir formateur est en cours d\'examen. Vous recevrez une notification dès qu\'une décision sera prise.'
                      }
                      {userInstructorRequest.status === 'accepted' && 
                        '🎉 Félicitations ! Votre candidature a été approuvée. Vous pouvez maintenant créer et gérer des formations.'
                      }
                      {userInstructorRequest.status === 'rejected' && 
                        'Votre candidature n\'a malheureusement pas été retenue cette fois. Vous pouvez soumettre une nouvelle demande ultérieurement.'
                      }
                    </p>

                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Spécialité : </span>
                        <span className="font-medium text-gray-900 dark:text-white">{userInstructorRequest.specialty}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Expérience : </span>
                        <span className="font-medium text-gray-900 dark:text-white">{userInstructorRequest.experience} ans</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Date : </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {new Date(userInstructorRequest.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>

                    {userInstructorRequest.status === 'accepted' && (
                      <div className="mt-4">
                        <Button
                          onClick={() => navigate('/app/courses/create')}
                          className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          <FileCheck className="w-4 h-4" />
                          Créer ma première formation
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Active Courses */}
        {enrolledCourses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                  Mes formations en cours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {enrolledCourses.map((course, index) => {
                    const progress = userProgress[`${currentUser.id}-${course.id}`];
                    return (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <CourseCard
                          course={course}
                          progress={progress?.overallProgress}
                          onView={() => navigate(`/app/courses/${course.id}`)}
                          onEdit={isAdminOrInstructor ? () => handleEditCourse(course.id) : undefined}
                          onDelete={isAdminOrInstructor ? () => handleDeleteCourse(course.id) : undefined}
                          showAdminActions={isAdminOrInstructor}
                        />
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Recent Badges */}
        {totalBadges > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-6 h-6 text-purple-600" />
                  Badges récents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  {userProgressData.flatMap(p => p.badges).slice(0, 6).map((badge, index) => (
                    <motion.div
                      key={badge.id}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1, type: 'spring' }}
                    >
                      <div className="flex flex-col items-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-xl hover:shadow-lg transition-shadow cursor-pointer">
                        <span className="text-4xl mb-2">{badge.icon}</span>
                        <p className="font-semibold text-sm text-center dark:text-white">{badge.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">{badge.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-blue-600 to-purple-600 text-white">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold mb-2">
                    Prêt à explorer de nouvelles formations ?
                  </h3>
                  <p className="text-blue-100">
                    Découvrez notre catalogue complet de cours
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/app/courses')}
                  className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:shadow-xl transition-shadow whitespace-nowrap"
                >
                  Voir toutes les formations
                </motion.button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!courseToDelete} onOpenChange={() => setCourseToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous s��r de vouloir supprimer cette formation ? Cette action est irréversible.
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