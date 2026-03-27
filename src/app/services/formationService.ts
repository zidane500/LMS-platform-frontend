// src/app/services/formationService.ts
import api from "./api";
import type { Course, CourseLevel, Module } from "../types";

// ── Mapper backend → frontend ─────────────────────────────
export function mapApiFormation(
  f: any,
): Course & { isEnrolled?: boolean; statut?: string } {
  const levelMap: Record<string, CourseLevel> = {
    debutant: "Débutant",
    intermediaire: "Intermédiaire",
    avance: "Avancé",
    Débutant: "Débutant",
    Intermédiaire: "Intermédiaire",
    Avancé: "Avancé",
  };

  return {
    id: String(f.id),
    title: f.titre,
    description: f.description,
    category: f.categorie,
    level: levelMap[f.niveau] ?? f.niveau,
    estimatedDuration: f.duree_estimee,
    prerequisites: f.prerequis ?? [],
    thumbnail: f.miniature ?? undefined, // ← miniature → thumbnail
    instructorId: String(f.formateur_id),
    instructor: f.formateur
      ? {
          id: String(f.formateur.id),
          firstName: f.formateur.prenom,
          lastName: f.formateur.nom,
          email: f.formateur.email,
        }
      : undefined,
    modules: (f.modules ?? []).map((m: any) => mapApiModule(m)),
    isEnrolled: f.est_inscrit ?? false, // ← est_inscrit → isEnrolled
    statut: f.statut,
    createdAt: f.created_at,
    // Champs requis par le type Course mais non utilisés ici
    enrolledCount: 0,
    rating: 0,
    quizzes: [],
  };
}

function mapApiModule(m: any): Module {
  return {
    id: String(m.id),
    courseId: String(m.formation_id ?? m.course_id ?? ""),
    title: m.titre,
    description: m.description ?? "",
    duration: m.duree ?? 0,
    order: m.ordre ?? 0,
    contents: [],
  };
}

// ── Mapper frontend → backend ─────────────────────────────
export function mapLevelToBackend(level: CourseLevel): string {
  const map: Record<string, string> = {
    Débutant: "debutant",
    Intermédiaire: "intermediaire",
    Avancé: "avance",
  };
  return map[level] ?? "debutant";
}

// ─── Lister les formations ────────────────────────────────
export async function getFormations(params?: {
  search?: string;
  categorie?: string;
  niveau?: string;
  mine?: boolean;
  statut?: string;
  formateur_id?: string;
}): Promise<Course[]> {
  const queryParams: Record<string, string> = {};
  if (params?.search) queryParams.search = params.search;
  if (params?.categorie && params.categorie !== "all")
    queryParams.categorie = params.categorie;
  if (params?.niveau && params.niveau !== "all")
    queryParams.niveau = params.niveau;
  if (params?.mine) queryParams.mine = "true";
  if (params?.statut && params.statut !== "all")
    queryParams.statut = params.statut;
  if (params?.formateur_id && params.formateur_id !== "all")
    queryParams.formateur_id = params.formateur_id;

  const res = await api.get("/formations", { params: queryParams });
  return res.data.map(mapApiFormation);
}

export interface Instructor {
  id: string;
  prenom: string;
  nom: string;
}

// ─── Récupérer les formateurs disponibles ────────────────
export async function getInstructors(): Promise<Instructor[]> {
  const res = await api.get("/formations/instructors");
  return res.data;
}

// ─── Détail d'une formation ───────────────────────────────
export async function getFormation(
  id: string,
): Promise<Course & { isEnrolled?: boolean; statut?: string }> {
  const res = await api.get(`/formations/${id}`);
  return mapApiFormation(res.data);
}

// ─── Catégories disponibles ───────────────────────────────
export async function getCategories(): Promise<string[]> {
  const res = await api.get("/formations/categories");
  return res.data;
}

// ─── Créer une formation ──────────────────────────────────
export async function createFormation(data: {
  title: string;
  description: string;
  category: string;
  level: CourseLevel;
  estimatedDuration: number;
  prerequisites?: string[];
  thumbnail?: string;
  statut?: string;
}): Promise<Course> {
  const res = await api.post("/formations", {
    titre: data.title,
    description: data.description,
    categorie: data.category,
    niveau: mapLevelToBackend(data.level),
    duree_estimee: data.estimatedDuration,
    prerequis: data.prerequisites ?? [],
    miniature: data.thumbnail ?? null,
    statut: data.statut ?? "brouillon",
  });
  return mapApiFormation(res.data.formation);
}

// ─── Modifier une formation ───────────────────────────────
export async function updateFormation(
  id: string,
  data: {
    title?: string;
    description?: string;
    category?: string;
    level?: CourseLevel;
    estimatedDuration?: number;
    prerequisites?: string[];
    thumbnail?: string;
    statut?: string;
  },
): Promise<Course> {
  const payload: Record<string, any> = {};
  if (data.title !== undefined) payload.titre = data.title;
  if (data.description !== undefined) payload.description = data.description;
  if (data.category !== undefined) payload.categorie = data.category;
  if (data.level !== undefined) payload.niveau = mapLevelToBackend(data.level);
  if (data.estimatedDuration !== undefined)
    payload.duree_estimee = data.estimatedDuration;
  if (data.prerequisites !== undefined) payload.prerequis = data.prerequisites;
  if (data.thumbnail !== undefined) payload.miniature = data.thumbnail;
  if (data.statut !== undefined) payload.statut = data.statut;

  const res = await api.put(`/formations/${id}`, payload);
  return mapApiFormation(res.data.formation);
}

// ─── Supprimer une formation ──────────────────────────────
export async function deleteFormation(id: string): Promise<void> {
  await api.delete(`/formations/${id}`);
}

// ─── S'inscrire à une formation ───────────────────────────
export async function enrollFormation(id: string): Promise<void> {
  await api.post(`/formations/${id}/enroll`);
}

// ─── Ajouter un module ────────────────────────────────────
export async function addModule(
  formationId: string,
  data: {
    title: string;
    description: string;
    duration: number;
  },
): Promise<Module> {
  const res = await api.post(`/formations/${formationId}/modules`, {
    titre: data.title,
    description: data.description,
    duree: data.duration,
  });
  return mapApiModule(res.data.module);
}

// ─── Modifier un module ───────────────────────────────────
export async function updateModule(
  formationId: string,
  moduleId: string,
  data: {
    title?: string;
    description?: string;
    duration?: number;
  },
): Promise<Module> {
  const res = await api.put(`/formations/${formationId}/modules/${moduleId}`, {
    titre: data.title,
    description: data.description,
    duree: data.duration,
  });
  return mapApiModule(res.data.module);
}

// ─── Supprimer un module ──────────────────────────────────
export async function deleteModule(
  formationId: string,
  moduleId: string,
): Promise<void> {
  await api.delete(`/formations/${formationId}/modules/${moduleId}`);
}

// ─── Réordonner les modules ───────────────────────────────
export async function reorderModules(
  formationId: string,
  order: { id: string; ordre: number }[],
): Promise<void> {
  await api.post(`/formations/${formationId}/modules/reorder`, {
    ordre: order.map((m) => parseInt(m.id)), // ← tableau d'IDs dans le bon ordre
  });
}
