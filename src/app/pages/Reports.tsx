import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Download, FileText, Calendar, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

export const Reports: React.FC = () => {
  const { currentUser, courses, userProgress, mockUsers } = useApp();
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'pdf'>('pdf');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

  const isInstructorOrAdmin = currentUser?.role === 'instructor' || currentUser?.role === 'admin';

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Nom', 'Email', 'Formation', 'Progression', 'Score Quiz', 'Temps passé'];
    
    let data: string[][] = [];

    // Filter data based on selections
    const filteredCourses = selectedCourse === 'all' 
      ? courses 
      : courses.filter(c => c.id === selectedCourse);

    filteredCourses.forEach(course => {
      const progress = userProgress[course.id];
      if (progress) {
        const completedModules = progress.completedModules.length;
        const totalModules = course.modules?.length || 0;
        const progressPercent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
        
        const quizScores = progress.quizScores ? Object.values(progress.quizScores) : [];
        const avgScore = quizScores.length > 0 
          ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
          : 0;

        const timeSpent = progress.timeSpent || 0;
        const hoursSpent = Math.round(timeSpent / 60);

        data.push([
          `${currentUser?.firstName} ${currentUser?.lastName}`,
          currentUser?.email || '',
          course.title,
          `${progressPercent}%`,
          `${avgScore}%`,
          `${hoursSpent}h`
        ]);
      }
    });

    // Convert to CSV
    const csvContent = [
      headers.join(','),
      ...data.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Rapport_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success('📊 Rapport CSV téléchargé avec succès !');
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229);
    doc.text('Rapport de Progression', 20, 20);

    // Date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 20, 30);

    // User info
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`${currentUser?.firstName} ${currentUser?.lastName}`, 20, 40);
    doc.text(`${currentUser?.email}`, 20, 46);

    let yPosition = 60;

    // Filter data based on selections
    const filteredCourses = selectedCourse === 'all' 
      ? courses 
      : courses.filter(c => c.id === selectedCourse);

    filteredCourses.forEach((course, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      const progress = userProgress[course.id];
      
      // Course title
      doc.setFontSize(14);
      doc.setTextColor(79, 70, 229);
      doc.text(`${index + 1}. ${course.title}`, 20, yPosition);
      yPosition += 8;

      if (progress) {
        const completedModules = progress.completedModules.length;
        const totalModules = course.modules?.length || 0;
        const progressPercent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
        
        const quizScores = progress.quizScores ? Object.values(progress.quizScores) : [];
        const avgScore = quizScores.length > 0 
          ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
          : 0;

        const timeSpent = progress.timeSpent || 0;
        const hoursSpent = Math.round(timeSpent / 60);

        // Details
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`Progression: ${progressPercent}% (${completedModules}/${totalModules} modules)`, 25, yPosition);
        yPosition += 6;
        doc.text(`Score moyen quiz: ${avgScore}%`, 25, yPosition);
        yPosition += 6;
        doc.text(`Temps passé: ${hoursSpent} heures`, 25, yPosition);
        yPosition += 6;
        doc.text(`Statut: ${progressPercent === 100 ? 'Complété' : 'En cours'}`, 25, yPosition);
        yPosition += 12;
      } else {
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text('Aucune progression enregistrée', 25, yPosition);
        yPosition += 12;
      }
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} sur ${pageCount}`, 200, 285, { align: 'right' });
    }

    doc.save(`Rapport_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('📄 Rapport PDF téléchargé avec succès !');
  };

  const handleExport = () => {
    if (selectedFormat === 'csv') {
      exportToCSV();
    } else {
      exportToPDF();
    }
  };

  if (!isInstructorOrAdmin && currentUser?.role !== 'learner') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8">
            <p className="text-gray-600">Vous n'avez pas accès à cette fonctionnalité.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 dark:from-slate-950 dark:to-purple-950/30">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
            <FileText className="w-10 h-10 text-purple-600" />
            Exporter les rapports
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Téléchargez vos données de progression en CSV ou PDF
          </p>
        </motion.div>

        {/* Export Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Configuration de l'export
              </CardTitle>
              <CardDescription>
                Sélectionnez les options d'export de vos rapports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Format */}
              <div>
                <label className="text-sm font-medium mb-2 block">Format d'export</label>
                <Select value={selectedFormat} onValueChange={(value: 'csv' | 'pdf') => setSelectedFormat(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        PDF - Document formaté
                      </div>
                    </SelectItem>
                    <SelectItem value="csv">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        CSV - Données tabulaires
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Course Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Formation</label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les formations</SelectItem>
                    {courses.map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Period Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Période</label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toute la période</SelectItem>
                    <SelectItem value="week">Cette semaine</SelectItem>
                    <SelectItem value="month">Ce mois</SelectItem>
                    <SelectItem value="year">Cette année</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Export Button */}
              <Button
                onClick={handleExport}
                className="w-full gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                size="lg"
              >
                <Download className="w-5 h-5" />
                Télécharger le rapport ({selectedFormat.toUpperCase()})
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
            <CardContent className="p-6">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Données exportées
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>✓ Progression par formation</li>
                <li>✓ Scores des quiz</li>
                <li>✓ Temps passé sur chaque module</li>
                <li>✓ Taux de réussite</li>
                <li>✓ Date d'export incluse dans le nom du fichier</li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
