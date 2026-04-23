// src/app/services/api.ts
//
// Ce fichier crée une instance Axios configurée pour communiquer
// avec notre backend Laravel.

import axios from "axios";

// L'URL de base du backend Laravel (port 8000 par défaut)

// Création de l'instance Axios
const api = axios.create({
  baseURL: "/api",
  headers: {
    Accept: "application/json",
    // Content-Type retiré : Axios le gère automatiquement
    // (application/json pour les objets, multipart pour FormData)
  },
});

// ─── INTERCEPTEUR DE REQUÊTE ─────────────────────────────
// Avant chaque requête, on ajoute automatiquement le token
// d'authentification s'il existe dans le localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── INTERCEPTEUR DE RÉPONSE ─────────────────────────────
// Si le serveur répond 401 (non autorisé), on nettoie le localStorage
// et on redirige vers /login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
