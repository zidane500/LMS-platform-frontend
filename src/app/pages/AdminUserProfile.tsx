// src/app/pages/AdminUserProfile.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Save, Loader2, User as UserIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getAllUsers, adminUpdateUser } from "../services/userService";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import type { User } from "../types";
import axios from "axios";

export const AdminUserProfile: React.FC = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { currentUser } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "learner" as string,
  });

  // ── Vérification admin ────────────────────────────────
  if (!currentUser || currentUser.role !== "admin") {
    navigate("/app");
    return null;
  }

  // ── Charger l'utilisateur ─────────────────────────────
  useEffect(() => {
    if (!userId) return;
    getAllUsers()
      .then((users) => {
        const found = users.find((u) => u.id === userId);
        if (!found) {
          toast.error("Utilisateur introuvable");
          navigate("/app/admin/user-management");
          return;
        }
        setUser(found);
        setFormData({
          firstName: found.firstName,
          lastName: found.lastName,
          email: found.email,
          role: found.role ?? "learner",
        });
      })
      .catch(() => toast.error("Impossible de charger l'utilisateur"))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const updated = await adminUpdateUser(user.id, {
        prenom: formData.firstName,
        nom: formData.lastName,
        email: formData.email,
        role:
          formData.role === "learner"
            ? "apprenant"
            : formData.role === "instructor"
              ? "formateur"
              : "admin",
      });
      setUser(updated);
      toast.success("Profil mis à jour avec succès !");
    } catch (error: unknown) {
      if (axios.isAxiosError(error))
        toast.error(error.response?.data?.message || "Erreur");
      else toast.error("Une erreur est survenue");
    } finally {
      setSaving(false);
    }
  };

  const roleLabel = (role: string) =>
    role === "admin"
      ? "Admin"
      : role === "instructor"
        ? "Formateur"
        : "Apprenant";

  const roleBadgeClass = (role: string) =>
    role === "admin"
      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      : role === "instructor"
        ? "bg-indigo-100 text-indigo-700"
        : "bg-purple-100 text-purple-700";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/30">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Retour */}
        <Button
          variant="ghost"
          onClick={() => navigate("/app/admin/user-management")}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Retour à la gestion des utilisateurs
        </Button>

        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <Avatar className="w-16 h-16">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl">
              {user.firstName[0]}
              {user.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {user.firstName} {user.lastName}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-gray-500 text-sm">{user.email}</p>
              <Badge className={roleBadgeClass(user.role ?? "learner")}>
                {roleLabel(user.role ?? "learner")}
              </Badge>
            </div>
          </div>
        </motion.div>

        {/* Formulaire */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-blue-600" />
                Modifier le profil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Prénom + Nom */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prénom</Label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, firstName: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, lastName: e.target.value }))
                    }
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, email: e.target.value }))
                  }
                />
              </div>

              {/* Rôle — admin ne peut pas se modifier lui-même */}
              {user.id !== currentUser?.id && (
                <div className="space-y-2">
                  <Label>Rôle</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(v) =>
                      setFormData((p) => ({ ...p, role: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="learner">Apprenant</SelectItem>
                      <SelectItem value="instructor">Formateur</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Infos supplémentaires (lecture seule) */}
              {user.phone && (
                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <Input value={user.phone} disabled className="opacity-60" />
                </div>
              )}
              {user.preferredLanguage && (
                <div className="space-y-2">
                  <Label>Langue préférée</Label>
                  <Input
                    value={user.preferredLanguage}
                    disabled
                    className="opacity-60"
                  />
                </div>
              )}

              {/* Boutons */}
              <div className="flex gap-4 pt-2">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />{" "}
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Sauvegarder
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/app/admin/user-management")}
                >
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
