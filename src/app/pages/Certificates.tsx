import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Award, Download, FileCheck, Calendar, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface Certificate {
  id: string;
  courseId: string;
  courseTitle: string;
  instructorName: string;
  studentName: string;
  date: string;
  certificateNumber: string;
  mention: 'Passable' | 'Bien' | 'Très Bien' | 'Excellent';
  averageScore: number;
}

export const Certificates: React.FC = () => {
  const { currentUser, courses, userProgress } = useApp();
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  // Generate certificate PDF
  const generateCertificatePDF = (cert: Certificate) => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    // Background gradient simulation
    doc.setFillColor(245, 247, 250);
    doc.rect(0, 0, 297, 210, 'F');

    // Border
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(3);
    doc.rect(10, 10, 277, 190);
    
    doc.setLineWidth(1);
    doc.rect(12, 12, 273, 186);

    // Title
    doc.setFontSize(32);
    doc.setTextColor(79, 70, 229);
    doc.setFont('helvetica', 'bold');
    doc.text('CERTIFICAT DE RÉUSSITE', 148.5, 40, { align: 'center' });

    // Subtitle
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text('Ce certificat atteste que', 148.5, 55, { align: 'center' });

    // Student name
    doc.setFontSize(24);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(cert.studentName, 148.5, 70, { align: 'center' });

    // Course completion text
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text('a complété avec succès la formation', 148.5, 85, { align: 'center' });

    // Course title
    doc.setFontSize(20);
    doc.setTextColor(139, 92, 246);
    doc.setFont('helvetica', 'bold');
    doc.text(cert.courseTitle, 148.5, 100, { align: 'center' });

    // Mention
    doc.setFontSize(16);
    doc.setTextColor(79, 70, 229);
    doc.text(`Mention : ${cert.mention}`, 148.5, 115, { align: 'center' });
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`(Score moyen : ${cert.averageScore}%)`, 148.5, 123, { align: 'center' });

    // Certificate number
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`Numéro de certificat : ${cert.certificateNumber}`, 148.5, 145, { align: 'center' });

    // Date and instructor
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Date d'émission : ${new Date(cert.date).toLocaleDateString('fr-FR')}`, 40, 170);
    doc.text(`Formateur : ${cert.instructorName}`, 40, 180);

    // QR Code placeholder (would need a QR code library)
    doc.setDrawColor(200, 200, 200);
    doc.rect(220, 155, 30, 30);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('QR Code', 235, 172, { align: 'center' });

    // Save PDF
    doc.save(`Certificat_${cert.courseTitle.replace(/\s+/g, '_')}_${cert.studentName.replace(/\s+/g, '_')}.pdf`);
    toast.success('📄 Certificat téléchargé avec succès !');
  };

  // Calculate mention based on average score
  const calculateMention = (score: number): Certificate['mention'] => {
    if (score >= 95) return 'Excellent';
    if (score >= 85) return 'Très Bien';
    if (score >= 70) return 'Bien';
    return 'Passable';
  };

  // Get mention color
  const getMentionColor = (mention: Certificate['mention']) => {
    switch (mention) {
      case 'Excellent':
        return 'bg-gradient-to-r from-yellow-500 to-orange-500';
      case 'Très Bien':
        return 'bg-gradient-to-r from-green-500 to-emerald-500';
      case 'Bien':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case 'Passable':
        return 'bg-gradient-to-r from-gray-500 to-slate-500';
    }
  };

  // Get eligible certificates (formations completed with quiz passed)
  const eligibleCertificates = courses
    .filter(course => {
      const progress = userProgress[course.id];
      if (!progress) return false;
      
      // Check if course is 100% complete
      const moduleIds = course.modules?.map(m => m.id) || [];
      const completedModules = moduleIds.filter(id => progress.completedModules.includes(id));
      const isComplete = completedModules.length === moduleIds.length && moduleIds.length > 0;
      
      // Check if quiz is passed
      const hasPassedQuiz = progress.quizScores && Object.values(progress.quizScores).some(score => score >= 50);
      
      return isComplete && hasPassedQuiz;
    })
    .map(course => {
      const progress = userProgress[course.id];
      const quizScores = progress?.quizScores ? Object.values(progress.quizScores) : [];
      const averageScore = quizScores.length > 0 
        ? Math.round(quizScores.reduce((a, b) => Math.max(a, b), 0))
        : 0;
      
      const cert: Certificate = {
        id: `cert-${course.id}-${currentUser?.id}`,
        courseId: course.id,
        courseTitle: course.title,
        instructorName: course.instructor || 'Équipe pédagogique',
        studentName: `${currentUser?.firstName} ${currentUser?.lastName}`,
        date: new Date().toISOString(),
        certificateNumber: `LMS-${Date.now()}-${course.id.slice(0, 4).toUpperCase()}`,
        mention: calculateMention(averageScore),
        averageScore,
      };
      
      return cert;
    });

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
            Téléchargez vos certificats de réussite
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
                <p className="text-2xl font-bold">{eligibleCertificates.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Certificats disponibles</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{courses.filter(c => userProgress[c.id]?.completedModules.length > 0).length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Formations en cours</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {eligibleCertificates.filter(c => c.mention === 'Excellent' || c.mention === 'Très Bien').length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Excellentes mentions</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Certificates List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {eligibleCertificates.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Award className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Aucun certificat disponible
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Complétez une formation et réussissez le quiz pour obtenir votre certificat
                </p>
              </CardContent>
            </Card>
          ) : (
            eligibleCertificates.map((cert, index) => (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.01 }}
              >
                <Card className="overflow-hidden">
                  <div className={`h-2 ${getMentionColor(cert.mention)}`} />
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{cert.courseTitle}</CardTitle>
                        <CardDescription>
                          <div className="flex items-center gap-2 mt-2">
                            <Calendar className="w-4 h-4" />
                            <span>Émis le {new Date(cert.date).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            N° {cert.certificateNumber}
                          </div>
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <Badge className={`${getMentionColor(cert.mention)} text-white border-0`}>
                          {cert.mention}
                        </Badge>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          Score : {cert.averageScore}%
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p>Formateur : {cert.instructorName}</p>
                      </div>
                      <Button
                        onClick={() => generateCertificatePDF(cert)}
                        className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      >
                        <Download className="w-4 h-4" />
                        Télécharger PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
};
