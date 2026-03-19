// src/app/services/demandeService.ts
//
// Fonctions API pour les demandes formateur
// US 1.4 : Soumettre une demande
// US 1.5 : Lister/traiter les demandes (admin)

import api from './api';
import { InstructorRequest, InstructorRequestStatus } from '../types';

// ─── Mapper backend → frontend ────────────────────────────
function mapApiDemande(d: any): InstructorRequest {
  const statusMap: Record<string, InstructorRequestStatus> = {
    en_attente: 'pending',
    acceptee:   'accepted',
    refusee:    'rejected',
  };

  return {
    id:          String(d.id),
    userId:      String(d.user_id),
    user:        d.user ? {
      id:        String(d.user.id),
      email:     d.user.email,
      firstName: d.user.prenom,
      lastName:  d.user.nom,
      dateOfBirth: '',
      phone: '',
      preferredLanguage: 'fr',
      targetDomains: [],
      technologies: [],
      role: 'learner',
    } : undefined,
    specialty:    d.specialite,
    experience:   d.experience_annees,
    motivation:   d.motivation,
    languages:    d.langues_enseignees ?? [],
    cvUrl:        Array.isArray(d.cv_urls) ? d.cv_urls[0] ?? '' : d.cv_url ?? '',
    certificateUrl: Array.isArray(d.attestation_urls) ? d.attestation_urls[0] ?? '' : d.attestation_url ?? '',
    status:       statusMap[d.statut] ?? 'pending',
    createdAt:    d.date_demande ?? '',
  };
}

// ─── US 1.4 : Soumettre une demande (avec fichiers PDF) ───
export async function submitInstructorRequest(data: {
  specialty: string;
  experience: number;
  motivation: string;
  languages: string[];
  cvFiles: File[];
  certificateFiles: File[];
}): Promise<InstructorRequest> {
  const fd = new FormData();
  fd.append('specialite',          data.specialty);
  fd.append('experience_annees',   String(data.experience));
  fd.append('motivation',          data.motivation);
  data.languages.forEach(l => fd.append('langues_enseignees[]', l));
  data.cvFiles.forEach(file => fd.append('cv[]', file));
  data.certificateFiles.forEach(file => fd.append('attestation[]', file));

  const res = await api.post('/instructor-requests', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return mapApiDemande(res.data.demande);
}

// ─── US 1.4 : Voir le statut de ma propre demande ─────────
export async function getMyRequest(): Promise<InstructorRequest | null> {
  const res = await api.get('/instructor-requests/my');
  return res.data.demande ? mapApiDemande(res.data.demande) : null;
}

// ─── US 1.5 (admin) : Lister toutes les demandes ──────────
export async function getAllRequests(statut?: string): Promise<InstructorRequest[]> {
  const params: Record<string, string> = {};
  if (statut && statut !== 'all') params.statut = statut;
  const res = await api.get('/instructor-requests', { params });
  return res.data.map(mapApiDemande);
}

// ─── US 1.5 (admin) : Accepter ou refuser ─────────────────
export async function processRequest(
  id: string,
  action: 'accepter' | 'refuser'
): Promise<InstructorRequest> {
  const res = await api.post(`/instructor-requests/${id}/process`, { action });
  return mapApiDemande(res.data.demande);
}

// ─── US 1.5 (admin) : URL du fichier PDF ──────────────────
export async function getFileUrl(id: string, type: 'cv' | 'attestation'): Promise<string> {
  const res = await api.get(`/instructor-requests/${id}/file/${type}`);
  return res.data.url;
}
