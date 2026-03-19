// src/app/pages/CourseDetail.tsx — inscription connectée au vrai backend
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Clock, BarChart, BookOpen, CheckCircle, ArrowLeft, User, Award, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getFormation, enrollFormation } from '../services/formationService';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { toast } from 'sonner';
import type { Course } from '../types';
import axios from 'axios';

export const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [course, setCourse]       = useState<(Course & { isEnrolled?: boolean }) | null>(null);
  const [loading, setLoading]     = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getFormation(id)
      .then(c => setCourse(c as Course & { isEnrolled?: boolean }))
      .catch(() => toast.error('Formation introuvable'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleEnroll = async () => {
    if (!currentUser) { navigate('/login'); return; }
    if (currentUser.role !== 'learner') {
      toast.error('Seuls les apprenants peuvent s\'inscrire'); return;
    }
    setEnrolling(true);
    try {
      await enrollFormation(id!);
      setCourse(prev => prev ? { ...prev, isEnrolled: true } : prev);
      toast.success('✅ Inscription réussie ! Vous pouvez commencer la formation.');
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Impossible de s\'inscrire');
      } else {
        toast.error('Une erreur est survenue');
      }
    } finally {
      setEnrolling(false);
    }
  };

  const levelColors: Record<string, string> = {
    'Débutant':     'bg-green-100 text-green-700',
    'Intermédiaire': 'bg-yellow-100 text-yellow-700',
    'Avancé':       'bg-red-100 text-red-700',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-800 mb-4">Formation non trouvée</p>
          <Button onClick={() => navigate('/app/courses')}>Retour aux formations</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="max-w-5xl mx-auto p-6 space-y-6">

        <Button variant="ghost" onClick={() => navigate('/app/courses')} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Retour aux formations
        </Button>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="overflow-hidden">
            {course.thumbnail && (
              <div className="h-48 overflow-hidden">
                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
              </div>
            )}
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-blue-100 text-blue-700">{course.category}</Badge>
                    <Badge className={levelColors[course.level] ?? ''}>{course.level}</Badge>
                    {(course as any).isEnrolled && (
                      <Badge className="bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" /> Inscrit
                      </Badge>
                    )}
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
                  <p className="text-gray-600">{course.description}</p>
                </div>
              </div>

              {/* Infos rapides */}
              <div className="flex flex-wrap gap-6 text-sm text-gray-600 border-t pt-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span>{course.estimatedDuration} heures</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  <span>{course.modules.length} module(s)</span>
                </div>
                {course.instructor && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-500" />
                    <span>{course.instructor.firstName} {course.instructor.lastName}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <BarChart className="w-4 h-4 text-blue-500" />
                  <span>{course.level}</span>
                </div>
              </div>

              {/* Prérequis */}
              {course.prerequisites.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Prérequis :</p>
                  <div className="flex flex-wrap gap-2">
                    {course.prerequisites.map((p, i) => (
                      <Badge key={i} variant="outline">{p}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Bouton inscription */}
              {currentUser?.role === 'learner' && (
                <div className="border-t pt-4">
                  {(course as any).isEnrolled ? (
                    <div className="flex items-center gap-2 text-green-600 font-medium">
                      <CheckCircle className="w-5 h-5" /> Vous êtes inscrit à cette formation
                    </div>
                  ) : (
                    <Button onClick={handleEnroll} disabled={enrolling} className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600">
                      {enrolling ? <><Loader2 className="w-4 h-4 animate-spin" /> Inscription...</> : <><Award className="w-4 h-4" /> S'inscrire à cette formation</>}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Modules */}
        {course.modules.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" /> Contenu de la formation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="space-y-2">
                  {course.modules.sort((a, b) => a.order - b.order).map((module, i) => (
                    <AccordionItem key={module.id} value={module.id} className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 text-left">
                          <span className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                            {i + 1}
                          </span>
                          <div>
                            <p className="font-medium">{module.title}</p>
                            <p className="text-xs text-gray-500">{module.duration} min</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-gray-600 text-sm pl-11 pb-2">
                          {module.description || 'Aucune description disponible.'}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};
