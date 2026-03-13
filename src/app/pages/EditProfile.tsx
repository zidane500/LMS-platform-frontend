import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Camera, Trash2, Save, Lock, User, Phone, Calendar, Globe, Tag, Code, Mail } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';

export const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    dateOfBirth: currentUser?.dateOfBirth || '',
    preferredLanguage: currentUser?.preferredLanguage || 'fr',
    targetDomains: currentUser?.targetDomains.join(', ') || '',
    technologies: currentUser?.technologies.join(', ') || '',
  });

  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar || '');
  const [loading, setLoading] = useState(false);

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("L'image ne doit pas dépasser 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
        toast.success('Photo de profil mise à jour !');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setAvatarUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.success('Photo supprimée');
  };

  const handleSave = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('Le prénom et le nom sont obligatoires');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const updatedUser = {
        ...currentUser,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        // L'email est modifiable uniquement par l'admin
        email: currentUser.role === 'admin' ? formData.email.trim() : currentUser.email,
        phone: formData.phone.trim(),
        dateOfBirth: formData.dateOfBirth,
        preferredLanguage: formData.preferredLanguage,
        targetDomains: formData.targetDomains
          .split(',')
          .map(d => d.trim())
          .filter(d => d.length > 0),
        technologies: formData.technologies
          .split(',')
          .map(t => t.trim())
          .filter(t => t.length > 0),
        avatar: avatarUrl,
      };

      setCurrentUser(updatedUser);
      toast.success('✅ Profil mis à jour avec succès !');
      setLoading(false);
      navigate('/app/profile');
    }, 800);
  };

  const roleLabel =
    currentUser.role === 'learner'
      ? 'Apprenant'
      : currentUser.role === 'instructor'
      ? 'Formateur'
      : 'Administrateur';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 dark:from-gray-900 dark:to-purple-900/10">
      <div className="max-w-3xl mx-auto p-6 space-y-6">

        {/* Back button */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Button
            variant="ghost"
            onClick={() => navigate('/app/profile')}
            className="gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au profil
          </Button>
        </motion.div>

        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Modifier mon profil
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Personnalisez vos informations personnelles
          </p>
        </motion.div>

        {/* Photo de profil */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="dark:bg-slate-900 border dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" />
                Photo de profil
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Avatar preview */}
                <motion.div whileHover={{ scale: 1.05 }} className="relative flex-shrink-0">
                  <Avatar className="w-28 h-28 border-4 border-white dark:border-slate-700 shadow-xl">
                    <AvatarImage src={avatarUrl} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-3xl">
                      {currentUser.firstName[0]}{currentUser.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                  </motion.button>
                </motion.div>

                {/* Actions */}
                <div className="flex flex-col gap-3 w-full sm:w-auto">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Formats acceptés : JPG, PNG, GIF — max <span className="font-medium">5 MB</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      Changer la photo
                    </Button>
                    {avatarUrl && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleRemovePhoto}
                        className="gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Informations personnelles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="dark:bg-slate-900 border dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Informations personnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">

              {/* Prénom / Nom */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="flex items-center gap-1">
                    Prénom <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    placeholder="Votre prénom"
                    className="dark:bg-slate-800 dark:border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="flex items-center gap-1">
                    Nom <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    placeholder="Votre nom"
                    className="dark:bg-slate-800 dark:border-slate-600"
                  />
                </div>
              </div>

              {/* Email — modifiable uniquement par admin, sinon lecture seule */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  {currentUser.role === 'admin' ? (
                    <>
                      <Mail className="w-4 h-4 text-blue-500" />
                      Email
                      <Badge variant="secondary" className="text-xs px-2 py-0 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        Admin uniquement
                      </Badge>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-gray-400" />
                      Email
                      <Badge variant="secondary" className="text-xs px-2 py-0">
                        Non modifiable
                      </Badge>
                    </>
                  )}
                </Label>
                {currentUser.role === 'admin' ? (
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="votre@email.com"
                    className="dark:bg-slate-800 dark:border-slate-600 border-blue-200 focus:border-blue-500"
                  />
                ) : (
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      value={currentUser.email}
                      readOnly
                      disabled
                      className="bg-gray-100 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-500 cursor-not-allowed pr-10"
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {currentUser.role === 'admin'
                    ? "En tant qu'administrateur, vous pouvez modifier votre adresse email."
                    : "L'adresse email est liée à votre compte et ne peut pas être modifiée."}
                </p>
              </div>

              {/* Téléphone / Date de naissance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-1">
                    <Phone className="w-4 h-4 text-gray-400" />
                    Téléphone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+33 6 12 34 56 78"
                    className="dark:bg-slate-800 dark:border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth" className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    Date de naissance
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                    className="dark:bg-slate-800 dark:border-slate-600"
                  />
                </div>
              </div>

              {/* Langue préférée */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Globe className="w-4 h-4 text-gray-400" />
                  Langue préférée
                </Label>
                <Select
                  value={formData.preferredLanguage}
                  onValueChange={(val) => handleChange('preferredLanguage', val)}
                >
                  <SelectTrigger className="dark:bg-slate-800 dark:border-slate-600">
                    <SelectValue placeholder="Choisir une langue" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">🇫🇷 Français</SelectItem>
                    <SelectItem value="en">🇬🇧 Anglais</SelectItem>
                    <SelectItem value="ar">🇸🇦 Arabe</SelectItem>
                    <SelectItem value="es">🇪🇸 Espagnol</SelectItem>
                    <SelectItem value="de">🇩🇪 Allemand</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Domaines d'intérêt */}
              <div className="space-y-2">
                <Label htmlFor="targetDomains" className="flex items-center gap-1">
                  <Tag className="w-4 h-4 text-gray-400" />
                  Domaines d'intérêt
                </Label>
                <Input
                  id="targetDomains"
                  value={formData.targetDomains}
                  onChange={(e) => handleChange('targetDomains', e.target.value)}
                  placeholder="Ex : Développement Web, Data Science, UX Design"
                  className="dark:bg-slate-800 dark:border-slate-600"
                />
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Séparez chaque domaine par une virgule.
                </p>
              </div>

              {/* Technologies */}
              <div className="space-y-2">
                <Label htmlFor="technologies" className="flex items-center gap-1">
                  <Code className="w-4 h-4 text-gray-400" />
                  Technologies maîtrisées
                </Label>
                <Input
                  id="technologies"
                  value={formData.technologies}
                  onChange={(e) => handleChange('technologies', e.target.value)}
                  placeholder="Ex : React, Python, SQL, Docker"
                  className="dark:bg-slate-800 dark:border-slate-600"
                />
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Séparez chaque technologie par une virgule.
                </p>
              </div>

              {/* Rôle (lecture seule) */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Rôle actuel</span>
                <Badge className={
                  currentUser.role === 'admin'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : currentUser.role === 'instructor'
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                    : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                }>
                  {roleLabel}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 pb-8"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1"
          >
            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-full gap-2 h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Enregistrer les modifications
                </>
              )}
            </Button>
          </motion.div>

          <Button
            variant="outline"
            onClick={() => navigate('/app/profile')}
            className="h-11 px-6"
            disabled={loading}
          >
            Annuler
          </Button>
        </motion.div>
      </div>
    </div>
  );
};