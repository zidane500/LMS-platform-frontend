// src/app/pages/EditQuiz.tsx — US 4.1 & 4.3 : Créer / Modifier un quiz
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Plus,
  X,
  Trash2,
  CheckCircle,
  Loader2,
  ToggleLeft,
  AlignLeft,
  List,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getQuiz, createQuiz, updateQuiz } from "../services/quizService";
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
import { toast } from "sonner";
import axios from "axios";
import type { QuestionType } from "../services/quizService";

interface ChoixForm {
  texte: string;
  est_correct: boolean;
}
interface QuestionForm {
  texte: string;
  type: QuestionType;
  points: number;
  correction_attendue: string;
  choix: ChoixForm[];
}

const defaultQuestion = (): QuestionForm => ({
  texte: "",
  type: "qcm",
  points: 1,
  correction_attendue: "",
  choix: [
    { texte: "", est_correct: false },
    { texte: "", est_correct: false },
  ],
});

const TYPE_ICONS: Record<QuestionType, React.ReactNode> = {
  qcm: <List className="w-4 h-4" />,
  vrai_faux: <ToggleLeft className="w-4 h-4" />,
  texte_libre: <AlignLeft className="w-4 h-4" />,
};
const TYPE_LABELS: Record<QuestionType, string> = {
  qcm: "QCM (Choix multiple)",
  vrai_faux: "Vrai / Faux",
  texte_libre: "Texte libre",
};

