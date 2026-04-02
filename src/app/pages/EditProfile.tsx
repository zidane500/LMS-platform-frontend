// src/app/pages/EditProfile.tsx — connecté au vrai backend
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Camera,
  Trash2,
  Save,
  Lock,
  User,
  Phone,
  Calendar,
  Globe,
  Tag,
  Code,
  Mail,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { updateProfile } from "../services/userService";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from "sonner";
import axios from "axios";

export const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser } = useAuth(); // ← AuthContext
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    firstName: currentUser?.firstName || "",
    lastName: currentUser?.lastName || "",
    phone: currentUser?.phone || "",
    dateOfBirth: currentUser?.dateOfBirth || "",
    preferredLanguage: currentUser?.preferredLanguage || "fr",
    targetDomains: currentUser?.targetDomains?.join(", ") || "",
    technologies: currentUser?.technologies?.join(", ") || "",
  });

  // Fichier image sélectionné (pas encore envoyé)
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  // Preview locale de la photo (URL.createObjectURL ou URL du serveur)
  const [photoPreview, setPhotoPreview] = useState<string>(
    currentUser?.avatar || "",
  );
  const [loading, setLoading] = useState(false);

  if (!currentUser) {
    navigate("/login");
    return null;
  }

  const handleChange = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  // Quand l'utilisateur choisit une image → aperçu local immédiat
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Max 5 MB");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file)); // aperçu immédiat
    toast.success("Photo sélectionnée");
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error("Le prénom et le nom sont obligatoires");
      return;
    }
    setLoading(true);

    try {
      // Appel API réel — supporte l'upload de la photo
      const updatedUser = await updateProfile({
        prenom: formData.firstName.trim(),
        nom: formData.lastName.trim(),
        telephone: formData.phone.trim(),
        date_naissance: formData.dateOfBirth,
        langue_preferee: formData.preferredLanguage,
        domaines_cibles: formData.targetDomains
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean),
        technologies: formData.technologies
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        photo_profil: photoFile,
      });

      // Mise à jour du contexte Auth (et donc partout dans l'app)
      setCurrentUser(updatedUser);
      localStorage.setItem("auth_user", JSON.stringify(updatedUser));
      toast.success("Profil mis à jour avec succès !");
      navigate("/app/profile");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const errors = error.response?.data?.errors;
        if (errors) {
          const first = Object.values(errors)[0] as string[];
          toast.error(first[0]);
        } else {
          toast.error(
            error.response?.data?.message || "Erreur lors de la mise à jour",
          );
        }
      } else {
        toast.error("Une erreur est survenue");
      }
    } finally {
      setLoading(false);
    }
  };

  const roleLabel =
    currentUser.role === "learner"
      ? "Apprenant"
      : currentUser.role === "instructor"
        ? "Formateur"
        : "Administrateur";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 dark:from-gray-900 dark:to-purple-900/10">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Button
            variant="ghost"
            onClick={() => navigate("/app/profile")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Retour au profil
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Modifier mon profil
          </h1>
          <p className="text-gray-500 mt-1">
            Personnalisez vos informations personnelles
          </p>
        </motion.div>

        {/* ── Photo de profil ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-600" /> Photo de profil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                <Avatar className="w-28 h-28 border-4 border-white shadow-xl">
                  <AvatarImage src={photoPreview} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-3xl">
                    {currentUser.firstName[0]}
                    {currentUser.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-col gap-3">
                <p className="text-sm text-gray-500">JPG, PNG — max 5 MB</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Camera className="w-4 h-4" /> Changer
                  </Button>
                  {photoPreview && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleRemovePhoto}
                      className="gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> Supprimer
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </CardContent>
        </Card>

        {/* ── Informations personnelles ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" /> Informations
              personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prénom *</Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Nom *</Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                />
              </div>
            </div>

            {/* Email - lecture seule (non modifiable via ce formulaire) */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-gray-400" /> Email
                <Badge variant="secondary" className="text-xs">
                  Non modifiable
                </Badge>
              </Label>
              <Input
                value={currentUser.email}
                readOnly
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Phone className="w-4 h-4 text-gray-400" /> Téléphone
                </Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-gray-400" /> Date de
                  naissance
                </Label>
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Globe className="w-4 h-4 text-gray-400" /> Langue préférée
              </Label>
              <Select
                value={formData.preferredLanguage}
                onValueChange={(v) => handleChange("preferredLanguage", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">🇫🇷 Français</SelectItem>
                  <SelectItem value="en">🇬🇧 Anglais</SelectItem>
                  <SelectItem value="ar">🇸🇦 Arabe</SelectItem>
                  <SelectItem value="es">🇪🇸 Espagnol</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Tag className="w-4 h-4 text-gray-400" /> Domaines d'intérêt
              </Label>
              <Input
                value={formData.targetDomains}
                onChange={(e) => handleChange("targetDomains", e.target.value)}
                placeholder="Ex: Développement Web, Data Science"
              />
              <p className="text-xs text-gray-400">Séparez par des virgules</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Code className="w-4 h-4 text-gray-400" /> Technologies
              </Label>
              <Input
                value={formData.technologies}
                onChange={(e) => handleChange("technologies", e.target.value)}
                placeholder="Ex: React, Python, SQL"
              />
              <p className="text-xs text-gray-400">Séparez par des virgules</p>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
              <span className="text-sm text-gray-600">Rôle actuel</span>
              <Badge>{roleLabel}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* ── Actions ── */}
        <div className="flex flex-col sm:flex-row gap-3 pb-8">
          <motion.div whileHover={{ scale: 1.02 }} className="flex-1">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-full h-11 gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Enregistrer les modifications
                </>
              )}
            </Button>
          </motion.div>
          <Button
            variant="outline"
            onClick={() => navigate("/app/profile")}
            className="h-11 px-6"
            disabled={loading}
          >
            Annuler
          </Button>
        </div>
      </div>
    </div>
  );
};
