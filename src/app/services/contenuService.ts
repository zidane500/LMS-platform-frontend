// src/app/services/contenuService.ts
import api from './api';
import { Content, ContentType } from '../types';

// ─── Mapper backend → frontend ────────────────────────────
function mapApiContenu(c: any): Content & { progression?: any; aFichier?: boolean } {
  return {
    id:        String(c.id),
    moduleId:  String(c.module_id),
    title:     c.titre,
    type:      c.type as ContentType,
    url:       c.url ?? '',
    duration:  c.duree ?? 0,
    summary:   c.resume ?? '',
    thumbnail: c.miniature ?? undefined,
    aFichier:  c.a_fichier ?? false,
    progression: c.progression ?? null,
  };
}

// ─── Lister les contenus d'un module ──────────────────────
export async function getContenus(
  formationId: string,
  moduleId: string
): Promise<(Content & { progression?: any })[]> {
  const res = await api.get(
    `/formations/${formationId}/modules/${moduleId}/contenus`
  );
  return res.data.map(mapApiContenu);
}

// ─── US 3.1 : Ajouter un contenu ──────────────────────────
export async function addContenu(
  formationId: string,
  moduleId: string,
  data: {
    titre: string;
    type: ContentType;
    url?: string;
    fichier?: File | null;
    duree?: number;
    resume?: string;
    miniature?: string;
  }
): Promise<Content> {
  const fd = new FormData();
  fd.append('titre', data.titre);
  fd.append('type',  data.type);
  if (data.url)     fd.append('url',     data.url);
  if (data.fichier) fd.append('fichier', data.fichier);
  if (data.duree !== undefined) fd.append('duree', String(data.duree));
  if (data.resume)  fd.append('resume',  data.resume);
  if (data.miniature) fd.append('miniature', data.miniature);

  const res = await api.post(
    `/formations/${formationId}/modules/${moduleId}/contenus`,
    fd,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return mapApiContenu(res.data.contenu);
}

// ─── US 3.3 : Modifier un contenu ─────────────────────────
export async function updateContenu(
  formationId: string,
  moduleId: string,
  contenuId: string,
  data: {
    titre?: string;
    type?: ContentType;
    url?: string;
    fichier?: File | null;
    duree?: number;
    resume?: string;
    miniature?: string;
  }
): Promise<Content> {
  const fd = new FormData();
  if (data.titre !== undefined)    fd.append('titre',     data.titre);
  if (data.type !== undefined)     fd.append('type',      data.type);
  if (data.url !== undefined)      fd.append('url',       data.url);
  if (data.fichier)                fd.append('fichier',   data.fichier);
  if (data.duree !== undefined)    fd.append('duree',     String(data.duree));
  if (data.resume !== undefined)   fd.append('resume',    data.resume);
  if (data.miniature !== undefined) fd.append('miniature', data.miniature);

   // Laravel met à jour le contenu même si aucun champ n'est modifié, donc on envoie toujours une requête POST (et pas PATCH) même si data est vide
 const res = await api.post(
  `/formations/${formationId}/modules/${moduleId}/contenus/${contenuId}`,
  fd,
  { headers: { 'Content-Type': 'multipart/form-data' } }
 );
  return mapApiContenu(res.data.contenu);
}

// ─── US 3.4 : Supprimer un contenu ────────────────────────
export async function deleteContenu(
  formationId: string,
  moduleId: string,
  contenuId: string
): Promise<void> {
  await api.delete(
    `/formations/${formationId}/modules/${moduleId}/contenus/${contenuId}`
  );
}

// ─── US 3.2 : Marquer un contenu comme consulté ───────────
export async function marquerConsulte(
  formationId: string,
  moduleId: string,
  contenuId: string,
  pourcentage: number = 100
): Promise<void> {
  await api.post(
    `/formations/${formationId}/modules/${moduleId}/contenus/${contenuId}/consulter`,
    { pourcentage, complete: pourcentage >= 90 }
  );
}
