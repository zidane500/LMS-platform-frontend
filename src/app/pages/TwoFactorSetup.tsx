import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Shield, ShieldCheck, ShieldOff, Smartphone } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { toast } from "sonner";
import {
  setup2FA,
  enable2FA,
  disable2FA,
  get2FAStatus,
} from "../services/authService";
import { useAuth } from "../context/AuthContext";

// ─── Type des étapes ─────────────────────────────────────
type Step = "idle" | "scan" | "confirm" | "disable" | "done" | "disabled";

export const TwoFactorSetup: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("idle");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [is2FAActive, setIs2FAActive] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // ─── Vérifier l'état 2FA au chargement ─────────────────
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const data = await get2FAStatus();
        setIs2FAActive(data.enabled);
      } catch {
        // silencieux
      } finally {
        setCheckingStatus(false);
      }
    };
    checkStatus();
  }, []);

  // ─── Lancer le setup ────────────────────────────────────
  const handleSetup = async () => {
    setLoading(true);
    try {
      const data = await setup2FA();
      setQrCodeUrl(data.qr_code_url);
      setSecret(data.secret);
      setStep("scan");
    } catch {
      toast.error("Erreur lors de la génération du QR code.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Confirmer et activer ───────────────────────────────
  const handleEnable = async () => {
    if (code.length !== 6) {
      toast.error("Le code doit contenir 6 chiffres.");
      return;
    }
    setLoading(true);
    try {
      await enable2FA(code);
      toast.success("2FA activée avec succès !");
      setCode("");
      setStep("done");
    } catch {
      toast.error("Code invalide. Réessayez.");
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  // ─── Désactiver ────────────────────────────────────────
  const handleDisable = async () => {
    if (code.length !== 6) {
      toast.error("Le code doit contenir 6 chiffres.");
      return;
    }
    setLoading(true);
    try {
      await disable2FA(code);
      toast.success("2FA désactivée.");
      setCode("");
      setIs2FAActive(false);
      setStep("disabled");
    } catch {
      toast.error("Code invalide. Réessayez.");
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  // ─── URL QR code via API qrserver ──────────────────────
  const qrImageUrl = qrCodeUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}`
    : "";

  return (
    <div className="max-w-lg mx-auto py-10 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card>
          <CardHeader className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
                <Shield className="w-10 h-10 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">
              Authentification à deux facteurs
            </CardTitle>
            <CardDescription>
              Protège ton compte admin avec une vérification supplémentaire à
              chaque connexion.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 px-8 pb-8">
            {/* ── idle : boutons activer / désactiver ─────── */}
            {step === "idle" && (
              <div className="space-y-4">
                {/* Statut actuel */}
                {checkingStatus ? (
                  <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* Badge statut */}
                    <div
                      className={`flex items-center gap-3 p-4 rounded-xl border ${
                        is2FAActive
                          ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                          : "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
                      }`}
                    >
                      {is2FAActive ? (
                        <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
                      ) : (
                        <Smartphone className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      )}
                      <p
                        className={`text-sm ${
                          is2FAActive
                            ? "text-green-700 dark:text-green-300"
                            : "text-blue-700 dark:text-blue-300"
                        }`}
                      >
                        {is2FAActive ? (
                          <>
                            <strong>2FA activée</strong> — ton compte est
                            protégé.
                          </>
                        ) : (
                          <>
                            Tu auras besoin de{" "}
                            <strong>Google Authenticator</strong> ou{" "}
                            <strong>Authy</strong>.
                          </>
                        )}
                      </p>
                    </div>

                    {/* Bouton Activer — masqué si déjà active */}
                    {!is2FAActive && (
                      <Button
                        onClick={handleSetup}
                        disabled={loading}
                        className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                      >
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        {loading ? "Chargement..." : "Activer la 2FA"}
                      </Button>
                    )}

                    {/* Bouton Désactiver — visible seulement si active */}
                    {is2FAActive && (
                      <Button
                        onClick={() => setStep("disable")}
                        variant="outline"
                        className="w-full h-11 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
                      >
                        <ShieldOff className="w-4 h-4 mr-2" />
                        Désactiver la 2FA
                      </Button>
                    )}
                    <Button
                      onClick={() => navigate("/app/admin")}
                      variant="ghost"
                      className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                    >
                      Retour
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* ── scan : afficher le QR code ──────────────── */}
            {step === "scan" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    1. Ouvre Google Authenticator ou l'extension Chrome
                  </p>
                  <p className="text-sm text-gray-500">
                    2. Clique sur <strong>+</strong> puis{" "}
                    <strong>Scanner un QR code</strong>
                  </p>
                  <p className="text-sm text-gray-500">
                    3. Scanne ce code ou entre le secret manuellement
                  </p>
                </div>

                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="p-3 bg-white rounded-2xl shadow border border-gray-200">
                    {qrImageUrl ? (
                      <img
                        src={qrImageUrl}
                        alt="QR Code 2FA"
                        className="w-48 h-48"
                      />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center text-gray-400 text-sm">
                        Chargement...
                      </div>
                    )}
                  </div>
                </div>

                {/* Secret manuel */}
                <details className="text-center">
                  <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 select-none">
                    ▶ Entrer le secret manuellement à la place
                  </summary>
                  <div className="mt-2 space-y-1">
                    <p className="font-mono text-sm bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3 tracking-widest break-all select-all">
                      {secret}
                    </p>
                    <p className="text-xs text-gray-400">
                      Clique sur le code pour le sélectionner puis copie-colle
                      dans ton appli
                    </p>
                  </div>
                </details>

                <Button
                  onClick={() => setStep("confirm")}
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                >
                  J'ai scanné le code →
                </Button>

                <Button
                  onClick={() => setStep("idle")}
                  variant="ghost"
                  className="w-full"
                >
                  Annuler
                </Button>
              </motion.div>
            )}

            {/* ── confirm : entrer le code ─────────────────── */}
            {step === "confirm" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                  Entre le code à <strong>6 chiffres</strong> affiché dans ton
                  appli pour confirmer que tout fonctionne.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="confirmCode">Code de vérification</Label>
                  <Input
                    id="confirmCode"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    className="h-12 text-center tracking-[0.5em] text-xl font-mono"
                    autoFocus
                  />
                </div>

                <Button
                  onClick={handleEnable}
                  disabled={loading || code.length !== 6}
                  className="w-full h-11 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Vérification...
                    </div>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      Confirmer et activer
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => setStep("scan")}
                  variant="ghost"
                  className="w-full"
                >
                  ← Retour au QR code
                </Button>
              </motion.div>
            )}

            {/* ── disable : désactiver ─────────────────────── */}
            {step === "disable" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                  <ShieldOff className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Entre le code depuis ton appli pour confirmer la
                    désactivation.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="disableCode">Code de vérification</Label>
                  <Input
                    id="disableCode"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    className="h-12 text-center tracking-[0.5em] text-xl font-mono"
                    autoFocus
                  />
                </div>

                <Button
                  onClick={handleDisable}
                  disabled={loading || code.length !== 6}
                  className="w-full h-11 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Désactivation...
                    </div>
                  ) : (
                    <>
                      <ShieldOff className="w-4 h-4 mr-2" />
                      Confirmer la désactivation
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => {
                    setStep("idle");
                    setCode("");
                  }}
                  variant="ghost"
                  className="w-full"
                >
                  Annuler
                </Button>
              </motion.div>
            )}

            {/* ── done : succès ────────────────────────────── */}
            {step === "done" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-5 text-center"
              >
                <div className="flex justify-center">
                  <div className="p-4 bg-green-100 dark:bg-green-950 rounded-full">
                    <ShieldCheck className="w-12 h-12 text-green-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-green-700 dark:text-green-400">
                    2FA activée avec succès !
                  </p>
                  <p className="text-sm text-gray-500">
                    À chaque connexion, tu devras entrer le code depuis ton
                    appli.
                  </p>
                </div>
                <Button
                  onClick={() => navigate("/app/admin")}
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                >
                  Retour
                </Button>
              </motion.div>
            )}
            {/* ── disabled : confirmation désactivation ───────── */}
            {step === "disabled" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-5 text-center"
              >
                <div className="flex justify-center">
                  <div className="p-4 bg-red-100 dark:bg-red-950 rounded-full">
                    <ShieldOff className="w-12 h-12 text-red-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-red-700 dark:text-red-400">
                    2FA désactivée
                  </p>
                  <p className="text-sm text-gray-500">
                    Ton compte n'est plus protégé par la double
                    authentification.
                  </p>
                </div>
                <div className="space-y-3">
                  <Button
                    onClick={() => navigate("/app/admin")}
                    variant="ghost"
                    className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  >
                    Retour
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