export const EditQuiz: React.FC = () => {
  const navigate = useNavigate();
  const { courseId, moduleId, quizId } = useParams<{
    courseId: string;
    moduleId: string;
    quizId?: string;
  }>();
  const { currentUser } = useAuth();
  const isEditing = !!quizId && quizId !== "create";

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [existingQuizId, setExistingQuizId] = useState<string | null>(null);

  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [seuil, setSeuil] = useState(70);
  const [duree, setDuree] = useState<number | "">("");
  const [nbTentatives, setNbTentatives] = useState(3);
  const [questions, setQuestions] = useState<QuestionForm[]>([
    defaultQuestion(),
  ]);

  // Charger quiz existant si modification
  useEffect(() => {
    if (!isEditing || !courseId || !moduleId) return;
    setLoading(true);
    getQuiz(courseId, moduleId)
      .then((q) => {
        setExistingQuizId(q.id);
        setTitre(q.titre);
        setDescription(q.description ?? "");
        setSeuil(q.seuil_reussite);
        setDuree(q.duree_minutes ?? "");
        setNbTentatives(q.nb_tentatives_max);
        setQuestions(
          q.questions.map((qu) => ({
            texte: qu.texte,
            type: qu.type,
            points: qu.points,
            correction_attendue: qu.correction_attendue ?? "",
            choix: qu.choix.map((c) => ({
              texte: c.texte,
              est_correct: c.est_correct ?? false,
            })),
          })),
        );
      })
      .catch(() => toast.error("Quiz introuvable"))
      .finally(() => setLoading(false));
  }, [isEditing, courseId, moduleId]);

  if (currentUser?.role !== "instructor" && currentUser?.role !== "admin") {
    navigate("/app");
    return null;
  }

  // ── Gestion des questions ─────────────────────────────────
  const addQuestion = () =>
    setQuestions((prev) => [...prev, defaultQuestion()]);
  const removeQuestion = (i: number) =>
    setQuestions((prev) => prev.filter((_, j) => j !== i));
  const updateQuestion = (i: number, field: keyof QuestionForm, val: any) =>
    setQuestions((prev) =>
      prev.map((q, j) => (j === i ? { ...q, [field]: val } : q)),
    );

  const setQuestionType = (i: number, type: QuestionType) => {
    const choix: ChoixForm[] =
      type === "vrai_faux"
        ? [
            { texte: "Vrai", est_correct: true },
            { texte: "Faux", est_correct: false },
          ]
        : type === "texte_libre"
          ? []
          : [
              { texte: "", est_correct: false },
              { texte: "", est_correct: false },
            ];
    setQuestions((prev) =>
      prev.map((q, j) => (j === i ? { ...q, type, choix } : q)),
    );
  };

  const addChoix = (qi: number) =>
    setQuestions((prev) =>
      prev.map((q, j) =>
        j === qi
          ? { ...q, choix: [...q.choix, { texte: "", est_correct: false }] }
          : q,
      ),
    );
  const removeChoix = (qi: number, ci: number) =>
    setQuestions((prev) =>
      prev.map((q, j) =>
        j === qi ? { ...q, choix: q.choix.filter((_, k) => k !== ci) } : q,
      ),
    );
  const updateChoix = (
    qi: number,
    ci: number,
    field: keyof ChoixForm,
    val: any,
  ) =>
    setQuestions((prev) =>
      prev.map((q, j) =>
        j === qi
          ? {
              ...q,
              choix: q.choix.map((c, k) =>
                k === ci ? { ...c, [field]: val } : c,
              ),
            }
          : q,
      ),
    );

  // QCM : un seul bon choix à la fois
  const setCorrectChoix = (qi: number, ci: number) =>
    setQuestions((prev) =>
      prev.map((q, j) =>
        j === qi
          ? {
              ...q,
              choix: q.choix.map((c, k) => ({ ...c, est_correct: k === ci })),
            }
          : q,
      ),
    );

  // ── Soumission ────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titre.trim()) {
      toast.error("Le titre est obligatoire");
      return;
    }
    if (questions.length === 0) {
      toast.error("Ajoutez au moins une question");
      return;
    }

    for (const [i, q] of questions.entries()) {
      if (!q.texte.trim()) {
        toast.error(`Question ${i + 1} : texte manquant`);
        return;
      }
      if ((q.type === "qcm" || q.type === "vrai_faux") && q.choix.length < 2) {
        toast.error(`Question ${i + 1} : minimum 2 choix`);
        return;
      }
      if (q.type === "texte_libre" && !q.correction_attendue.trim()) {
        toast.error(
          `Question ${i + 1} : la correction attendue est obligatoire`,
        );
        return;
      }
      if (
        (q.type === "qcm" || q.type === "vrai_faux") &&
        !q.choix.some((c) => c.est_correct)
      ) {
        toast.error(`Question ${i + 1} : marquez au moins un choix correct`);
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        titre,
        description: description || undefined,
        seuil_reussite: seuil,
        duree_minutes: duree !== "" ? duree : undefined,
        nb_tentatives_max: nbTentatives,
        questions: questions.map((q, i) => ({
          texte: q.texte,
          type: q.type,
          points: q.points,
          ordre: i + 1,
          correction_attendue:
            q.type === "texte_libre"
              ? q.correction_attendue || undefined
              : undefined,
          choix: q.choix.map((c, j) => ({
            texte: c.texte,
            est_correct: c.est_correct,
            ordre: j + 1,
          })),
        })),
      };

      if (isEditing && existingQuizId) {
        await updateQuiz(courseId!, moduleId!, existingQuizId, payload);
        toast.success("Quiz mis à jour !");
      } else {
        await createQuiz(courseId!, moduleId!, payload);
        toast.success("Quiz créé !");
      }
      navigate(`/app/courses/edit/${courseId}`);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message || "Erreur lors de la sauvegarde",
        );
      } else {
        toast.error("Une erreur est survenue");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 dark:from-slate-950 dark:to-purple-950/30">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/app/courses/edit/${courseId}`)}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Retour à la formation
        </Button>

        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            {isEditing ? "Modifier le quiz" : "Créer un quiz"}
          </h1>
          <p className="text-gray-500 mt-1">
            Les apprenants seront évalués sur ce module
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── Paramètres généraux ── */}
          <Card>
            <CardHeader>
              <CardTitle>Paramètres du quiz</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Titre *</Label>
                <Input
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  placeholder="Ex: Quiz — Introduction aux bases"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Description (optionnel)</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Instructions pour les apprenants..."
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Seuil de réussite (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={seuil}
                    onChange={(e) => setSeuil(parseInt(e.target.value) || 70)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Durée (minutes)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={duree}
                    onChange={(e) =>
                      setDuree(
                        e.target.value === "" ? "" : parseInt(e.target.value),
                      )
                    }
                    placeholder="Sans limite"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nb. tentatives max</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={nbTentatives}
                    onChange={(e) =>
                      setNbTentatives(parseInt(e.target.value) || 3)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Questions ── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                Questions{" "}
                <span className="text-gray-400 text-sm font-normal">
                  ({questions.length})
                </span>
              </h2>
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={addQuestion}
              >
                <Plus className="w-4 h-4" /> Ajouter une question
              </Button>
            </div>

            <AnimatePresence>
              {questions.map((q, qi) => (
                <motion.div
                  key={qi}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold">
                            {qi + 1}
                          </span>
                          <CardTitle className="text-base">
                            Question {qi + 1}
                          </CardTitle>
                        </div>
                        {questions.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => removeQuestion(qi)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Type + Points */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Type de question</Label>
                          <Select
                            value={q.type}
                            onValueChange={(v: QuestionType) =>
                              setQuestionType(qi, v)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.keys(TYPE_LABELS) as QuestionType[]).map(
                                (t) => (
                                  <SelectItem key={t} value={t}>
                                    <span className="flex items-center gap-2">
                                      {TYPE_ICONS[t]} {TYPE_LABELS[t]}
                                    </span>
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Points</Label>
                          <Input
                            type="number"
                            min="1"
                            value={q.points}
                            onChange={(e) =>
                              updateQuestion(
                                qi,
                                "points",
                                parseInt(e.target.value) || 1,
                              )
                            }
                          />
                        </div>
                      </div>

                      {/* Texte de la question */}
                      <div className="space-y-2">
                        <Label>Énoncé *</Label>
                        <Textarea
                          value={q.texte}
                          onChange={(e) =>
                            updateQuestion(qi, "texte", e.target.value)
                          }
                          placeholder="Saisissez la question..."
                          rows={2}
                          required
                        />
                      </div>

                      {/* Choix (QCM / Vrai-Faux) */}
                      {(q.type === "qcm" || q.type === "vrai_faux") && (
                        <div className="space-y-2">
                          <Label>
                            Choix de réponses{" "}
                            <span className="text-gray-400 text-xs">
                              {q.type === "vrai_faux"
                                ? "(sélectionnez la bonne réponse)"
                                : "(cochez une ou plusieurs bonnes réponses)"}
                            </span>
                          </Label>
                          <div className="space-y-2">
                            {q.choix.map((c, ci) => (
                              <div
                                key={ci}
                                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                                  c.est_correct
                                    ? "bg-green-50 border-green-300 dark:bg-green-950/20 dark:border-green-800"
                                    : "bg-gray-50 border-gray-200 dark:bg-slate-800/50"
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    q.type === "vrai_faux"
                                      ? setCorrectChoix(qi, ci)
                                      : updateChoix(
                                          qi,
                                          ci,
                                          "est_correct",
                                          !c.est_correct,
                                        )
                                  }
                                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                    c.est_correct
                                      ? "bg-green-500 border-green-500 text-white"
                                      : "border-gray-300 hover:border-green-400"
                                  }`}
                                >
                                  {c.est_correct && (
                                    <CheckCircle className="w-4 h-4" />
                                  )}
                                </button>
                                <Input
                                  value={c.texte}
                                  onChange={(e) =>
                                    updateChoix(qi, ci, "texte", e.target.value)
                                  }
                                  placeholder={`Choix ${ci + 1}`}
                                  disabled={q.type === "vrai_faux"}
                                  className="border-0 bg-transparent focus:ring-0 p-0"
                                />
                                {q.type === "qcm" && q.choix.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => removeChoix(qi, ci)}
                                    className="text-red-400 hover:text-red-600 shrink-0"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          {q.type === "qcm" && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="gap-1 text-purple-600"
                              onClick={() => addChoix(qi)}
                            >
                              <Plus className="w-3 h-3" /> Ajouter un choix
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Texte libre */}
                      {q.type === "texte_libre" && (
                        <div className="space-y-2 mt-4">
                          <Label>Correction attendue</Label>
                          <Textarea
                            value={q.correction_attendue}
                            onChange={(e) =>
                              updateQuestion(
                                qi,
                                "correction_attendue",
                                e.target.value,
                              )
                            }
                            placeholder="Décris ici la réponse attendue pour que l'IA puisse corriger la réponse de l'apprenant..."
                            rows={4}
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Cette correction servira de référence à l’IA pour
                            attribuer une note et générer un feedback
                            pédagogique.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* ── Actions ── */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 h-11"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                  Enregistrement...
                </>
              ) : isEditing ? (
                "Mettre à jour"
              ) : (
                "Créer le quiz"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/app/courses/edit/${courseId}`)}
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
