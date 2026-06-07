import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router";
import { motion } from "motion/react";
import { GraduationCap, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
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
import loginImage from "@/assets/09efca758bab23262c0ec1f67a245e59c64dfb6d.png";
import axios from "axios";

// ✅ Type pour Turnstile (évite erreurs TypeScript)
declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: object) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

// ✅ Remplace par ta vraie clé depuis dash.cloudflare.com
// Pour les tests locaux, utilise : 1x00000000000000000000AA (toujours succès)
const TURNSTILE_SITE_KEY =
  import.meta.env.VITE_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";
const TURNSTILE_ENABLED = true;

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ Turnstile state
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileReady, setTurnstileReady] = useState(false);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");

  // ✅ Initialiser Turnstile après le montage
  useEffect(() => {
    const initTurnstile = () => {
      if (window.turnstile && turnstileRef.current && !widgetIdRef.current) {
        widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: document.documentElement.classList.contains("dark")
            ? "dark"
            : "light",
          callback: (token: string) => {
            setTurnstileToken(token);
            setTurnstileReady(true);
          },
          "expired-callback": () => {
            setTurnstileToken(null);
            setTurnstileReady(false);
          },
          "error-callback": () => {
            // En cas d'erreur Turnstile, on laisse quand même passer
            setTurnstileToken("bypass");
            setTurnstileReady(true);
          },
        });
      }
    };

    // Attendre que le script Turnstile soit chargé
    if (window.turnstile) {
      initTurnstile();
    } else {
      const interval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(interval);
          initTurnstile();
        }
      }, 100);

      const timeout = setTimeout(() => {
        clearInterval(interval);
        // Turnstile non chargé après 8s → on laisse passer mais on log
        console.warn("Turnstile script non chargé après 8s");
        setTurnstileReady(true);
      }, 8000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Vérification Turnstile
    if (!turnstileToken && TURNSTILE_SITE_KEY !== "1x00000000000000000000AA") {
      toast.error("Veuillez compléter la vérification de sécurité");
      return;
    }

    setLoading(true);

    try {
      const result = await login({
        email,
        mot_de_passe: password,
        cf_turnstile_response: TURNSTILE_ENABLED ? turnstileToken : "bypass",
        two_factor_code: requires2FA ? twoFactorCode : undefined,
      });

      // Le backend demande le code 2FA
      if ("requires_2fa" in result) {
        setRequires2FA(true);
        setLoading(false);
        return;
      }

      toast.success(`Bienvenue ${result.firstName} !`);
      navigate(result.role === "admin" ? "/app/admin" : "/app");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.errors?.email?.[0] ||
          error.response?.data?.message ||
          "Email ou mot de passe incorrect";
        toast.error(message);
      } else {
        toast.error("Une erreur est survenue. Réessayez.");
      }

      // ✅ Reset Turnstile après erreur
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
        setTurnstileToken(null);
        setTurnstileReady(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen max-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 p-3 lg:p-4 relative overflow-hidden">
      {/* Décorations fond */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ y: [0, -30, 0], x: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/10 dark:bg-blue-400/5 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 40, 0], x: [0, -30, 0] }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute -bottom-32 -left-32 w-80 h-80 bg-purple-500/10 dark:bg-purple-400/5 rounded-full blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative z-10 flex items-stretch w-full max-w-4xl shadow-2xl rounded-3xl overflow-hidden"
      >
        {/* Côté gauche : Image */}
        <motion.div
          initial={{ x: -60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:block lg:w-1/2 flex-shrink-0"
        >
          <img
            src={loginImage}
            alt="LMS Platform"
            className="w-full h-full object-cover"
          />
        </motion.div>

        {/* Côté droit : Formulaire */}
        <Card className="w-full lg:w-1/2 rounded-none lg:rounded-r-3xl lg:rounded-l-none backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border-0 border-l border-white/20 dark:border-slate-700/50">
          <CardHeader className="text-center space-y-3 pb-4 pt-6">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.3,
              }}
              className="flex justify-center"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur-xl opacity-50" />
                <div className="relative p-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
                  <GraduationCap className="w-12 h-12 text-white" />
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Bienvenue
              </CardTitle>
            </motion.div>
          </CardHeader>

          <form onSubmit={handleLogin}>
            <CardContent className="space-y-3 px-8 pb-4">
              {/* Email */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-2"
              >
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Saisir votre email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="pl-10 h-11 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"
                    required
                  />
                </div>
              </motion.div>

              {/* Mot de passe */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-2"
              >
                <Label htmlFor="password" className="text-sm font-medium">
                  Mot de passe
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Saisir votre mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="pl-10 pr-10 h-11 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </motion.div>

              {/* Champ 2FA — affiché uniquement si le backend le demande */}
              {requires2FA && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-2"
                >
                  <Label htmlFor="twoFactor" className="text-sm font-medium">
                    Code d'authentification
                  </Label>
                  <div className="relative group">
                    <Input
                      id="twoFactor"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Code à 6 chiffres"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value)}
                      className="h-11 text-center tracking-widest text-lg"
                      autoFocus
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    Ouvre Google Authenticator ou Authy et entre le code
                  </p>
                </motion.div>
              )}

              {/* Mot de passe oublié */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65 }}
                className="flex justify-end text-sm"
              >
                <Link
                  to="/forgot-password"
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                >
                  Mot de passe oublié ?
                </Link>
              </motion.div>

              {/* Bouton Se connecter */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Button
                  type="submit"
                  className="w-48 h-11 mx-auto block bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg shadow-blue-500/30"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Connexion...
                    </div>
                  ) : (
                    "Se connecter"
                  )}
                </Button>
              </motion.div>

              {/* Lien inscription */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="text-sm text-center text-gray-600 dark:text-gray-400 space-y-3"
              >
                <p>Pas encore de compte ?</p>
                <Link to="/register">
                  <Button
                    type="button"
                    className="w-48 h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium"
                  >
                    S'inscrire
                  </Button>
                </Link>
              </motion.div>
              {/* ✅ Cloudflare Turnstile — positionné proprement dans le formulaire */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <div className="flex flex-col items-center gap-2">
                  {/* Widget Turnstile */}
                  {TURNSTILE_ENABLED && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 }}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div ref={turnstileRef} className="cf-turnstile" />
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </CardContent>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};
