import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { User, Mail, Phone, Calendar, Globe, Award, BookOpen, TrendingUp, Edit } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';

export const Profile: React.FC = () => {
  const { currentUser, courses, userProgress } = useApp();
  const navigate = useNavigate();

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  const userProgressData = Object.values(userProgress).filter(
    p => p.userId === currentUser.id
  );

  const enrolledCourses = courses.filter(course =>
    userProgressData.some(p => p.courseId === course.id)
  );

  const allBadges = userProgressData.flatMap(p => p.badges);
  const totalQuizzes = userProgressData.reduce((sum, p) => sum + p.quizAttempts.length, 0);
  const avgQuizScore = totalQuizzes > 0
    ? Math.round(
        userProgressData
          .flatMap(p => p.quizAttempts)
          .reduce((sum, a) => sum + a.score, 0) / totalQuizzes
      )
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className="h-48 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl" />
          <div className="absolute bottom-0 left-8 transform translate-y-1/2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="w-32 h-32 rounded-full bg-white p-1 shadow-xl"
            >
              <Avatar className="w-full h-full">
                <AvatarImage src={currentUser.avatar} className="object-cover rounded-full" />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-4xl rounded-full flex items-center justify-center w-full h-full">
                  {currentUser.firstName[0]}{currentUser.lastName[0]}
                </AvatarFallback>
              </Avatar>
            </motion.div>
          </div>
        </motion.div>

        {/* User Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="ml-44 space-y-2"
        >
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">
                {currentUser.firstName} {currentUser.lastName}
              </h1>
              <Badge className="capitalize mt-2">
                {currentUser.role === 'learner' ? 'Apprenant' : currentUser.role === 'instructor' ? 'Formateur' : 'Administrateur'}
              </Badge>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => navigate('/app/profile/edit')}
                className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Edit className="w-4 h-4" />
                Modifier mon profil
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{enrolledCourses.length}</p>
                  <p className="text-sm text-gray-600">Formations</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{avgQuizScore}%</p>
                  <p className="text-sm text-gray-600">Score moyen</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Award className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{allBadges.length}</p>
                  <p className="text-sm text-gray-600">Badges</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalQuizzes}</p>
                  <p className="text-sm text-gray-600">Quiz réussis</p>
                </div>
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
                        <p className="font-medium">{currentUser.firstName} {currentUser.lastName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{currentUser.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Téléphone</p>
                        <p className="font-medium">{currentUser.phone}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Date de naissance</p>
                        <p className="font-medium">{new Date(currentUser.dateOfBirth).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Langue préférée</p>
                        <p className="font-medium capitalize">{currentUser.preferredLanguage}</p>
                      </div>
                    </div>
                  </div>

                  {currentUser.targetDomains.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Domaines d'intérêt</p>
                      <div className="flex flex-wrap gap-2">
                        {currentUser.targetDomains.map((domain, index) => (
                          <Badge key={index} variant="secondary">{domain}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentUser.technologies.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Technologies</p>
                      <div className="flex flex-wrap gap-2">
                        {currentUser.technologies.map((tech, index) => (
                          <Badge key={index}>{tech}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentUser.role === 'learner' && (
                    <div className="pt-4">
                      <Button
                        onClick={() => navigate('/app/become-instructor')}
                        variant="outline"
                        className="gap-2"
                      >
                        <Award className="w-4 h-4" />
                        Devenir formateur
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="progress">
              <Card>
                <CardHeader>
                  <CardTitle>Ma progression</CardTitle>
                </CardHeader>
                <CardContent>
                  {enrolledCourses.length > 0 ? (
                    <div className="space-y-6">
                      {enrolledCourses.map(course => {
                        const progress = userProgress[`${currentUser.id}-${course.id}`];
                        return (
                          <div key={course.id} className="space-y-2">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-semibold">{course.title}</p>
                                <p className="text-sm text-gray-500">{course.category}</p>
                              </div>
                              <Badge>{progress?.overallProgress || 0}%</Badge>
                            </div>
                            <Progress value={progress?.overallProgress || 0} />
                            {progress && Object.keys(progress.moduleProgress).length > 0 && (
                              <div className="text-xs text-gray-500">
                                {Object.keys(progress.moduleProgress).length} modules en cours
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Aucune formation inscrite
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="badges">
              <Card>
                <CardHeader>
                  <CardTitle>Mes badges ({allBadges.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {allBadges.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {allBadges.map((badge, index) => (
                        <motion.div
                          key={badge.id}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.05, type: 'spring' }}
                          className="flex flex-col items-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl hover:shadow-lg transition-shadow"
                        >
                          <span className="text-5xl mb-2">{badge.icon}</span>
                          <p className="font-semibold text-sm text-center">{badge.name}</p>
                          <p className="text-xs text-gray-500 text-center mt-1">{badge.description}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(badge.earnedAt).toLocaleDateString('fr-FR')}
                          </p>
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