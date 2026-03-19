// src/app/services/formationService.ts
//
// Toutes les fonctions API pour les formations et modules
// Epic 2 : US 2.1 à 2.6

import api from './api';
import { Course, Module, CourseLevel } from '../types';

// ─── Mapper backend → frontend ────────────────────────────
// Le backend envoie des noms en français, le frontend utilise l'anglais
const niveauMap: Record<string, CourseLevel> = {
  debutant:     'Débutant',
  intermediaire: 'Intermédiaire',
  avance:       'Avancé',
};

const niveauReverseMap: Record<CourseLevel, string> = {
  'Débutant':     'debutant',
  'Intermédiaire': 'intermediaire',
  'Avancé':       'avance',
};

function mapApiFormation(f: any): Course {
  return {
    id:                String(f.id),
    title:             f.titre,
    description:       f.description,
    category:          f.categorie,
    level:             niveauMap[f.niveau] ?? 'Débutant',
    estimatedDuration: f.duree_estimee,
    prerequisites:     f.prerequis ?? [],
    thumbnail:         f.miniature ?? 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
    instructorId:      String(f.formateur_id ?? ''),
    instructor:        f.formateur ? {
      id:              String(f.formateur.id),
      email:           f.formateur.email,
      firstName:       f.formateur.prenom,
      lastName:        f.formateur.nom,
      dateOfBirth:     '',
      phone:           '',
      preferredLanguage: 'fr',
      targetDomains:   [],
      technologies:    [],
      role:            'instructor',
    } : undefined,
    modules:           (f.modules ?? []).map(mapApiModule),
    createdAt:         f.created_at ?? '',
    // Champ bonus pour savoir si l'utilisateur est inscrit
    isEnrolled:        f.est_inscrit ?? false,
    statut:            f.statut ?? 'publie',
  } as Course & { isEnrolled: boolean; statut: string };
}

function mapApiModule(m: any): Module {
  return {
    id:          String(m.id),
    courseId:    String(m.formation_id),
    title:       m.titre,
    description: m.description ?? '',
    duration:    m.duree,
    order:       m.ordre,
    contents:    [],
  };
}

// ─── US 2.3 : Lister et filtrer les formations ────────────
export async function getFormations(filters?: {
  search?: string;
  categorie?: string;
  niveau?: string;
  mine?: boolean;
  statut?: string;
}): Promise<Course[]> {
  const params: Record<string, string> = {};
  if (filters?.search    && filters.search   !== '')    params.search    = filters.search;
  if (filters?.categorie && filters.categorie !== 'all') params.categorie = filters.categorie;
  if (filters?.niveau    && filters.niveau    !== 'all') params.niveau    = filters.niveau;
  if (filters?.mine)     params.mine = 'true';
  if (filters?.statut)   params.statut = filters.statut;

  const res = await api.get('/formations', { params });
  return res.data.map(mapApiFormation);
}

// ─── US 2.4 : Détail d'une formation ─────────────────────
export async function getFormation(id: string): Promise<Course> {
  const res = await api.get(`/formations/${id}`);
  return mapApiFormation(res.data);
}

// ─── Catégories disponibles ───────────────────────────────
export async function getCategories(): Promise<string[]> {
  const res = await api.get('/formations/categories');
  return res.data;
}

// ─── US 2.1 : Créer une formation ────────────────────────
export async function createFormation(data: {
  title: string;
  description: string;
  category: string;
  level: CourseLevel;
  estimatedDuration: number;
  prerequisites: string[];
  thumbnail?: string;
  statut?: string;
}): Promise<Course> {
  const res = await api.post('/formations', {
    titre:          data.title,
    description:    data.description,
    categorie:      data.category,
    niveau:         niveauReverseMap[data.level],
    duree_estimee:  data.estimatedDuration,
    prerequis:      data.prerequisites,
    miniature:      data.thumbnail,
    statut:         data.statut ?? 'brouillon',
  });
  return mapApiFormation(res.data.formation);
}

// ─── US 2.1 (modifier) : Mettre à jour ───────────────────
export async function updateFormation(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    category: string;
    level: CourseLevel;
    estimatedDuration: number;
    prerequisites: string[];
    thumbnail: string;
    statut: string;
  }>
): Promise<Course> {
  const payload: Record<string, unknown> = {};
  if (data.title             !== undefined) payload.titre          = data.title;
  if (data.description       !== undefined) payload.description    = data.description;
  if (data.category          !== undefined) payload.categorie      = data.category;
  if (data.level             !== undefined) payload.niveau         = niveauReverseMap[data.level];
  if (data.estimatedDuration !== undefined) payload.duree_estimee  = data.estimatedDuration;
  if (data.prerequisites     !== undefined) payload.prerequis      = data.prerequisites;
  if (data.thumbnail         !== undefined) payload.miniature      = data.thumbnail;
  if (data.statut            !== undefined) payload.statut         = data.statut;

  const res = await api.put(`/formations/${id}`, payload);
  return mapApiFormation(res.data.formation);
}

// ─── US 2.6 : Supprimer une formation ────────────────────
export async function deleteFormation(id: string): Promise<void> {
  await api.delete(`/formations/${id}`);
}

// ─── Inscription à une formation ─────────────────────────
export async function enrollFormation(id: string): Promise<void> {
  await api.post(`/formations/${id}/enroll`);
}

// ─── US 2.2 : Ajouter un module ──────────────────────────
export async function addModule(
  formationId: string,
  data: { title: string; description?: string; duration: number }
): Promise<Module> {
  const res = await api.post(`/formations/${formationId}/modules`, {
    titre:       data.title,
    description: data.description,
    duree:       data.duration,
  });
  return mapApiModule(res.data.module);
}

// ─── US 2.2 : Modifier un module ──────────────────────────
export async function updateModule(
  formationId: string,
  moduleId: string,
  data: { title?: string; description?: string; duration?: number }
): Promise<Module> {
  const payload: Record<string, unknown> = {};
  if (data.title       !== undefined) payload.titre       = data.title;
  if (data.description !== undefined) payload.description = data.description;
  if (data.duration    !== undefined) payload.duree       = data.duration;

  const res = await api.put(`/formations/${formationId}/modules/${moduleId}`, payload);
  return mapApiModule(res.data.module);
}

// ─── US 2.2 : Supprimer un module ─────────────────────────
export async function deleteModule(formationId: string, moduleId: string): Promise<void> {
  await api.delete(`/formations/${formationId}/modules/${moduleId}`);
}

// ─── US 2.5 : Réordonner les modules (drag & drop) ────────
// orderedIds = tableau des IDs de modules dans le nouvel ordre
export async function reorderModules(
  formationId: string,
  orderedIds: string[]
): Promise<void> {
  await api.post(`/formations/${formationId}/modules/reorder`, {
    ordre: orderedIds.map(Number),
  });
}
