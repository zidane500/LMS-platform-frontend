// src/app/pages/Register.tsx
//
// Page d'inscription - connectée au vrai backend Laravel

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { motion } from 'motion/react';
import { GraduationCap, Mail, Lock, User, Phone, Calendar, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Card, CardContent, CardDescription,
  CardFooter, CardHeader, CardTitle,
} from '../components/ui/card';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';
import axios from 'axios';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth(); // On utilise AuthContext
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    dateOfBirth: '',
    phone: '',
    preferredLanguage: 'fr',
    targetDomains: '',   // Chaîne séparée par virgules → tableau
    technologies: '',    // Chaîne séparée par virgules → tableau
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Validation du mot de passe côté frontend (avant d'envoyer au backend)
  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return minLength && hasUpperCase && hasNumber;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation locale avant d'appeler l'API
    if (!validatePassword(formData.password)) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères, 1 majuscule et 1 chiffre');
      return;
    }

    setLoading(true);

    try {
      // On convertit les chaînes "React, Python" en tableaux ["React", "Python"]
      const domainesArray = formData.targetDomains
        ? formData.targetDomains.split(',').map(d => d.trim()).filter(Boolean)
        : [];
      const techArray = formData.technologies
        ? formData.technologies.split(',').map(t => t.trim()).filter(Boolean)
        : [];

      // Appel réel au backend Laravel
      // Note : le backend attend "mot_de_passe" et "mot_de_passe_confirmation"
      const user = await register({
        prenom: formData.firstName,
        nom: formData.lastName,
        email: formData.email,
        mot_de_passe: formData.password,
        mot_de_passe_confirmation: formData.password, // même valeur
        telephone: formData.phone,
        date_naissance: formData.dateOfBirth,
        langue_preferee: formData.preferredLanguage,
        domaines_cibles: domainesArray,
        technologies: techArray,
      });

      toast.success('Compte créé avec succès ! Bienvenue ' + user.firstName + ' !');
      navigate('/app');
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        // Le backend renvoie des erreurs de validation structurées
        const errors = error.response?.data?.errors;
        if (errors) {
          // Affiche la première erreur de validation
          const firstError = Object.values(errors)[0] as string[];
          toast.error(firstError[0]);
        } else {
          toast.error(error.response?.data?.message || 'Erreur lors de l\'inscription');
        }
      } else {
        toast.error('Une erreur est survenue. Réessayez.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100 dark:from-slate-950 dark:via-purple-950 dark:to-indigo-950 p-4 overflow-hidden relative">
      {/* Décorations de fond */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ y: [0, -30, 0], x: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 -right-32 w-96 h-96 bg-purple-500/10 dark:bg-purple-400/5 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 40, 0], x: [0, -30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute -bottom-32 -left-32 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-400/5 rounded-full blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl relative z-10"
      >
        <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 shadow-2xl border border-white/20 dark:border-slate-700/50">
          <CardHeader className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="flex justify-center"
            >
              <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                <GraduationCap className="w-12 h-12 text-white" />
              </div>
            </motion.div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Créer un compte
            </CardTitle>
            <CardDescription>
              Rejoignez notre plateforme d'apprentissage
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {/* Prénom / Nom */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Minimum 8 caractères, 1 majuscule, 1 chiffre
                </p>
              </div>

              {/* Date de naissance / Téléphone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date de naissance *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Langue préférée */}
              <div className="space-y-2">
                <Label htmlFor="preferredLanguage">Langue préférée *</Label>
                <Select
                  value={formData.preferredLanguage}
                  onValueChange={(value) => handleChange('preferredLanguage', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Domaines cibles */}
              <div className="space-y-2">
                <Label htmlFor="targetDomains">
                  Domaines cibles <span className="text-gray-400 font-normal">(séparés par des virgules)</span>
                </Label>
                <Input
                  id="targetDomains"
                  value={formData.targetDomains}
                  onChange={(e) => handleChange('targetDomains', e.target.value)}
                  placeholder="Ex: Développement Web, Data Science"
                />
              </div>

              {/* Technologies */}
              <div className="space-y-2">
                <Label htmlFor="technologies">
                  Technologies <span className="text-gray-400 font-normal">(séparées par des virgules)</span>
                </Label>
                <Input
                  id="technologies"
                  value={formData.technologies}
                  onChange={(e) => handleChange('technologies', e.target.value)}
                  placeholder="Ex: React, Python, SQL"
                />
              </div>

              {/* Bouton S'inscrire */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Création du compte...
                    </div>
                  ) : (
                    "S'inscrire"
                  )}
                </Button>
              </motion.div>
            </CardContent>

            <CardFooter className="flex justify-center">
              <div className="text-sm text-gray-600">
                Déjà un compte ?{' '}
                <Link to="/login" className="text-blue-600 hover:underline font-semibold">
                  Se connecter
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};
