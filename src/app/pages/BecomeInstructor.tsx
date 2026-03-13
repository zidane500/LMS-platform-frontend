import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Upload, Award, X, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { mockInstructorRequests } from '../data/mockData';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';

export const BecomeInstructor: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, instructorRequests, setInstructorRequests } = useApp();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    specialty: '',
    experience: 0,
    motivation: '',
    languages: '',
  });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);

  if (!currentUser || currentUser.role !== 'learner') {
    navigate('/app');
    return null;
  }

  // Check if user already has a pending request
  const existingRequest = instructorRequests.find(
    req => req.userId === currentUser.id && req.status === 'pending'
  );

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'cv' | 'certificate') => {
    const file = e.target.files?.[0];
    if (file) {
      // Validation du fichier PDF
      if (file.type !== 'application/pdf') {
        toast.error('Seuls les fichiers PDF sont acceptés');
        e.target.value = '';
        return;
      }
      
      // Validation de la taille (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB en bytes
      if (file.size > maxSize) {
        toast.error('La taille du fichier ne doit pas dépasser 5MB');
        e.target.value = '';
        return;
      }

      if (type === 'cv') {
        setCvFile(file);
        toast.success(`CV "${file.name}" ajouté avec succès`);
      } else {
        setCertificateFile(file);
        toast.success(`Attestation "${file.name}" ajoutée avec succès`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation des fichiers
    if (!cvFile) {
      toast.error('Veuillez télécharger votre CV (PDF)');
      return;
    }
    if (!certificateFile) {
      toast.error('Veuillez télécharger votre attestation/diplôme (PDF)');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const newRequest = {
        id: Date.now().toString(),
        userId: currentUser.id,
        specialty: formData.specialty,
        experience: formData.experience,
        motivation: formData.motivation,
        languages: formData.languages.split(',').map(l => l.trim()),
        cvUrl: `#cv-${cvFile.name}`,
        certificateUrl: `#certificate-${certificateFile.name}`,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
      };

      setInstructorRequests([...instructorRequests, newRequest]);
      toast.success('✅ Demande envoyée avec succès ! Vous recevrez une notification de confirmation.');
      setLoading(false);
      navigate('/app/profile');
    }, 1500);
  };

  if (existingRequest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/app/profile')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au profil
          </Button>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="text-center">
              <CardContent className="p-12">
                <div className="text-6xl mb-4">⏳</div>
                <h2 className="text-2xl font-bold mb-2">Demande en cours d'examen</h2>
                <p className="text-gray-600">
                  Votre demande pour devenir formateur est actuellement en cours de traitement.
                  Vous recevrez une notification dès qu'une décision sera prise.
                </p>
                <div className="mt-6">
                  <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                    Statut: En attente
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/app/profile')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au profil
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center space-y-4 mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="inline-block p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg"
            >
              <Award className="w-12 h-12 text-white" />
            </motion.div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Devenir formateur
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Partagez votre expertise et aidez d'autres apprenants à développer leurs compétences.
              Remplissez ce formulaire pour soumettre votre candidature.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Formulaire de candidature</CardTitle>
              <CardDescription>
                Tous les champs marqués d'un astérisque (*) sont obligatoires
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="specialty">Spécialité *</Label>
                  <Input
                    id="specialty"
                    value={formData.specialty}
                    onChange={(e) => handleChange('specialty', e.target.value)}
                    placeholder="Ex: Développement Web, Data Science, Design UI/UX"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Expérience (années) *</Label>
                  <Input
                    id="experience"
                    type="number"
                    min="0"
                    value={formData.experience || ''}
                    onChange={(e) => handleChange('experience', parseInt(e.target.value) || 0)}
                    placeholder="Ex: 5"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="languages">Langue(s) enseignée(s) *</Label>
                  <Input
                    id="languages"
                    value={formData.languages}
                    onChange={(e) => handleChange('languages', e.target.value)}
                    placeholder="Ex: Français, Anglais (séparées par des virgules)"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motivation">Motivation *</Label>
                  <Textarea
                    id="motivation"
                    value={formData.motivation}
                    onChange={(e) => handleChange('motivation', e.target.value)}
                    placeholder="Expliquez pourquoi vous souhaitez devenir formateur..."
                    rows={6}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="cv">CV (PDF) *</Label>
                    {cvFile ? (
                      <div className="border-2 border-green-200 bg-green-50 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <FileText className="w-8 h-8 text-green-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-green-900">{cvFile.name}</p>
                            <p className="text-xs text-green-600">{(cvFile.size / 1024).toFixed(2)} KB</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCvFile(null)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label
                        htmlFor="cv"
                        className="block border-2 border-dashed rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer"
                      >
                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">
                          Cliquez pour télécharger votre CV
                        </p>
                        <p className="text-xs text-gray-400 mt-1">PDF uniquement, max 5MB</p>
                        <input
                          id="cv"
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={(e) => handleFileChange(e, 'cv')}
                        />
                      </label>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="certificate">Attestation / Diplôme (PDF) *</Label>
                    {certificateFile ? (
                      <div className="border-2 border-green-200 bg-green-50 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <FileText className="w-8 h-8 text-green-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-green-900">{certificateFile.name}</p>
                            <p className="text-xs text-green-600">{(certificateFile.size / 1024).toFixed(2)} KB</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCertificateFile(null)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label
                        htmlFor="certificate"
                        className="block border-2 border-dashed rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer"
                      >
                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">
                          Cliquez pour télécharger
                        </p>
                        <p className="text-xs text-gray-400 mt-1">PDF uniquement, max 5MB</p>
                        <input
                          id="certificate"
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={(e) => handleFileChange(e, 'certificate')}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>À savoir :</strong> Votre candidature sera examinée par notre équipe.
                    Vous recevrez une notification par email une fois la décision prise.
                    Le processus peut prendre jusqu'à 5 jours ouvrés.
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1"
                  >
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      disabled={loading}
                    >
                      {loading ? 'Envoi en cours...' : 'Soumettre ma candidature'}
                    </Button>
                  </motion.div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/profile')}
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};