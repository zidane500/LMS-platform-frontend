import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { 
  Clock, 
  BarChart, 
  BookOpen, 
  Play, 
  CheckCircle, 
  Lock,
  ArrowLeft,
  User,
  Award
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { toast } from 'sonner';

export const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, courses, userProgress, setUserProgress, modules, quizzes } = useApp();
  const [isEnrolled, setIsEnrolled] = useState(false);

  const course = courses.find(c => c.id === id);
  const courseModules = modules.filter(m => m.courseId === id).sort((a, b) => a.order - b.order);
  const courseQuizzes = quizzes.filter(q => 
    courseModules.some(m => m.id === q.moduleId)
  );

  useEffect(() => {
    if (currentUser && course) {
      const enrolled = !!userProgress[`${currentUser.id}-${course.id}`];
      setIsEnrolled(enrolled);
    }
  }, [currentUser, course, userProgress]);

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-800 mb-4">Formation non trouvée</p>
          <Button onClick={() => navigate('/app/courses')}>
            Retour aux formations
          </Button>
        </div>
      </div>
    );
  }

  const progress = currentUser 
    ? userProgress[`${currentUser.id}-${course.id}`] 
    : undefined;

  const handleEnroll = () => {
    if (!currentUser) {
      toast.error('Veuillez vous connecter pour vous inscrire');
      navigate('/login');
      return;
    }

    // Vérifier que l'utilisateur est un apprenant
    if (currentUser.role !== 'learner') {
      toast.error('Seuls les apprenants peuvent s\'inscrire aux formations');
      return;
    }

    const newProgress = {
      userId: currentUser.id,
      courseId: course.id,
      moduleProgress: {},
      overallProgress: 0,
      completedContents: [],
      quizAttempts: [],
      badges: [{
        id: 'b-' + Date.now(),
        name: 'Nouveau Départ',
        description: 'Inscription à une nouvelle formation',
        icon: '���',
        earnedAt: new Date().toISOString(),
      }],
      lastActivity: new Date().toISOString(),
    };

    setUserProgress({
      ...userProgress,
      [`${currentUser.id}-${course.id}`]: newProgress,
    });

    setIsEnrolled(true);
    toast.success('✅ Inscription réussie ! Badge "Nouveau Départ" obtenu !');
  };

  const levelColors = {
    'Débutant': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
    'Intermédiaire': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
    'Avancé': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  };

  // Vérifier si l'utilisateur peut s'inscrire (seulement les apprenants)
  const canEnroll = currentUser?.role === 'learner';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/app/courses')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux formations
          </Button>
        </motion.div>

        {/* Course Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden"
        >
          <div className="absolute inset-0">
            <img 
              src={course.thumbnail} 
              alt={course.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40" />
          </div>
          
          <div className="relative p-8 md:p-12 text-white">
            <Badge className={`${levelColors[course.level]} mb-4`}>
              {course.level}
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {course.title}
            </h1>
            <p className="text-xl text-gray-200 mb-6 max-w-3xl">
              {course.description}
            </p>

            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>{course.estimatedDuration} heures</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                <span>{courseModules.length} modules</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart className="w-5 h-5" />
                <span>{course.category}</span>
              </div>
            </div>

            {isEnrolled && progress && (
              <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-lg p-4 max-w-md">
                <div className="flex justify-between text-sm mb-2">
                  <span>Votre progression</span>
                  <span className="font-bold">{progress.overallProgress}%</span>
                </div>
                <Progress value={progress.overallProgress} className="h-2" />
              </div>
            )}

            <div className="mt-8">
              {isEnrolled ? (
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 gap-2"
                >
                  <Play className="w-5 h-5" />
                  Continuer la formation
                </Button>
              ) : (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="lg"
                    onClick={handleEnroll}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-2"
                    disabled={!canEnroll}
                  >
                    <Award className="w-5 h-5" />
                    S'inscrire maintenant
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Course Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="modules" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="modules">Modules</TabsTrigger>
              <TabsTrigger value="about">À propos</TabsTrigger>
              <TabsTrigger value="instructor">Formateur</TabsTrigger>
            </TabsList>

            <TabsContent value="modules" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Contenu de la formation</CardTitle>
                </CardHeader>
                <CardContent>
                  {courseModules.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                      {courseModules.map((module, index) => {
                        const moduleProgress = progress?.moduleProgress[module.id] || 0;
                        const isCompleted = moduleProgress === 100;
                        const isLocked = !isEnrolled && index > 0;

                        return (
                          <AccordionItem key={module.id} value={module.id}>
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center gap-4 w-full">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  isCompleted 
                                    ? 'bg-green-100 text-green-600' 
                                    : isLocked 
                                    ? 'bg-gray-100 text-gray-400'
                                    : 'bg-blue-100 text-blue-600'
                                }`}>
                                  {isCompleted ? (
                                    <CheckCircle className="w-5 h-5" />
                                  ) : isLocked ? (
                                    <Lock className="w-5 h-5" />
                                  ) : (
                                    <span className="font-bold">{index + 1}</span>
                                  )}
                                </div>
                                <div className="flex-1 text-left">
                                  <p className="font-semibold">{module.title}</p>
                                  <p className="text-sm text-gray-500">{module.duration} min</p>
                                </div>
                                {isEnrolled && (
                                  <Badge variant={isCompleted ? 'default' : 'outline'}>
                                    {moduleProgress}%
                                  </Badge>
                                )}
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="pl-14 space-y-3">
                                <p className="text-gray-600">{module.description}</p>
                                
                                {module.contents.length > 0 && (
                                  <div className="space-y-2">
                                    <p className="font-semibold text-sm">Contenus :</p>
                                    {module.contents.map(content => (
                                      <div key={content.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <Play className="w-4 h-4 text-blue-600" />
                                        <div className="flex-1">
                                          <p className="text-sm font-medium">{content.title}</p>
                                          <p className="text-xs text-gray-500">{content.duration} min • {content.type}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {courseQuizzes.find(q => q.moduleId === module.id) && (
                                  <div className="p-3 bg-purple-50 rounded-lg">
                                    <p className="text-sm font-semibold text-purple-900 mb-1">
                                      📝 Quiz disponible
                                    </p>
                                    <p className="text-xs text-purple-700 mb-2">
                                      Testez vos connaissances à la fin de ce module
                                    </p>
                                    {isEnrolled && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => {
                                          const quiz = courseQuizzes.find(q => q.moduleId === module.id);
                                          if (quiz) {
                                            navigate(`/app/courses/${course.id}/quiz/${quiz.id}`);
                                          }
                                        }}
                                      >
                                        Commencer le quiz
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      Les modules seront bientôt disponibles
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="about">
              <Card>
                <CardHeader>
                  <CardTitle>À propos de cette formation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-gray-600">{course.description}</p>
                  </div>

                  {course.prerequisites.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Prérequis</h3>
                      <ul className="list-disc list-inside space-y-1 text-gray-600">
                        {course.prerequisites.map((prereq, index) => (
                          <li key={index}>{prereq}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold mb-2">Informations</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Catégorie:</span>
                        <p className="font-medium">{course.category}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Niveau:</span>
                        <p className="font-medium">{course.level}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Durée estimée:</span>
                        <p className="font-medium">{course.estimatedDuration} heures</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Modules:</span>
                        <p className="font-medium">{courseModules.length}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="instructor">
              <Card>
                <CardHeader>
                  <CardTitle>Votre formateur</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                      MM
                    </div>
                    <div>
                      <p className="font-semibold text-lg">Marie Martin</p>
                      <p className="text-gray-500">Formatrice experte</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};