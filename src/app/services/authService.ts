// src/app/services/authService.ts
//
// Ce fichier contient toutes les fonctions qui appellent
// les endpoints d'authentification du backend Laravel.

import api from "./api";
import { User, UserRole } from "../types";

// ─── TYPES ───────────────────────────────────────────────

// Ce que le backend Laravel retourne pour un utilisateur
interface ApiUser {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  role: "apprenant" | "formateur" | "admin";
  telephone: string | null;
  date_naissance: string | null;
  photo_profil: string | null;
  langue_preferee: string;
  domaines_cibles: string[];
  technologies: string[];
  peut_coder?: boolean;
}

// Données pour l'inscription
export interface RegisterData {
  prenom: string;
  nom: string;
  email: string;
  mot_de_passe: string;
  mot_de_passe_confirmation: string;
  telephone?: string;
  date_naissance?: string;
  langue_preferee?: string;
  domaines_cibles?: string[];
  technologies?: string[];
}

// Données pour la connexion
export interface LoginData {
  email: string;
  mot_de_passe: string;
  cf_turnstile_response?: string | null;
  two_factor_code?: string;
}

// ─── MAPPER ──────────────────────────────────────────────
// Convertit les données du backend (français) vers le format
// du frontend (anglais, conforme au type User de types.ts)
export function mapApiUserToUser(apiUser: ApiUser): User {
  // Correspondance des rôles backend → frontend
  const roleMap: Record<string, UserRole> = {
    apprenant: "learner",
    formateur: "instructor",
    admin: "admin",
  };

  return {
    id: apiUser.id,
    email: apiUser.email,
    firstName: apiUser.prenom,
    lastName: apiUser.nom,
    dateOfBirth: apiUser.date_naissance ?? "",
    phone: apiUser.telephone ?? "",
    preferredLanguage: apiUser.langue_preferee,
    targetDomains: apiUser.domaines_cibles ?? [],
    technologies: apiUser.technologies ?? [],
    role: roleMap[apiUser.role] ?? "learner",
    avatar: apiUser.photo_profil ?? undefined,
    peut_coder: apiUser.peut_coder ?? false,
  };
}

// ─── INSCRIPTION ─────────────────────────────────────────
export async function registerUser(
  data: RegisterData,
): Promise<{ user: User; token: string }> {
  const response = await api.post("/auth/register", data);
  return {
    user: mapApiUserToUser(response.data.user),
    token: response.data.token,
  };
}

// ─── CONNEXION ───────────────────────────────────────────
export async function loginUser(
  data: LoginData,
): Promise<{ user: User; token: string } | { requires_2fa: true }> {
  const response = await api.post("/auth/login", data);

  // Le backend demande le code 2FA
  if (response.data.requires_2fa) {
    return { requires_2fa: true };
  }

  return {
    user: mapApiUserToUser(response.data.user),
    token: response.data.token,
  };
}

// ─── DÉCONNEXION ─────────────────────────────────────────
export async function logoutUser(): Promise<void> {
  await api.post("/auth/logout");
}

// ─── RÉCUPÉRER L'UTILISATEUR CONNECTÉ ────────────────────
export async function getMe(): Promise<User> {
  const response = await api.get("/auth/me");
  return mapApiUserToUser(response.data);
}

// ─── MOT DE PASSE OUBLIÉ ─────────────────────────────────
export async function forgotPassword(email: string): Promise<string> {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data.message;
}

// ─── RÉINITIALISER LE MOT DE PASSE ───────────────────────
export async function resetPassword(data: {
  token: string;
  email: string;
  mot_de_passe: string;
  mot_de_passe_confirmation: string;
}): Promise<string> {
  const response = await api.post("/auth/reset-password", data);
  return response.data.message;
}

// ─── SETUP 2FA ───────────────────────────────────────────
export async function setup2FA(): Promise<{
  secret: string;
  qr_code_url: string;
}> {
  const response = await api.post("/2fa/setup");
  return response.data;
}

// ─── ACTIVER 2FA ─────────────────────────────────────────
export async function enable2FA(code: string): Promise<string> {
  const response = await api.post("/2fa/enable", { code });
  return response.data.message;
}

// ─── DÉSACTIVER 2FA ──────────────────────────────────────
export async function disable2FA(code: string): Promise<string> {
  const response = await api.post("/2fa/disable", { code });
  return response.data.message;
}
