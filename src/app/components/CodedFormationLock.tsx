import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Lock,
  Key,
  AlertCircle,
  Loader2,
  CheckCircle,
  Circle,
  BookOpen,
} from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import api from "../services/api";

interface PrerequiItem {
  id: string;
  titre: string;
  a_certificat: boolean;
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
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState("");
  const [prerequis, setPrerequis] = useState<PrerequiItem[]>([]);
  const [loadingPrereq, setLoadingPrereq] = useState(true);

  // ✅ Charger les prérequis avec leur statut de certification
  useEffect(() => {
    api
      .get(`/formations/${formationId}/verifier-acces`)
      .then((res) => {
        if (res.data.a_acces) {
          onAccesAccorde();
        } else {
          setPrerequis(res.data.prerequis_formations ?? []);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingPrereq(false));
  }, [formationId]);

  const nbTotal = prerequis.length;
  const nbObtenu = prerequis.filter((p) => p.a_certificat).length;
  const tousObtenu = nbTotal > 0 && nbObtenu === nbTotal;
  const progression = nbTotal > 0 ? Math.round((nbObtenu / nbTotal) * 100) : 0;

  const handleVerifier = async () => {
    if (code.length !== 8) {
      setErreur("Le code doit contenir exactement 8 caractères.");
      return;
    }
    setLoading(true);
    setErreur("");
    try {
      await api.post(`/formations/${formationId}/verifier-code`, {
        code: code.toUpperCase(),
      });
      toast.success("Code correct ! Accès accordé.");
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

  if (loadingPrereq) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 to-purple-950/30">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-screen flex items-center justify-center p-6
                 bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950/30"
    >
      <div
        className="max-w-lg w-full rounded-3xl shadow-2xl border border-purple-500/20
                      bg-slate-900/80 backdrop-blur-xl p-8 space-y-6"
      >
        {/* Icône cadenas animé */}
        <div className="flex justify-center">
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="w-20 h-20 bg-purple-900/40 border border-purple-500/30 rounded-full
                       flex items-center justify-center"
          >
            <Lock className="w-10 h-10 text-purple-400" />
          </motion.div>
        </div>

        {/* Titre */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">Formation codée</h2>
          <p className="text-slate-400 mt-1 text-sm">
            <span className="font-semibold text-purple-400">
              {formationTitre}
            </span>{" "}
            est une formation à accès restreint.
          </p>
        </div>

        {/* ✅ Fix 3 — Section prérequis avec progression */}
        {nbTotal > 0 && (
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 space-y-3">
            {/* En-tête section prérequis */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-400" />
                Formations prérequises
              </p>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  tousObtenu
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                }`}
              >
                {nbObtenu}/{nbTotal} certifié{nbObtenu > 1 ? "s" : ""}
              </span>
            </div>

            {/* Barre de progression */}
            <div className="space-y-1">
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progression}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full rounded-full ${
                    tousObtenu
                      ? "bg-gradient-to-r from-green-500 to-emerald-400"
                      : "bg-gradient-to-r from-purple-600 to-indigo-500"
                  }`}
                />
              </div>
              <p className="text-xs text-slate-500 text-right">
                {progression}%
              </p>
            </div>

            {/* Liste des prérequis */}
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {prerequis.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm border transition-colors ${
                    p.a_certificat
                      ? "bg-green-500/10 border-green-500/20 text-green-300"
                      : "bg-slate-700/40 border-slate-600/40 text-slate-400"
                  }`}
                >
                  {p.a_certificat ? (
                    <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                  <span
                    className={`flex-1 truncate ${p.a_certificat ? "line-through opacity-70" : ""}`}
                  >
                    {p.titre}
                  </span>
                  {p.a_certificat && (
                    <span className="text-xs text-green-500 font-medium shrink-0">
                      ✓
                    </span>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Message selon progression */}
            {tousObtenu ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center"
              >
                <p className="text-green-400 text-sm font-semibold">
                  🎉 Tous les prérequis sont complétés !
                </p>
                <p className="text-green-500/70 text-xs mt-0.5">
                  Le code a été envoyé dans vos notifications.
                </p>
              </motion.div>
            ) : (
              <p className="text-xs text-slate-500 text-center">
                Complétez les formations ci-dessus pour recevoir le code
                automatiquement.
              </p>
            )}
          </div>
        )}

        {/* Si aucun prérequis — message générique */}
        {nbTotal === 0 && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-300 text-left">
            <p className="font-semibold mb-1 flex items-center gap-2">
              <Key className="w-4 h-4" /> Comment obtenir le code ?
            </p>
            <p>
              Obtenez les certificats des formations prérequises. Le code vous
              sera automatiquement communiqué par notification.
            </p>
          </div>
        )}

        {/* Séparateur */}
        <div className="border-t border-slate-700/50" />

        {/* Champ code */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300 block">
            Entrez votre code d'accès
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => {
              const val = e.target.value
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, "");
              if (val.length <= 8) setCode(val);
              setErreur("");
            }}
            placeholder="X X X X X X X X"
            maxLength={8}
            className="w-full text-center text-2xl font-mono tracking-[0.5em] py-3 px-4
                       rounded-xl border-2 border-slate-700 bg-slate-800/80 text-white
                       focus:outline-none focus:border-purple-500
                       placeholder:tracking-[0.3em] placeholder:text-slate-600
                       uppercase transition-colors"
          />
          <p className="text-xs text-center text-slate-500">
            {code.length}/8 caractères
          </p>
        </div>

        {/* Erreur */}
        {erreur && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 bg-red-950/30 border border-red-500/20 rounded-xl p-3"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-sm text-red-400">{erreur}</p>
          </motion.div>
        )}

        {/* Bouton débloquer */}
        <Button
          onClick={handleVerifier}
          disabled={loading || code.length !== 8}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600
                     hover:from-purple-700 hover:to-indigo-700 gap-2 h-12
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
