// src/app/services/progressionService.ts
import api from "./api";

export interface ModuleProgression {
  module_id: string;
  titre: string;
  total: number;
  completes: number;
  pourcentage: number;
}

export interface TentativeQuizProgression {
  quiz_id: string;
  score: number;
  score_max: number;
  pourcentage: number;
  reussi: boolean;
  termine_le: string;
}

export interface BadgeProgression {
  id: string;
  code: string;
  nom: string;
  description: string;
  icone: string;
  obtenu_le: string;
}

export interface ProgressionFormation {
  formation_id: string;
  pourcentage_global: number;
  contenus_completes: number;
  total_contenus: number;
  complete: boolean;
  modules: ModuleProgression[];
  tentatives_quiz: TentativeQuizProgression[];
  badges: BadgeProgression[];
}

export interface ProgressionResume {
  formation_id: string;
  formation_titre: string;
  pourcentage_global: number;
  complete: boolean;
  termine_le?: string;
}

// Progression détaillée d'une formation
export async function getProgression(
  formationId: string,
): Promise<ProgressionFormation> {
  const res = await api.get(`/progression/${formationId}`);
  return res.data;
}

// Toutes les progressions de l'utilisateur
export async function getMesProgressions(): Promise<ProgressionResume[]> {
  const res = await api.get("/progression");
  return res.data;
}

// Vue formateur
export async function getProgressionFormateur(formationId: string) {
  const res = await api.get(`/progression/${formationId}/formateur`);
  return res.data;
}
