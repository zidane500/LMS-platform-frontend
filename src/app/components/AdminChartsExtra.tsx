// src/app/components/AdminChartsExtra.tsx
import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import api from "../services/api";
import { Loader2, AlertTriangle, Brain, Award, BarChart2 } from "lucide-react";
import { useDarkMode } from "../hooks/useDarkMode";

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend,
);

// ── Types ──────────────────────────────────────────────────────
interface FormationAttention {
  titre: string;
  prog_moyenne: number;
  taux_echec: number;
  taux_abandon: number;
  score: number;
  alertes: string[];
  niveau: "critique" | "attention" | "faible";
}

interface IaStats {
  total_corrigees: number;
  score_moyen: number;
  insuffisantes: number;
  par_formation: {
    titre: string;
    nb_corrigees: number;
    score_moyen_ia: number;
    nb_insuffisantes: number;
  }[];
}

interface CertifStats {
  labels: string[];
  data: number[];
  total: number;
}

interface CategorieProgression {
  categorie: string;
  moyenne: number;
  nb_apprenants: number;
}

// ── Composant principal ────────────────────────────────────────
export const AdminChartsExtra: React.FC = () => {
  const isDark = useDarkMode();

  const [attention, setAttention] = useState<FormationAttention[]>([]);
  const [iaStats, setIaStats] = useState<IaStats | null>(null);
  const [certifStats, setCertifStats] = useState<CertifStats | null>(null);
  const [categories, setCategories] = useState<CategorieProgression[]>([]);

  const [loadingAttention, setLoadingAttention] = useState(true);
  const [loadingIa, setLoadingIa] = useState(true);
  const [loadingCertif, setLoadingCertif] = useState(true);
  const [loadingCat, setLoadingCat] = useState(true);

  // Couleurs
  const textColor = isDark ? "#94a3b8" : "#475569";
  const gridColor = isDark ? "rgba(148,163,184,0.1)" : "rgba(100,116,139,0.1)";
  const titleColor = isDark ? "#cbd5e1" : "#1e293b";
  const cardClass = `rounded-2xl p-6 border ${
    isDark
      ? "bg-slate-800/50 border-slate-700/50"
      : "bg-white border-gray-200 shadow-sm"
  }`;

  useEffect(() => {
    api
      .get("/dashboard/formations-attention")
      .then((r) => setAttention(r.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingAttention(false));

    api
      .get("/dashboard/ia-stats")
      .then((r) => setIaStats(r.data))
      .catch(() => {})
      .finally(() => setLoadingIa(false));

    api
      .get("/dashboard/certifications-stats")
      .then((r) => setCertifStats(r.data))
      .catch(() => {})
      .finally(() => setLoadingCertif(false));

    api
      .get("/dashboard/progression-par-categorie")
      .then((r) => setCategories(r.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingCat(false));
  }, []);

  // ── Donut certifications ──────────────────────────────────────
  const certifData = certifStats
    ? {
        labels: certifStats.labels,
        datasets: [
          {
            data: certifStats.data,
            backgroundColor: [
              "rgba(16,185,129,0.85)", // Certifiés — vert
              "rgba(99,102,241,0.85)", // En cours  — indigo
              "rgba(148,163,184,0.5)", // Non éligibles — gris
            ],
            borderColor: [
              "rgb(16,185,129)",
              "rgb(99,102,241)",
              "rgb(148,163,184)",
            ],
            borderWidth: 2,
          },
        ],
      }
    : null;

  const certifOptions = {
    responsive: true,
    cutout: "65%",
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: textColor,
          padding: 12,
          font: { size: 11 },
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: "Certifications générées",
        color: titleColor,
        font: { size: 13 },
        padding: { bottom: 12 },
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const total = certifStats?.total ?? 1;
            const pct = Math.round((ctx.parsed / total) * 100);
            return ` ${ctx.label} : ${ctx.parsed} (${pct}%)`;
          },
        },
      },
    },
  };

  // ── Bar catégories ────────────────────────────────────────────
  const catBarData = {
    labels: categories.map((c) =>
      c.categorie.length > 18 ? c.categorie.slice(0, 18) + "…" : c.categorie,
    ),
    datasets: [
      {
        label: "Progression moyenne (%)",
        data: categories.map((c) => c.moyenne),
        backgroundColor: categories.map((c) =>
          c.moyenne >= 70
            ? "rgba(16,185,129,0.8)"
            : c.moyenne >= 50
              ? "rgba(99,102,241,0.8)"
              : "rgba(239,68,68,0.75)",
        ),
        borderRadius: 5,
        borderWidth: 1,
      },
    ],
  };

  const catOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Progression moyenne par catégorie",
        color: titleColor,
        font: { size: 13 },
        padding: { bottom: 10 },
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const cat = categories[ctx.dataIndex];
            return [
              ` ${ctx.parsed.y}% de progression`,
              ` ${cat?.nb_apprenants ?? 0} apprenant(s)`,
            ];
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: { color: textColor, callback: (v: any) => `${v}%` },
        grid: { color: gridColor },
        border: { color: gridColor },
      },
      x: {
        ticks: { color: textColor, font: { size: 10 } },
        grid: { display: false },
        border: { display: false },
      },
    },
  };

  // ── Bar IA par formation ──────────────────────────────────────
  const iaBarData = {
    labels: (iaStats?.par_formation ?? []).map((f) =>
      f.titre.length > 20 ? f.titre.slice(0, 20) + "…" : f.titre,
    ),
    datasets: [
      {
        label: "Score moyen IA (%)",
        data: (iaStats?.par_formation ?? []).map((f) => f.score_moyen_ia),
        backgroundColor: "rgba(99,102,241,0.8)",
        borderRadius: 4,
      },
      {
        label: "Réponses insuffisantes",
        data: (iaStats?.par_formation ?? []).map((f) => f.nb_insuffisantes),
        backgroundColor: "rgba(239,68,68,0.7)",
        borderRadius: 4,
      },
    ],
  };

  const iaBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: { color: textColor, font: { size: 11 } },
      },
      title: {
        display: true,
        text: "Performance des réponses IA par formation",
        color: titleColor,
        font: { size: 13 },
        padding: { bottom: 10 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: textColor },
        grid: { color: gridColor },
        border: { color: gridColor },
      },
      x: {
        ticks: { color: textColor, font: { size: 10 } },
        grid: { display: false },
        border: { display: false },
      },
    },
  };

  const niveauColor = (niveau: string) =>
    ({
      critique:
        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
      attention:
        "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
      faible:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
    })[niveau] ?? "";

  return (
    <div className="space-y-6">
      {/* ── Ligne 1 : Donut certifications + Bar catégories ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut certifications */}
        <div className={cardClass}>
          {loadingCertif ? (
            <div className="flex items-center justify-center h-56">
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
            </div>
          ) : certifData ? (
            <>
              <div className="max-w-xs mx-auto">
                <Doughnut data={certifData} options={certifOptions} />
              </div>
              <div className="flex justify-center gap-6 mt-3">
                {certifStats!.labels.map((label, i) => (
                  <div key={label} className="text-center">
                    <p
                      className="text-lg font-bold"
                      style={{
                        color: [
                          "rgb(16,185,129)",
                          "rgb(99,102,241)",
                          "rgb(148,163,184)",
                        ][i],
                      }}
                    >
                      {certifStats!.data[i]}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-center text-xs text-gray-400 dark:text-slate-500 mt-1">
                Total : {certifStats!.total} utilisateur
                {certifStats!.total > 1 ? "s" : ""}
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <Award className="w-8 h-8 text-gray-300" />
              <p className="text-sm text-gray-400">Aucune donnée</p>
            </div>
          )}
        </div>

        {/* Bar progression par catégorie */}
        <div className={cardClass}>
          {loadingCat ? (
            <div className="flex items-center justify-center h-56">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <BarChart2 className="w-8 h-8 text-gray-300" />
              <p className="text-sm text-gray-400">Aucune catégorie</p>
            </div>
          ) : (
            <div
              style={{ height: Math.max(200, categories.length * 45) + "px" }}
            >
              <Bar data={catBarData} options={catOptions} />
            </div>
          )}
        </div>
      </div>

      {/* ── Ligne 2 : Formations attention + IA stats ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tableau formations nécessitant attention */}
        <div className={cardClass + " space-y-3"}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200">
              Formations nécessitant une attention
            </h3>
          </div>

          {loadingAttention ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
            </div>
          ) : attention.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <p className="text-sm text-gray-400 dark:text-slate-500">
                ✅ Toutes les formations se portent bien
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {attention.map((f, i) => (
                <div
                  key={i}
                  className={`flex flex-col gap-1 p-3 rounded-xl border text-sm ${niveauColor(f.niveau)}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold truncate max-w-[70%]">
                      {f.titre}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        f.niveau === "critique"
                          ? "bg-red-500 text-white"
                          : f.niveau === "attention"
                            ? "bg-orange-500 text-white"
                            : "bg-yellow-500 text-white"
                      }`}
                    >
                      {f.niveau}
                    </span>
                  </div>
                  <div className="flex gap-3 text-xs opacity-80 flex-wrap">
                    <span>📊 {f.prog_moyenne}% moy.</span>
                    <span>❌ {f.taux_echec}% échecs</span>
                    <span>🚪 {f.taux_abandon}% abandons</span>
                  </div>
                  {f.alertes.length > 0 && (
                    <p className="text-xs opacity-70 italic">
                      {f.alertes.join(" · ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bar IA stats */}
        <div className={cardClass + " space-y-3"}>
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-500" />
            <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200">
              Performance IA (Gemini) — Réponses libres
            </h3>
          </div>

          {/* Stats globales IA */}
          {iaStats && (
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  label: "Corrigées",
                  val: iaStats.total_corrigees,
                  color: "text-indigo-500",
                },
                {
                  label: "Score moyen",
                  val: `${iaStats.score_moyen}%`,
                  color: "text-emerald-500",
                },
                {
                  label: "Insuffisantes",
                  val: iaStats.insuffisantes,
                  color: "text-red-500",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="text-center bg-gray-50 dark:bg-slate-700/50 rounded-xl p-2"
                >
                  <p className={`text-lg font-bold ${s.color}`}>{s.val}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-400">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          )}

          {loadingIa ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
            </div>
          ) : !iaStats || iaStats.par_formation.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-24 gap-2">
              <Brain className="w-7 h-7 text-gray-300" />
              <p className="text-sm text-gray-400">
                Aucune réponse IA enregistrée
              </p>
            </div>
          ) : (
            <div
              style={{
                height: Math.max(160, iaStats.par_formation.length * 48) + "px",
              }}
            >
              <Bar data={iaBarData} options={iaBarOptions} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
