import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Plus, X, Upload, Lock, RefreshCw } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getMe } from "../services/authService";
import {
  createFormation,
  getFormations,
  mapApiFormation,
  mapLevelToBackend,
} from "../services/formationService";
import api from "../services/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
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
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import type { CourseLevel, Course } from "../types";
import axios from "axios";

export const CreateCourse: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  // ✅ Formations codées
  const [isCoded, setIsCoded] = useState(false);
  const [code, setCode] = useState("");
  const [allFormations, setAllFormations] = useState<Course[]>([]);
  const [selectedPrerequisIds, setSelectedPrerequisIds] = useState<string[]>(
    [],
  );
  const [loadingFormations, setLoadingFormations] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    level: "Débutant" as CourseLevel,
    estimatedDuration: 0,
    thumbnail: "",
    statut: "brouillon",
  });
  const [prerequisites, setPrerequisites] = useState<string[]>([]);
  const [newPrerequisite, setNewPrerequisite] = useState("");

  const canCreateCoded =
    currentUser?.role === "admin" ||
    (currentUser?.role === "instructor" && (currentUser as any).peut_coder);

  useEffect(() => {
    if (currentUser?.role === "instructor") {
      getMe()
        .then((freshUser) => {
          setCurrentUser(freshUser);
          localStorage.setItem("auth_user", JSON.stringify(freshUser));
        })
        .catch(() => {});
    }
  }, []);
  // Charger toutes les formations publiées pour les prérequis
  useEffect(() => {
    if (!isCoded) return;
    setLoadingFormations(true);
    getFormations({ statut: "publie" })
      .then(setAllFormations)
      .catch(() => toast.error("Impossible de charger les formations"))
      .finally(() => setLoadingFormations(false));
  }, [isCoded]);

  // Générer un code aléatoire
  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++)
      result += chars[Math.floor(Math.random() * chars.length)];
    setCode(result);
  };

  if (currentUser?.role !== "instructor" && currentUser?.role !== "admin") {
    navigate("/app");
    return null;
  }

  const handleChange = (field: string, value: string | number) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const addPrerequisite = () => {
    const v = newPrerequisite.trim();
    if (v) {
      setPrerequisites((p) => [...p, v]);
      setNewPrerequisite("");
    }
  };

  const togglePrerequis = (id: string) => {
    setSelectedPrerequisIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.title.trim() ||
      !formData.description.trim() ||
      !formData.category.trim()
    ) {
      toast.error("Titre, description et catégorie sont obligatoires");
      return;
    }
    if (formData.estimatedDuration < 1) {
      toast.error("La durée doit être au moins 1 heure");
      return;
    }
    if (isCoded && code.length !== 8) {
      toast.error("Le code doit contenir exactement 8 caractères");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("titre", formData.title);
      fd.append("description", formData.description);
      fd.append("categorie", formData.category);
      fd.append("niveau", mapLevelToBackend(formData.level));
      fd.append("duree_estimee", String(formData.estimatedDuration));
      fd.append("statut", formData.statut);
      prerequisites.forEach((p) => fd.append("prerequis[]", p));

      if (thumbnailFile) fd.append("miniature_fichier", thumbnailFile);

      // ✅ Champs formation codée
      if (isCoded) {
        fd.append("is_coded", "1");
        fd.append("code", code.toUpperCase());
        selectedPrerequisIds.forEach((id) =>
          fd.append("prerequis_formation_ids[]", id),
        );
      }

      const res = await api.post("/formations", fd);
      const course = mapApiFormation(res.data.formation);
      toast.success("Formation créée !");
      navigate(`/app/courses/edit/${course.id}`);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const errors = error.response?.data?.errors;
        if (errors) {
          const first = Object.values(errors)[0] as string[];
          toast.error(first[0]);
        } else {
          toast.error(
            error.response?.data?.message || "Erreur lors de la création",
          );
        }
      } else {
        toast.error("Une erreur est survenue");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/30">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/app/courses")}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Retour aux formations
        </Button>

        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Créer une formation
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">
            Remplissez les informations de base.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Titre */}
              <div className="space-y-2">
                <Label>Titre *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="Ex: React Avancé : Hooks et Patterns Modernes"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Décrivez les objectifs et le contenu..."
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
                    onChange={(e) => handleChange("category", e.target.value)}
                    placeholder="Ex: Développement Web"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Niveau *</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(v) => handleChange("level", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Débutant">Débutant</SelectItem>
                      <SelectItem value="Intermédiaire">
                        Intermédiaire
                      </SelectItem>
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
                    value={formData.estimatedDuration || ""}
                    onChange={(e) =>
                      handleChange(
                        "estimatedDuration",
                        parseInt(e.target.value) || 0,
                      )
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Statut</Label>
                  <Select
                    value={formData.statut}
                    onValueChange={(v) => handleChange("statut", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brouillon">
                        Brouillon (non visible)
                      </SelectItem>
                      <SelectItem value="publie">Publié (visible)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Miniature */}
              <div className="space-y-2">
                <Label>Miniature</Label>
                <label className="block border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition-colors dark:border-slate-700 dark:hover:border-blue-500">
                  <Upload className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    Choisir une image
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    JPG, PNG — max 5MB
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error("Max 5MB");
                        return;
                      }
                      setThumbnailFile(file);
                      handleChange("thumbnail", URL.createObjectURL(file));
                    }}
                  />
                </label>
                {formData.thumbnail && (
                  <div className="relative">
                    <img
                      src={formData.thumbnail}
                      alt="Aperçu"
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        handleChange("thumbnail", "");
                        setThumbnailFile(null);
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Prérequis texte */}
              <div className="space-y-2">
                <Label>Prérequis textuels</Label>
                <div className="flex gap-2">
                  <Input
                    value={newPrerequisite}
                    onChange={(e) => setNewPrerequisite(e.target.value)}
                    placeholder="Ex: JavaScript ES6+"
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      (e.preventDefault(), addPrerequisite())
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addPrerequisite}
                    className="gap-1"
                  >
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
                          onClick={() =>
                            setPrerequisites((prev) =>
                              prev.filter((_, j) => j !== i),
                            )
                          }
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

          {/* ✅ Section Formation Codée */}
          {canCreateCoded && (
            <Card
              className={
                isCoded
                  ? "border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/20"
                  : "dark:border-slate-700"
              }
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Lock
                      className={`w-5 h-5 ${isCoded ? "text-purple-600" : "text-gray-400"}`}
                    />
                    <div>
                      <CardTitle className="text-base">
                        Formation codée
                      </CardTitle>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                        Protège l'accès par un code obtenu via des certificats
                        prérequis
                      </p>
                    </div>
                  </div>

                  {/* Toggle switch */}
                  <button
                    type="button"
                    onClick={() => setIsCoded(!isCoded)}
                    className={`relative inline-flex w-12 h-6 rounded-full transition-colors focus:outline-none ${
                      isCoded
                        ? "bg-purple-500"
                        : "bg-gray-300 dark:bg-slate-600"
                    }`}
                  >
                    <span
                      className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        isCoded ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </CardHeader>

              {isCoded && (
                <CardContent className="space-y-5 pt-0">
                  {/* Code d'accès */}
                  <div className="space-y-2">
                    <Label>Code d'accès (8 caractères) *</Label>
                    <div className="flex gap-2">
                      <Input
                        value={code}
                        onChange={(e) => {
                          const val = e.target.value
                            .toUpperCase()
                            .replace(/[^A-Z0-9]/g, "");
                          if (val.length <= 8) setCode(val);
                        }}
                        placeholder="Ex: ABCD1234"
                        maxLength={8}
                        className="font-mono tracking-widest text-center text-lg uppercase"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={generateCode}
                        className="gap-2 shrink-0"
                      >
                        <RefreshCw className="w-4 h-4" /> Générer
                      </Button>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Uniquement lettres majuscules et chiffres</span>
                      <span
                        className={
                          code.length === 8 ? "text-green-500 font-medium" : ""
                        }
                      >
                        {code.length}/8
                      </span>
                    </div>
                  </div>

                  {/* Formations prérequises */}
                  <div className="space-y-2">
                    <Label>
                      Formations prérequises{" "}
                      <span className="text-gray-400 font-normal">
                        (l'apprenant doit avoir leurs certificats pour obtenir
                        le code)
                      </span>
                    </Label>

                    {loadingFormations ? (
                      <div className="flex items-center gap-2 py-3 text-sm text-gray-400">
                        <span className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                        Chargement...
                      </div>
                    ) : allFormations.length === 0 ? (
                      <p className="text-sm text-gray-400 py-2">
                        Aucune formation publiée disponible comme prérequis.
                      </p>
                    ) : (
                      <div className="max-h-48 overflow-y-auto space-y-1 border rounded-xl p-2 dark:border-slate-700">
                        {allFormations
                          .filter((f) => f.id !== "new")
                          .map((f) => {
                            const selected = selectedPrerequisIds.includes(
                              String(f.id),
                            );
                            return (
                              <button
                                key={f.id}
                                type="button"
                                onClick={() => togglePrerequis(String(f.id))}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${
                                  selected
                                    ? "bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700"
                                    : "hover:bg-gray-50 dark:hover:bg-slate-800 border border-transparent"
                                }`}
                              >
                                <span
                                  className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                                    selected
                                      ? "bg-purple-500 border-purple-500"
                                      : "border-gray-300 dark:border-slate-600"
                                  }`}
                                >
                                  {selected && (
                                    <svg
                                      className="w-2.5 h-2.5 text-white"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                      strokeWidth={3}
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  )}
                                </span>
                                <span
                                  className={
                                    selected
                                      ? "text-purple-700 dark:text-purple-300 font-medium"
                                      : "text-gray-700 dark:text-slate-300"
                                  }
                                >
                                  {f.title}
                                </span>
                                {f.category && (
                                  <span className="ml-auto text-xs text-gray-400 shrink-0">
                                    {f.category}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                      </div>
                    )}

                    {selectedPrerequisIds.length > 0 && (
                      <p className="text-xs text-purple-600 dark:text-purple-400">
                        {selectedPrerequisIds.length} formation(s)
                        sélectionnée(s) comme prérequis
                      </p>
                    )}
                  </div>

                  {/* Info box */}
                  <div className="bg-purple-100 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 text-sm text-purple-800 dark:text-purple-300">
                    <p className="font-semibold mb-1">
                      📋 Comment ça fonctionne :
                    </p>
                    <ul className="space-y-1 text-xs">
                      <li>
                        • Les apprenants doivent obtenir les certificats des
                        formations prérequises
                      </li>
                      <li>
                        • Dès qu'ils complètent un prérequis, ils reçoivent une
                        notification
                      </li>
                      <li>
                        • Quand tous les prérequis sont complétés, le code leur
                        est envoyé automatiquement
                      </li>
                      <li>
                        • Ils saisissent le code sur la page de la formation
                        pour y accéder
                      </li>
                    </ul>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-4">
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
                  "Créer la formation"
                )}
              </Button>
            </motion.div>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/app/courses")}
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
