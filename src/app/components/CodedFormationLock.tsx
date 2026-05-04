import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  Lock,
  Key,
  AlertCircle,
  Loader2,
  CheckCircle,
  Circle,
  BookOpen,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import api from "../services/api";
import { useUnlockedFormations } from "../hooks/useUnlockedFormations";

interface PrerequiItem {
  id: string;
  titre: string;
  a_certificat: boolean;
  pourcentage?: number; // ✅ Fix 2 — champ ajouté
  tous_quiz_reussis?: boolean;
}

interface Props {
  formationId: string;
  formationTitre: string;
  onAccesAccorde: () => void;
}

export const CodedFormationLock: React.FC<Props> = ({
  formationId,
  formationTitre,
  onAccesAccorde,
}) => {
  const navigate = useNavigate();
  const { markUnlocked } = useUnlockedFormations();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState("");
  const [prerequis, setPrerequis] = useState<PrerequiItem[]>([]);
  const [loadingPrereq, setLoadingPrereq] = useState(true);

  useEffect(() => {
    api
      .get(`/formations/${formationId}/verifier-acces`)
      .then((res) => {
        if (res.data.a_acces && res.data.code_deja_valide) {
          markUnlocked(formationId);
          onAccesAccorde();
        } else {
          setPrerequis(res.data.prerequis_formations ?? []);
        }
      })
      .catch(() => {
        // En cas d'erreur API, afficher quand même le lock (pas de crash)
        setPrerequis([]);
      })
      .finally(() => {
        setLoadingPrereq(false); // ← ✅ TOUJOURS arrêter le loading
      });
  }, [formationId]);

  // ✅ Fix 2 — Formation terminée = 100% contenus ET tous les quiz réussis
  const isTermine = (p: PrerequiItem): boolean =>
    p.a_certificat ||
    ((p.pourcentage ?? 0) >= 100 && p.tous_quiz_reussis !== false);

  const nbTotal = prerequis.length;
  const nbTermine = prerequis.filter(isTermine).length;
  const nbCertifie = prerequis.filter((p) => p.a_certificat).length;

  // Tous terminés (certificats OU progression 100 %)
  const tousTermines = nbTotal > 0 && nbTermine === nbTotal;
  // Tous certifiés (pour savoir si le code peut être obtenu)
  const tousCertifies = nbTotal > 0 && nbCertifie === nbTotal;

  const progression = nbTotal > 0 ? Math.round((nbTermine / nbTotal) * 100) : 0;

  const handleVerifier = async () => {
    if (code.length < 8) {
      setErreur("Le code doit contenir exactement 8 caractères.");
      return;
    }
    setLoading(true);
    setErreur("");
    try {
      await api.post(`/formations/${formationId}/verifier-code`, { code });
      markUnlocked(formationId);
      toast.success("✅ Code correct ! Accès accordé.");

      window.scrollTo({ top: 0, behavior: "smooth" }); // ← AJOUTEZ CETTE LIGNE

      onAccesAccorde();
    } catch (err: any) {
      setErreur(
        err?.response?.data?.message ??
          "Code incorrect ou prérequis manquants.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingPrereq)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-purple-50/30 dark:from-slate-950 dark:to-purple-950/30">
        <Loader2 className="w-8 h-8 text-purple-600 dark:text-purple-400 animate-spin" />
      </div>
    );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-screen flex flex-col items-center justify-center p-6
                 bg-gradient-to-br from-gray-50 to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950/30"
    >
      {/* Bouton Retour */}
      <div className="w-full max-w-lg mb-4">
        <button
          onClick={() => navigate("/app/courses")}
          className="flex items-center gap-2 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux formations
        </button>
      </div>

      <div
        className="max-w-lg w-full rounded-3xl shadow-xl border border-gray-200 dark:border-purple-500/20
                      bg-white dark:bg-slate-900/80 p-8 space-y-6"
      >
        {/* Icône cadenas animé */}
        <div className="flex justify-center">
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="w-20 h-20 bg-purple-100 dark:bg-purple-900/40 border border-purple-300 dark:border-purple-500/30 rounded-full
                       flex items-center justify-center"
          >
            <Lock className="w-10 h-10 text-purple-600 dark:text-purple-400" />
          </motion.div>
        </div>

        {/* Titre */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Formation codée
          </h2>
          <p className="text-gray-500 dark:text-slate-400 mt-1 text-sm">
            <span className="font-semibold text-purple-600 dark:text-purple-400">
              {formationTitre}
            </span>{" "}
            .
          </p>
        </div>

        {/* Prérequis */}
        <div className="space-y-2">
          <p className="text-xs text-gray-400 dark:text-slate-500 text-center">
            il faut terminer les formations prérequises pour obtenir le code
            d'accès.
          </p>
          {nbTotal > 0 && (
            <div className="bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700 dark:text-slate-200 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Formations prérequises
                </p>

                {/* ✅ Fix 2 — Badge adaptatif : terminés (progression) vs certifiés */}
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      tousCertifies
                        ? "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-500/30"
                        : tousTermines
                          ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-500/30"
                          : "bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30"
                    }`}
                  >
                    {tousCertifies
                      ? `${nbCertifie}/${nbTotal} certifié${nbCertifie > 1 ? "s" : ""}`
                      : `${nbTermine}/${nbTotal} terminé${nbTermine > 1 ? "s" : ""}`}
                  </span>
                </div>
              </div>

              {/* Barre de progression */}
              <div className="space-y-1">
                <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progression}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      tousCertifies
                        ? "bg-gradient-to-r from-green-500 to-emerald-500"
                        : tousTermines
                          ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                          : "bg-gradient-to-r from-purple-600 to-indigo-600"
                    }`}
                  />
                </div>
                <p className="text-xs text-gray-400 dark:text-slate-500 text-right">
                  {progression}%
                </p>
              </div>

              {/* Liste prérequis cliquables */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {prerequis.map((p) => {
                  const termine = isTermine(p);
                  const certifie = p.a_certificat;
                  const pct = p.pourcentage ?? 0;

                  return (
                    <motion.button
                      key={p.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => navigate(`/app/courses/${p.id}`)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm border
                                transition-all cursor-pointer group hover:scale-[1.01] text-left ${
                                  certifie
                                    ? "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-500/15"
                                    : termine
                                      ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-500/15"
                                      : "bg-gray-50 dark:bg-slate-700/40 border-gray-200 dark:border-slate-600/40 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700/60 hover:border-purple-300 dark:hover:border-purple-500/40"
                                }`}
                    >
                      {/* Icône état */}
                      {certifie ? (
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                      ) : termine ? (
                        // ✅ Fix 2 — 100% progression mais pas encore certifié
                        <CheckCircle className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" />
                      )}

                      <span
                        className={`flex-1 truncate font-medium ${
                          certifie ? "line-through opacity-70" : ""
                        }`}
                      >
                        {p.titre}
                      </span>

                      {/* Badge droite */}
                      {certifie ? (
                        <span className="text-xs text-green-600 dark:text-green-500 font-medium shrink-0">
                          ✓ Certifié
                        </span>
                      ) : termine ? (
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold shrink-0">
                          terminé
                        </span>
                      ) : pct >= 100 && !p.tous_quiz_reussis ? (
                        // ✅ Contenus à 100% mais quiz pas encore tous réussis
                        <span className="text-xs text-orange-500 dark:text-orange-400 shrink-0 font-medium">
                          quiz en attente
                        </span>
                      ) : pct > 0 ? (
                        <span className="text-xs text-purple-500 dark:text-purple-400 shrink-0">
                          {pct}%
                        </span>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-purple-500 dark:text-purple-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Message d'état bas de section */}
              {tousCertifies ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl p-3 text-center"
                >
                  <p className="text-green-700 dark:text-green-400 text-sm font-semibold">
                    🎉 Tous les prérequis sont complétés !
                  </p>
                  <p className="text-green-600/70 dark:text-green-500/70 text-xs mt-0.5">
                    Le code a été envoyé dans vos notifications.
                  </p>
                </motion.div>
              ) : (
                <p className="text-xs text-gray-400 dark:text-slate-500 text-center">
                  Cliquez sur une formation pour la consulter.
                </p>
              )}
            </div>
          )}
        </div>

        {nbTotal === 0 && (
          <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-300">
            <p className="font-semibold mb-1 flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-600 dark:text-blue-400" />{" "}
              Comment obtenir le code ?
            </p>
            <p>
              Obtenez les certificats des formations prérequises. Le code vous
              sera envoyé automatiquement.
            </p>
          </div>
        )}

        <div className="border-t border-gray-200 dark:border-slate-700/50" />

        {/* Champ code */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300 block">
            Entrez votre code d'accès
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.slice(0, 8));
              setErreur("");
            }}
            placeholder="Votre code d'accès..."
            maxLength={8}
            className="w-full text-center text-xl font-mono tracking-widest py-3 px-4
                       rounded-xl border-2 border-gray-300 dark:border-slate-700
                       bg-gray-50 dark:bg-slate-800/80 text-gray-900 dark:text-white
                       focus:outline-none focus:border-purple-500 dark:focus:border-purple-500
                       placeholder:text-gray-400 dark:placeholder:text-slate-600
                       transition-colors"
          />
          <p className="text-xs text-center text-gray-400 dark:text-slate-500">
            {code.length}/8 caractères minimum
          </p>
        </div>

        {erreur && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-500/20 rounded-xl p-3"
          >
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400">{erreur}</p>
          </motion.div>
        )}

        <Button
          onClick={handleVerifier}
          disabled={loading || code.length < 8}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600
                     hover:from-purple-700 hover:to-indigo-700 text-white gap-2 h-12
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Vérification...
            </>
          ) : (
            <>
              <Key className="w-4 h-4" /> Débloquer la formation
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
};
