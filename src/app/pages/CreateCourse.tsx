// src/app/pages/CreateCourse.tsx — connecté au vrai backend
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Plus, X, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createFormation } from '../services/formationService';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import type { CourseLevel } from '../types';
import axios from 'axios';

export const CreateCourse: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title:             '',
    description:       '',
    category:          '',
    level:             'Débutant' as CourseLevel,
    estimatedDuration: 0,
    thumbnail:         '',
    statut:            'brouillon',
  });
  const [prerequisites, setPrerequisites]     = useState<string[]>([]);
  const [newPrerequisite, setNewPrerequisite] = useState('');

  if (currentUser?.role !== 'instructor' && currentUser?.role !== 'admin') {
    navigate('/app'); return null;
  }

  const handleChange = (field: string, value: string | number) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const addPrerequisite = () => {
    const v = newPrerequisite.trim();
    if (v) { setPrerequisites(p => [...p, v]); setNewPrerequisite(''); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim() || !formData.category.trim()) {
      toast.error('Titre, description et catégorie sont obligatoires'); return;
    }
    if (formData.estimatedDuration < 1) {
      toast.error('La durée doit être au moins 1 heure'); return;
    }
    setLoading(true);
    try {
      const course = await createFormation({
        title:             formData.title,
        description:       formData.description,
        category:          formData.category,
        level:             formData.level,
        estimatedDuration: formData.estimatedDuration,
        prerequisites,
        thumbnail:         formData.thumbnail || undefined,
        statut:            formData.statut,
      });
      toast.success('✅ Formation créée avec succès !');
      navigate(`/app/courses/edit/${course.id}`);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const errors = error.response?.data?.errors;
        if (errors) {
          const first = Object.values(errors)[0] as string[];
          toast.error(first[0]);
        } else {
          toast.error(error.response?.data?.message || 'Erreur lors de la création');
        }
      } else {
        toast.error('Une erreur est survenue');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="max-w-3xl mx-auto p-6 space-y-6">

        <Button variant="ghost" onClick={() => navigate('/app/courses')} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Retour aux formations
        </Button>

        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Créer une formation
          </h1>
          <p className="text-gray-500 mt-1">
            Remplissez les informations de base. Vous pourrez ajouter les modules ensuite.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader><CardTitle>Informations générales</CardTitle></CardHeader>
            <CardContent className="space-y-5">

              {/* Titre */}
              <div className="space-y-2">
                <Label>Titre *</Label>
                <Input
                  value={formData.title}
                  onChange={e => handleChange('title', e.target.value)}
                  placeholder="Ex: React Avancé : Hooks et Patterns Modernes"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea
                  value={formData.description}
                  onChange={e => handleChange('description', e.target.value)}
                  placeholder="Décrivez les objectifs et le contenu de la formation..."
                  rows={4}
                  required
                />
              </div>

              {/* Catégorie + Niveau */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Catégorie *</Label>
                  <Input
                    value={formData.category}
                    onChange={e => handleChange('category', e.target.value)}
                    placeholder="Ex: Développement Web"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Niveau *</Label>
                  <Select value={formData.level} onValueChange={v => handleChange('level', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Débutant">Débutant</SelectItem>
                      <SelectItem value="Intermédiaire">Intermédiaire</SelectItem>
                      <SelectItem value="Avancé">Avancé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Durée + Statut */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Durée estimée (heures) *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.estimatedDuration || ''}
                    onChange={e => handleChange('estimatedDuration', parseInt(e.target.value) || 0)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Statut</Label>
                  <Select value={formData.statut} onValueChange={v => handleChange('statut', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brouillon">Brouillon (non visible)</SelectItem>
                      <SelectItem value="publie">Publié (visible)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Miniature — URL ou fichier local */}
              <div className="space-y-2">
                <Label>Miniature de la formation</Label>

                {/* Option 1 : URL externe */}
                <Input
                  value={formData.thumbnail}
                  onChange={e => handleChange('thumbnail', e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                />

                <p className="text-xs text-gray-400 text-center">— ou —</p>

                {/* Option 2 : fichier local */}
                <label className="block border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition-colors">
                  <Upload className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                  <p className="text-sm text-gray-600">Choisir une image depuis votre machine</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG — max 5MB</p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error('Image trop grande — max 5MB');
                        return;
                      }
                      const localUrl = URL.createObjectURL(file);
                      handleChange('thumbnail', localUrl);
                    }}
                  />
                </label>

                {/* Aperçu */}
                {formData.thumbnail && (
                  <div className="relative">
                    <img
                      src={formData.thumbnail}
                      alt="Aperçu miniature"
                      className="w-full h-48 object-cover rounded-lg mt-2 border"
                      onError={e => {
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleChange('thumbnail', '')}
                      className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Prérequis */}
              <div className="space-y-2">
                <Label>Prérequis</Label>
                <div className="flex gap-2">
                  <Input
                    value={newPrerequisite}
                    onChange={e => setNewPrerequisite(e.target.value)}
                    placeholder="Ex: JavaScript ES6+"
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addPrerequisite())}
                  />
                  <Button type="button" variant="outline" onClick={addPrerequisite} className="gap-1">
                    <Plus className="w-4 h-4" /> Ajouter
                  </Button>
                </div>
                {prerequisites.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {prerequisites.map((p, i) => (
                      <Badge key={i} variant="secondary" className="gap-1 pl-3">
                        {p}
                        <button
                          type="button"
                          onClick={() => setPrerequisites(prev => prev.filter((_, j) => j !== i))}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4 mt-6">
            <motion.div whileHover={{ scale: 1.02 }} className="flex-1">
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Création...
                  </div>
                ) : (
                  '✅ Créer la formation'
                )}
              </Button>
            </motion.div>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/app/courses')}
              className="h-11 px-6"
            >
              Annuler
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
};
