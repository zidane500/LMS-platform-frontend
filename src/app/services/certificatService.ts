import api from "./api";
import type { Certificate } from "../utils/certificateGenerator";

// Récupérer tous les certificats de l'apprenant
export async function getMesCertificats(): Promise<Certificate[]> {
  const res = await api.get("/certificats");
  return res.data;
}

// Générer ou récupérer le certificat d'une formation
export async function genererCertificat(
  formationId: string,
): Promise<Certificate> {
  const res = await api.post(`/certificats/${formationId}`);
  return res.data;
}

// Vérifier un certificat (public)
export async function verifierCertificat(numero: string) {
  const res = await api.get(`/certificats/verifier/${numero}`);
  return res.data;
}
