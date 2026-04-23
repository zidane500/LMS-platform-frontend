// src/app/services/quizService.ts
import api from "./api";

export type QuestionType = "qcm" | "vrai_faux" | "texte_libre";

export interface ChoixApi {
  id?: string;
  texte: string;
  est_correct: boolean | null;
  ordre?: number;
}

export interface QuestionApi {
  id?: string;
  texte: string;
  type: QuestionType;
  points: number;
  ordre?: number;
  correction_attendue?: string | null;
  choix: ChoixApi[];
}

export interface QuizApi {
  id: string;
  module_id: string;
  titre: string;
  description?: string;
  seuil_reussite: number;
  duree_minutes?: number;
  nb_tentatives_max: number;
  statut: string;
  questions: QuestionApi[];
  nb_tentatives?: number;
  meilleure_note?: number;
  peut_repasser?: boolean;
}

export interface ReponsePassee {
  question_id: string;
  choix_id?: string | null; // compat. ancienne version (vrai_faux)
  choix_ids?: string[] | null; //  NOUVEAU : multi-réponses QCM
  reponse_texte?: string;
}

export interface ResultatQuiz {
  score: number;
  score_max: number;
  pourcentage: number;
  reussi: boolean;
  seuil_reussite: number;
  tentative_id: string;
  nb_tentatives: number;
  peut_repasser: boolean;
  corrections: {
    question_id: string;
    texte: string;
    type: QuestionType;
    points: number;
    est_correct: boolean;
    choix_id_donne?: string | null;
    reponse_texte?: string | null;
    score_ia?: number | null;
    feedback_ia?: string | null;
    points_forts?: string | null;
    points_amelioration?: string | null;
    points_obtenus?: number | null;
    bons_choix: string[];
    tous_choix: { id: string; texte: string; est_correct: boolean }[];
  }[];
}

// ─── Récupérer le quiz d'un module ───────────────────────
export async function getQuiz(
  formationId: string,
  moduleId: string,
): Promise<QuizApi> {
  const res = await api.get(
    `/formations/${formationId}/modules/${moduleId}/quiz`,
  );
  return res.data;
}

// ─── Créer un quiz ────────────────────────────────────────
export async function createQuiz(
  formationId: string,
  moduleId: string,
  data: Omit<QuizApi, "id" | "module_id" | "statut">,
): Promise<QuizApi> {
  const res = await api.post(
    `/formations/${formationId}/modules/${moduleId}/quiz`,
    data,
  );
  return res.data.quiz;
}

// ─── Modifier un quiz ─────────────────────────────────────
export async function updateQuiz(
  formationId: string,
  moduleId: string,
  quizId: string,
  data: Partial<Omit<QuizApi, "id" | "module_id" | "statut">>,
): Promise<QuizApi> {
  const res = await api.put(
    `/formations/${formationId}/modules/${moduleId}/quiz/${quizId}`,
    data,
  );
  return res.data.quiz;
}

// ─── Supprimer un quiz ────────────────────────────────────
export async function deleteQuiz(
  formationId: string,
  moduleId: string,
  quizId: string,
): Promise<void> {
  await api.delete(
    `/formations/${formationId}/modules/${moduleId}/quiz/${quizId}`,
  );
}

// ─── Passer un quiz ───────────────────────────────────────
export async function passerQuiz(
  formationId: string,
  moduleId: string,
  quizId: string,
  reponses: ReponsePassee[],
  dureeSecondes?: number,
): Promise<ResultatQuiz> {
  const res = await api.post(
    `/formations/${formationId}/modules/${moduleId}/quiz/${quizId}/passer`,
    { reponses, duree_secondes: dureeSecondes },
  );
  return res.data;
}
