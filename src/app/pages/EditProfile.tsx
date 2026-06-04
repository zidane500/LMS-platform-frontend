// src/app/pages/EditProfile.tsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
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
  Loader2,
  Shield,
  Mail,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  updateProfile,
  getAllUsers,
  adminUpdateUser,
} from "../services/userService";
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
import type { User as UserType } from "../types";

export const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId?: string }>();
  const { currentUser, setCurrentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdminEdit = !!userId && currentUser?.role === "admin";

  const [targetUser, setTargetUser] = useState<UserType | null>(
    isAdminEdit ? null : currentUser,
  );
  const [loadingUser, setLoadingUser] = useState(isAdminEdit);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    preferredLanguage: "fr",
    targetDomains: "",
    technologies: "",
    role: "learner",
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // ── Charger l'utilisateur cible si mode admin ──────────────
  useEffect(() => {
    if (!isAdminEdit || !userId) return;
    getAllUsers()
      .then((users) => {
        const found = users.find((u) => u.id === userId);
        if (!found) {
          toast.error("Utilisateur introuvable");
          navigate("/app/admin/user-management");
          return;
        }
        setTargetUser(found);
        setFormData({
          firstName: found.firstName,
          lastName: found.lastName,
          email: found.email,
          phone: found.phone ?? "",
          dateOfBirth: found.dateOfBirth ?? "",
          preferredLanguage: found.preferredLanguage ?? "fr",
          targetDomains: found.targetDomains?.join(", ") ?? "",
          technologies: found.technologies?.join(", ") ?? "",
          role: found.role ?? "learner",
        });
        setPhotoPreview(found.avatar ?? "");
      })
      .catch(() => toast.error("Impossible de charger l'utilisateur"))
      .finally(() => setLoadingUser(false));
  }, [userId, isAdminEdit]);

  // ── Initialiser formData mode normal ───────────────────────
  useEffect(() => {
    if (!isAdminEdit && currentUser) {
      setFormData({
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        email: currentUser.email,
        phone: currentUser.phone ?? "",
        dateOfBirth: currentUser.dateOfBirth ?? "",
        preferredLanguage: currentUser.preferredLanguage ?? "fr",
        targetDomains: currentUser.targetDomains?.join(", ") ?? "",
        technologies: currentUser.technologies?.join(", ") ?? "",
        role: currentUser.role ?? "learner",
      });
      setPhotoPreview(currentUser.avatar ?? "");
    }
  }, [currentUser, isAdminEdit]);

  if (!currentUser) {
    navigate("/login");
    return null;
  }

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  const handleChange = (field: string, value: string) =>
    setFormData((p) => ({ ...p, [field]: value }));

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Max 5 MB");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
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
      if (isAdminEdit && userId) {
        // ✅ MODE ADMIN : tous les champs + photo
        await adminUpdateUser(userId, {
          prenom: formData.firstName.trim(),
          nom: formData.lastName.trim(),
          email: formData.email.trim(),
          role:
            formData.role === "learner"
              ? "apprenant"
              : formData.role === "instructor"
                ? "formateur"
                : "admin",
          telephone: formData.phone.trim() || undefined,
          date_naissance: formData.dateOfBirth || undefined,
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
        toast.success("Profil mis à jour avec succès !");
        navigate("/app/admin/user-management");
      } else {
        // ✅ MODE NORMAL : l'utilisateur modifie son propre profil
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
        console.log(updatedUser);
        setCurrentUser(updatedUser);
        localStorage.setItem("auth_user", JSON.stringify(updatedUser));
        toast.success("Profil mis à jour avec succès !");
        navigate("/app/profile");
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const errors = error.response?.data?.errors;
        if (errors) {
          const first = Object.values(errors)[0] as string[];
          toast.error(first[0]);
        } else {
          toast.error(error.response?.data?.message || "Erreur");
        }
      } else {
        toast.error("Une erreur est survenue");
      }
    } finally {
      setLoading(false);
    }
  };

  const displayUser = isAdminEdit ? targetUser : currentUser;
  const roleLabel = (role?: string) =>
    role === "learner"
      ? "Apprenant"
      : role === "instructor"
        ? "Formateur"
        : "Admin";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 dark:from-gray-900 dark:to-purple-900/10">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Retour */}
        <Button
          variant="ghost"
          onClick={() =>
            navigate(
              isAdminEdit ? "/app/admin/user-management" : "/app/profile",
            )
          }
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {isAdminEdit
            ? "Retour à la gestion des utilisateurs"
            : "Retour au profil"}
        </Button>

        {/* Titre */}
        <div className="flex items-center gap-3">
          {isAdminEdit && (
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {isAdminEdit
                ? `Modifier : ${displayUser?.firstName} ${displayUser?.lastName}`
                : "Modifier mon profil"}
            </h1>
            {isAdminEdit && (
              <p className="text-sm text-gray-500 mt-0.5">
                Édition admin — tous les champs sont modifiables
              </p>
            )}
          </div>
        </div>

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
                    {displayUser?.firstName?.[0] ?? "?"}
                    {displayUser?.lastName?.[0] ?? ""}
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
            {/* Prénom + Nom */}
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

            {/* Email — modifiable en mode admin, lecture seule en mode normal */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" /> Email
                {!isAdminEdit && (
                  <Badge variant="secondary" className="text-xs">
                    Non modifiable
                  </Badge>
                )}
              </Label>
              {isAdminEdit ? (
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="email@exemple.com"
                />
              ) : (
                <Input
                  value={currentUser.email}
                  readOnly
                  disabled
                  className="bg-gray-100 dark:bg-slate-800 cursor-not-allowed"
                />
              )}
            </div>

            {/* Téléphone + Date naissance */}
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

            {/* Langue préférée */}
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

            {/* Domaines + Technologies */}
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

            {/* Rôle — modifiable par admin seulement (pas sur soi-même) */}
            {isAdminEdit && displayUser?.id !== currentUser?.id ? (
              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select
                  value={formData.role}
                  onValueChange={(v) => handleChange("role", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="learner">Apprenant</SelectItem>
                    <SelectItem value="instructor">Formateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg border dark:border-slate-700">
                <span className="text-sm text-gray-600 dark:text-slate-400">
                  Rôle actuel
                </span>
                <Badge>{roleLabel(displayUser?.role)}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Actions ── */}
        <div className="flex flex-col sm:flex-row gap-3 pb-8">
          <motion.div whileHover={{ scale: 1.02 }} className="flex-1">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-full h-11 gap-2 bg-gradient-to-r from-blue-600 to-purple-600"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...
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
            onClick={() =>
              navigate(
                isAdminEdit ? "/app/admin/user-management" : "/app/profile",
              )
            }
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
