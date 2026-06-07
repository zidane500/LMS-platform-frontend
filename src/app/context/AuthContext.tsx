// src/app/context/AuthContext.tsx
//
// Ce contexte gère TOUT ce qui concerne l'authentification :
// - Stocker l'utilisateur connecté
// - Stocker le token dans localStorage
// - Fournir les fonctions login / register / logout

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User } from "../types";
import {
  loginUser,
  registerUser,
  logoutUser,
  getMe,
  forgotPassword as apiForgotPassword,
  LoginData,
  RegisterData,
} from "../services/authService";

// ─── TYPE DU CONTEXTE ────────────────────────────────────
interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isAuthenticated: boolean;

  login: (data: LoginData) => Promise<User | { requires_2fa: true }>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<string>;
  setCurrentUser: (user: User | null) => void;
}

// ─── CRÉATION DU CONTEXTE ────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── PROVIDER ────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // true au démarrage

  // Au lancement de l'app, on vérifie si un token existe dans localStorage
  // Si oui, on récupère les infos de l'utilisateur depuis le backend
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("auth_token");
      const path = window.location.pathname;

      // Pages publiques : on ne restaure pas automatiquement l'utilisateur
      // pour éviter que /formations se comporte comme /app/courses
      const isPublicPage =
        path === "/" ||
        path.startsWith("/formations") ||
        path.startsWith("/login") ||
        path.startsWith("/register") ||
        path.startsWith("/forgot-password") ||
        path.startsWith("/reset-password") ||
        path.startsWith("/verify");

      if (isPublicPage) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      if (token) {
        try {
          const user = await getMe();
          setCurrentUser(user);
        } catch {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("auth_user");
          setCurrentUser(null);
        }
      }

      setLoading(false); // Fin de la vérification initiale
    };

    initAuth();
  }, []);

  // ─── CONNEXION ─────────────────────────────────────────
  const login = async (
    data: LoginData,
  ): Promise<User | { requires_2fa: true }> => {
    const response = await loginUser(data);

    // Le backend demande le code 2FA → on retourne le signal sans connecter
    if ("requires_2fa" in response) {
      return { requires_2fa: true };
    }

    const { user, token } = response;
    localStorage.setItem("auth_token", token);
    setCurrentUser(user);
    return user;
  };

  // ─── INSCRIPTION ───────────────────────────────────────
  const register = async (data: RegisterData): Promise<User> => {
    const { user, token } = await registerUser(data);

    localStorage.setItem("auth_token", token);

    setCurrentUser(user);
    return user;
  };

  // ─── DÉCONNEXION ───────────────────────────────────────
  const logout = async (): Promise<void> => {
    try {
      await logoutUser(); // Informe le backend
    } catch {
      // Même si l'API échoue, on nettoie le frontend
    }

    // Nettoyage complet côté navigateur
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    sessionStorage.clear();

    setCurrentUser(null);

    // Important : recharge propre de l'app après déconnexion
    window.location.href = "/";
  };

  // ─── MOT DE PASSE OUBLIÉ ───────────────────────────────
  const forgotPassword = async (email: string): Promise<string> => {
    return apiForgotPassword(email);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        isAuthenticated: !!currentUser,
        login,
        register,
        logout,
        forgotPassword,
        setCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─── HOOK PERSONNALISÉ ───────────────────────────────────
// Utilise ce hook dans n'importe quel composant pour accéder à l'auth
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return context;
};
