// src/app/pages/BecomeInstructor.tsx — statut correct après acceptation
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Upload,
  Award,
  X,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  submitInstructorRequest,
  getMyRequest,
} from "../services/demandeService";
import { getMe } from "../services/authService";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { toast } from "sonner";
import axios from "axios";
import type { InstructorRequest } from "../types";

export const BecomeInstructor: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [existingRequest, setExistingRequest] =
    useState<InstructorRequest | null>(null);

  const [formData, setFormData] = useState({
    specialty: "",
    experience: 0,
    motivation: "",
    languages: "",
  });
  const [cvFiles, setCvFiles] = useState<File[]>([]);
  const [certificateFiles, setCertificateFiles] = useState<File[]>([]);

  // ── Au chargement : vérifie le statut de la demande depuis l'API ──────────
  // On vérifie TOUJOURS l'API, même si le rôle en mémoire est 'instructor'
  // car le rôle peut avoir changé sans que le frontend soit au courant
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const req = await getMyRequest();
        setExistingRequest(req);

        // Si la demande est acceptée ET que le rôle en mémoire est encore 'learner'
        // → mettre à jour automatiquement le profil en mémoire
        if (req?.status === "accepted" && currentUser?.role === "learner") {
          try {
            const updatedUser = await getMe();
            setCurrentUser(updatedUser);
            localStorage.setItem("auth_user", JSON.stringify(updatedUser));
          } catch {
            // Silencieux — on affiche quand même le statut
          }
        }
      } catch {
        // Aucune demande trouvée → formulaire vide
        setExistingRequest(null);
      } finally {
        setCheckingStatus(false);
      }
    };
    checkStatus();
  }, []);

  // ── Spinner pendant le chargement ────────────────────────────────────────
  if (checkingStatus) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  // ── Si une demande existe (en attente, acceptée ou refusée) → afficher le statut
  // On n'affiche le formulaire QUE si :
  //   1. Aucune demande n'existe du tout
  //   2. OU la demande a été refusée (l'utilisateur peut en soumettre une nouvelle)
  if (existingRequest && existingRequest.status !== "rejected") {
    const statusConfig = {
      pending: {
        icon: <Clock className="w-20 h-20 text-yellow-500" />,
        label: "En attente d'examen",
        color: "bg-yellow-100 text-yellow-800",
        title: "Demande en cours d'examen",
        desc: "Votre demande pour devenir formateur est actuellement en cours de traitement par notre équipe. Vous serez notifié dès qu'une décision sera prise.",
      },
      accepted: {
        icon: <CheckCircle className="w-20 h-20 text-green-500" />,
        label: "Acceptée ✓",
        color: "bg-green-100 text-green-800",
        title: "Félicitations, vous êtes maintenant formateur !",
        desc: "Votre demande a été acceptée. Votre rôle a été mis à jour. Vous pouvez maintenant créer et gérer des formations.",
      },
    };

    const config =
      statusConfig[existingRequest.status as "pending" | "accepted"];

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 dark:from-slate-950 dark:to-purple-950/30">
        <div className="max-w-2xl mx-auto p-6 space-y-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/app/profile")}
            className="gap-2 text-gray-700 dark:text-slate-300"
          >
            <ArrowLeft className="w-4 h-4" /> Retour au profil
          </Button>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="dark:bg-slate-900 dark:border-slate-700">
              <CardContent className="p-12 text-center space-y-5">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="flex justify-center"
                >
                  {config.icon}
                </motion.div>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {config.title}
                </h2>

                <span
                  className={`inline-block px-5 py-2 rounded-full text-sm font-semibold ${config.color}`}
                >
                  {config.label}
                </span>

                <p className="text-gray-600 dark:text-slate-400 max-w-md mx-auto">
                  {config.desc}
                </p>

                {/* Détails */}
                <div className="mt-4 text-left bg-gray-50 dark:bg-slate-800 rounded-xl p-4 space-y-2 text-sm border dark:border-slate-700">
                  <p>
                    <span className="font-medium text-gray-600 dark:text-slate-400">
                      Spécialité :
                    </span>
                    <span className="text-gray-900 dark:text-white ml-1">
                      {existingRequest.specialty}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium text-gray-600 dark:text-slate-400">
                      Expérience :
                    </span>
                    <span className="text-gray-900 dark:text-white ml-1">
                      {existingRequest.experience} ans
                    </span>
                  </p>
                  <p>
                    <span className="font-medium text-gray-600 dark:text-slate-400">
                      Langues :
                    </span>
                    <span className="text-gray-900 dark:text-white ml-1">
                      {existingRequest.languages?.join(", ")}
                    </span>
                  </p>
                  {existingRequest.createdAt && (
                    <p>
                      <span className="font-medium text-gray-600 dark:text-slate-400">
                        Soumise le :
                      </span>
                      <span className="text-gray-900 dark:text-white ml-1">
                        {new Date(existingRequest.createdAt).toLocaleDateString(
                          "fr-FR",
                        )}
                      </span>
                    </p>
                  )}
                </div>

                {existingRequest.status === "accepted" && (
                  <div className="flex flex-col gap-3 pt-2">
                    <Button
                      className="bg-green-600 hover:bg-green-700 gap-2"
                      onClick={() => navigate("/app/courses/create")}
                    >
                      <Award className="w-4 h-4" /> Créer ma première formation
                    </Button>
                    <Button variant="outline" onClick={() => navigate("/app")}>
                      Aller au tableau de bord
                    </Button>
                  </div>
                )}
                {existingRequest.status === "pending" && (
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">
                    Le traitement peut prendre jusqu'à 5 jours ouvrés.
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Formulaire de demande (aucune demande OU demande refusée) ─────────────
  const handleChange = (field: string, value: string | number) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "cv" | "certificate",
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const invalid = files.find((f) => f.type !== "application/pdf");
    if (invalid) {
      toast.error("Seuls les fichiers PDF sont acceptés");
      e.target.value = "";
      return;
    }
    const tooBig = files.find((f) => f.size > 5 * 1024 * 1024);
    if (tooBig) {
      toast.error(`"${tooBig.name}" dépasse 5 MB`);
      e.target.value = "";
      return;
    }

    if (type === "cv") {
      setCvFiles((prev) => [...prev, ...files]);
      toast.success(`${files.length} fichier(s) CV ajouté(s)`);
    } else {
      setCertificateFiles((prev) => [...prev, ...files]);
      toast.success(`${files.length} fichier(s) attestation ajouté(s)`);
    }
    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cvFiles.length === 0) {
      toast.error("Veuillez télécharger au moins un CV (PDF)");
      return;
    }
    if (certificateFiles.length === 0) {
      toast.error("Veuillez télécharger au moins une attestation (PDF)");
      return;
    }
    setLoading(true);

    try {
      const req = await submitInstructorRequest({
        specialty: formData.specialty,
        experience: formData.experience,
        motivation: formData.motivation,
        languages: formData.languages
          .split(",")
          .map((l) => l.trim())
          .filter(Boolean),
        cvFiles,
        certificateFiles,
      });
      setExistingRequest(req);
      toast.success("Demande envoyée ! Vous recevrez une notification.");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.errors
          ? Object.values(error.response.data.errors).flat().join(", ")
          : error.response?.data?.message || "Erreur lors de l'envoi";
        toast.error(msg);
      } else {
        toast.error("Une erreur est survenue");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/app/profile")}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Retour au profil
        </Button>

        {/* Message si demande précédente refusée */}
        {existingRequest?.status === "rejected" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"
          >
            <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800">
                Votre précédente demande a été refusée.
              </p>
              <p className="text-red-700 text-sm mt-1">
                Vous pouvez soumettre une nouvelle candidature en remplissant le
                formulaire ci-dessous.
              </p>
            </div>
          </motion.div>
        )}

        <div className="text-center space-y-4 mb-8">
          <div className="inline-block p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
            <Award className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Devenir formateur
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Partagez votre expertise. Remplissez ce formulaire pour soumettre
            votre candidature.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Formulaire de candidature</CardTitle>
            <CardDescription>
              Tous les champs (*) sont obligatoires
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Spécialité *</Label>
                <Input
                  value={formData.specialty}
                  onChange={(e) => handleChange("specialty", e.target.value)}
                  placeholder="Ex: Développement Web, Data Science"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Expérience (années) *</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.experience || ""}
                    onChange={(e) =>
                      handleChange("experience", parseInt(e.target.value) || 0)
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Langue(s) enseignée(s) *</Label>
                  <Input
                    value={formData.languages}
                    onChange={(e) => handleChange("languages", e.target.value)}
                    placeholder="Français, Anglais (séparées par virgules)"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Motivation *</Label>
                <Textarea
                  value={formData.motivation}
                  onChange={(e) => handleChange("motivation", e.target.value)}
                  rows={5}
                  placeholder="Expliquez pourquoi vous souhaitez devenir formateur..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* CV */}
                <div className="space-y-2">
                  <Label>CV (PDF) *</Label>
                  <label className="block border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      Cliquez pour ajouter un ou plusieurs CV
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PDF uniquement, max 5MB par fichier
                    </p>
                    <input
                      type="file"
                      accept=".pdf"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFileChange(e, "cv")}
                    />
                  </label>
                  {cvFiles.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {cvFiles.map((file, index) => (
                        <div
                          key={index}
                          className="border-2 border-green-200 bg-green-50 rounded-lg p-3 flex items-center gap-3"
                        >
                          <FileText className="w-6 h-6 text-green-600 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-green-900 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-green-600">
                              {(file.size / 1024).toFixed(0)} KB
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setCvFiles((prev) =>
                                prev.filter((_, i) => i !== index),
                              )
                            }
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Attestation */}
                <div className="space-y-2">
                  <Label>Attestation / Diplôme (PDF) *</Label>
                  <label className="block border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      Cliquez pour ajouter une ou plusieurs attestations
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PDF uniquement, max 5MB par fichier
                    </p>
                    <input
                      type="file"
                      accept=".pdf"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFileChange(e, "certificate")}
                    />
                  </label>

                  {certificateFiles.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {certificateFiles.map((file, index) => (
                        <div
                          key={index}
                          className="border-2 border-green-200 bg-green-50 rounded-lg p-3 flex items-center gap-3"
                        >
                          <FileText className="w-6 h-6 text-green-600 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-green-900 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-green-600">
                              {(file.size / 1024).toFixed(0)} KB
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setCertificateFiles((prev) =>
                                prev.filter((_, i) => i !== index),
                              )
                            }
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>À savoir :</strong> Votre candidature sera examinée
                  par notre équipe sous 5 jours ouvrés.
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Envoi...
                    </>
                  ) : (
                    "Soumettre ma candidature"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/app/profile")}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
