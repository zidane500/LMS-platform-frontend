// src/app/pages/ResetPassword.tsx
//
// Page de réinitialisation du mot de passe
// Accessible via le lien reçu par email : /reset-password?token=xxx&email=xxx

import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import { motion } from "motion/react";
import {
  GraduationCap,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { toast } from "sonner";
import axios from "axios";
import { resetPassword } from "../services/authService";

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // On récupère le token et l'email depuis l'URL
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Si le lien est invalide (pas de token ou email), on affiche un message
  const isLinkValid = !!token && !!email;

  // Validation du mot de passe en temps réel
  const validations = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    passwordsMatch: password === passwordConfirm && passwordConfirm !== "",
  };

  const isPasswordValid =
    validations.minLength && validations.hasUpperCase && validations.hasNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid) {
      toast.error("Le mot de passe ne respecte pas les critères requis");
      return;
    }

    if (password !== passwordConfirm) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);

    try {
      // Appel API : POST /api/auth/reset-password
      await resetPassword({
        token,
        email,
        mot_de_passe: password,
        mot_de_passe_confirmation: passwordConfirm,
      });

      setSuccess(true);
      toast.success("Mot de passe réinitialisé avec succès !");

      // Redirection automatique vers /login après 3 secondes
      setTimeout(() => navigate("/login"), 3000);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message ||
          "Token invalide ou expiré. Redemandez un email.";
        toast.error(message);
      } else {
        toast.error("Une erreur est survenue. Réessayez.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 p-4">
      {/* Décorations de fond */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ y: [0, -30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 40, 0] }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute -bottom-32 -left-32 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 shadow-2xl border border-white/20 dark:border-slate-700/50">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
                <GraduationCap className="w-10 h-10 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Nouveau mot de passe
            </CardTitle>
            <CardDescription>
              {!isLinkValid
                ? "Lien invalide ou expiré"
                : success
                  ? "Mot de passe mis à jour !"
                  : "Choisissez un nouveau mot de passe sécurisé"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* ─── Lien invalide ─── */}
            {!isLinkValid && (
              <div className="text-center space-y-4 py-4">
                <XCircle className="w-16 h-16 text-red-500 mx-auto" />
                <p className="text-gray-600 dark:text-gray-300">
                  Ce lien est invalide ou a expiré.
                </p>
                <Link to="/forgot-password">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    Redemander un lien
                  </Button>
                </Link>
              </div>
            )}

            {/* ─── Succès ─── */}
            {isLinkValid && success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4 py-4"
              >
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <p className="text-gray-600 dark:text-gray-300 font-medium">
                  Votre mot de passe a été réinitialisé avec succès !
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Redirection vers la page de connexion dans 3 secondes...
                </p>
                <Link to="/login">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white mt-2">
                    Se connecter maintenant
                  </Button>
                </Link>
              </motion.div>
            )}

            {/* ─── Formulaire ─── */}
            {isLinkValid && !success && (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Nouveau mot de passe */}
                <div className="space-y-2">
                  <Label htmlFor="password">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-11"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Indicateurs de validation en temps réel */}
                  {password.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-1 mt-2"
                    >
                      <ValidationItem
                        ok={validations.minLength}
                        text="Au moins 8 caractères"
                      />
                      <ValidationItem
                        ok={validations.hasUpperCase}
                        text="Au moins 1 majuscule"
                      />
                      <ValidationItem
                        ok={validations.hasNumber}
                        text="Au moins 1 chiffre"
                      />
                    </motion.div>
                  )}
                </div>

                {/* Confirmer le mot de passe */}
                <div className="space-y-2">
                  <Label htmlFor="passwordConfirm">
                    Confirmer le mot de passe
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="passwordConfirm"
                      type={showPasswordConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      className="pl-10 pr-10 h-11"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswordConfirm(!showPasswordConfirm)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswordConfirm ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Vérification correspondance */}
                  {passwordConfirm.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <ValidationItem
                        ok={validations.passwordsMatch}
                        text="Les mots de passe correspondent"
                      />
                    </motion.div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium"
                  disabled={
                    loading || !isPasswordValid || !validations.passwordsMatch
                  }
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Réinitialisation...
                    </div>
                  ) : (
                    "Réinitialiser le mot de passe"
                  )}
                </Button>
              </form>
            )}

            {/* Retour connexion */}
            {!success && (
              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium transition-colors"
                >
                  ← Retour à la connexion
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

// ─── Petit composant pour afficher une règle de validation ───
const ValidationItem: React.FC<{ ok: boolean; text: string }> = ({
  ok,
  text,
}) => (
  <div
    className={`flex items-center gap-2 text-xs ${ok ? "text-green-600" : "text-gray-400"}`}
  >
    {ok ? (
      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
    ) : (
      <XCircle className="w-3.5 h-3.5 text-gray-400" />
    )}
    {text}
  </div>
);
