import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import { motion } from "motion/react";
import {
  CheckCircle,
  XCircle,
  Award,
  User,
  GraduationCap,
  Calendar,
  Loader2,
} from "lucide-react";
import { verifierCertificat } from "../services/certificatService";

export const VerifyCertificate: React.FC = () => {
  const { numero } = useParams<{ numero: string }>();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<{
    valid: boolean;
    certificat?: any;
  } | null>(null);

  useEffect(() => {
    if (!numero) return;
    verifierCertificat(numero)
      .then((data) => setResult(data))
      .catch(() => setResult({ valid: false }))
      .finally(() => setLoading(false));
  }, [numero]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-white text-xl font-bold">
            <GraduationCap className="w-8 h-8 text-indigo-400" />
            LMS Platform
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Vérification de certificat
          </p>
        </div>

        <div
          className="rounded-3xl border border-white/10 overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(20px)",
          }}
        >
          {loading ? (
            <div className="p-12 flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-indigo-400 animate-spin" />
              <p className="text-slate-400">Vérification en cours...</p>
            </div>
          ) : result?.valid ? (
            <>
              {/* Barre verte */}
              <div className="h-2 bg-gradient-to-r from-green-400 to-emerald-500" />

              <div className="p-8 text-center space-y-6">
                {/* Icône succès */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                >
                  <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-green-400" />
                  </div>
                </motion.div>

                <div>
                  <h1 className="text-2xl font-bold text-green-400">
                    Certificat Valide
                  </h1>
                  <p className="text-slate-400 text-sm mt-1">
                    Ce certificat est authentique
                  </p>
                </div>

                {/* Infos certificat */}
                <div className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-4 text-left">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-indigo-400 shrink-0" />
                    <div>
                      <p className="text-slate-400 text-sm mt-1">Apprenant</p>
                      <p className="text-white font-semibold">
                        {result.certificat?.learnerName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-5 h-5 text-purple-400 shrink-0" />
                    <div>
                      <p className="text-slate-400 text-sm mt-1">Formation</p>
                      <p className="text-white font-semibold">
                        {result.certificat?.courseName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-pink-400 shrink-0" />
                    <div>
                      <p className="text-slate-400 text-sm mt-1">
                        Date d'émission
                      </p>
                      <p className="text-white font-semibold">
                        {result.certificat?.date
                          ? new Date(result.certificat.date).toLocaleDateString(
                              "fr-FR",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              },
                            )
                          : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-yellow-400 shrink-0" />
                    <div>
                      <p className="text-slate-400 text-sm mt-1">Mention</p>
                      <span className="inline-block px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                        {result.certificat?.mention}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10">
                  <p className="text-slate-400 text-sm mt-1">N° {numero}</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="h-2 bg-gradient-to-r from-red-500 to-rose-600" />
              <div className="p-8 text-center space-y-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                >
                  <div className="w-20 h-20 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
                    <XCircle className="w-10 h-10 text-red-400" />
                  </div>
                </motion.div>

                <div>
                  <h1 className="text-2xl font-bold text-red-400">
                    Certificat Invalide
                  </h1>
                  <p className="text-slate-400 text-sm mt-2">
                    Ce certificat n'existe pas ou a été révoqué. Veuillez
                    contacter l'émetteur.
                  </p>
                </div>

                <div className="rounded-2xl bg-white/5 border border-red-500/20 p-4">
                  <p className="text-xs text-slate-500 font-mono">
                    N° {numero}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-slate-400 text-sm mt-1">
          © LMS Platform — Système de vérification de certificats
        </p>
      </motion.div>
    </div>
  );
};
