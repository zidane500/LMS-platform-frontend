import api from "./api";
import type { InstructorRequest } from "../types";

// ── Mapper backend → frontend ──────────────────────────────
function mapDemande(d: any): InstructorRequest {
  return {
    id: String(d.id),
    userId: String(d.user_id),
    user: d.user
      ? {
          id: String(d.user.id),
          firstName: d.user.prenom,
          lastName: d.user.nom,
          email: d.user.email,
        }
      : undefined,
    specialty: d.specialite,
    experience: d.experience_annees,
    motivation: d.motivation,
    languages: d.langues_enseignees ?? [],
    // ✅ Tableaux complets
    cvUrls: d.cv_urls ?? [],
    attestationUrls: d.attestation_urls ?? [],
    // Rétrocompat (premier fichier)
    cvUrl: d.cv_urls?.[0] ?? undefined,
    certificateUrl: d.attestation_urls?.[0] ?? undefined,
    status:
      d.statut === "en_attente"
        ? "pending"
        : d.statut === "acceptee"
          ? "accepted"
          : "rejected",
    createdAt: d.date_demande ?? undefined,
    processedAt: d.date_traitement ?? undefined,
  };
}

// ── Apprenant : soumettre une demande ──────────────────────
export async function submitInstructorRequest(data: {
  specialty: string;
  experience: number;
  motivation: string;
  languages: string[];
  cvFiles: File[];
  certificateFiles: File[];
}): Promise<InstructorRequest> {
  const fd = new FormData();
  fd.append("specialite", data.specialty);
  fd.append("experience_annees", String(data.experience));
  fd.append("motivation", data.motivation);
  data.languages.forEach((l) => fd.append("langues_enseignees[]", l));
  // ✅ Tous les fichiers CV
  data.cvFiles.forEach((f) => fd.append("cv[]", f));
  // ✅ Tous les fichiers attestation
  data.certificateFiles.forEach((f) => fd.append("attestation[]", f));

  const res = await api.post("/instructor-requests", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return mapDemande(res.data.demande);
}

// ── Apprenant : voir sa demande ────────────────────────────
export async function getMyRequest(): Promise<InstructorRequest | null> {
  const res = await api.get("/instructor-requests/my");
  if (!res.data.demande) return null;
  return mapDemande(res.data.demande);
}

// ── Admin : toutes les demandes ────────────────────────────
export async function getAllRequests(): Promise<InstructorRequest[]> {
  const res = await api.get("/instructor-requests");
  return res.data.map(mapDemande);
}

// ── Admin : traiter une demande ────────────────────────────
// ✅ Fix 3 — commentaire optionnel ajouté
export async function processRequest(
  id: string,
  action: "accepter" | "refuser",
  commentaire?: string,
): Promise<InstructorRequest> {
  const res = await api.post(`/instructor-requests/${id}/process`, {
    action,
    commentaire_admin: commentaire ?? null,
  });
  return mapDemande(res.data.demande);
}

// ── Admin : URL d'un fichier ───────────────────────────────
export async function getFileUrl(
  id: string,
  type: "cv" | "attestation",
): Promise<string> {
  const res = await api.get(`/instructor-requests/${id}/file/${type}`);
  return res.data.url;
}
