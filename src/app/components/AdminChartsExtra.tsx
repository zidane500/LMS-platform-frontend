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
import {
  Loader2,
  AlertTriangle,
  Brain,
  Award,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import { useDarkMode } from "../hooks/useDarkMode";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

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

// ── Composant pour le graphique des formations critiques (Top N) ──
const CriticalFormationsChart: React.FC<{ data: FormationAttention[] }> = ({
  data,
}) => {
  const isDark = useDarkMode();
  const textColor = isDark ? "#94a3b8" : "#475569";
  const gridColor = isDark ? "rgba(148,163,184,0.1)" : "rgba(100,116,139,0.1)";

  const topFormations = [...data]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const chartData = {
    labels: topFormations.map((f) =>
      f.titre.length > 20 ? f.titre.slice(0, 20) + "…" : f.titre,
    ),
    datasets: [
      {
        label: "Score d'alerte",
        data: topFormations.map((f) => f.score),
        backgroundColor: "rgba(239,68,68,0.8)",
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const formation = topFormations[ctx.dataIndex];
            return [
              `Score: ${formation.score}`,
              `Progression: ${formation.prog_moyenne}%`,
              `Échecs: ${formation.taux_echec}%`,
              `Abandons: ${formation.taux_abandon}%`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: textColor, font: { size: 10 }, rotation: 45 },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        max: 100,
        ticks: { color: textColor, stepSize: 20 },
        grid: { color: gridColor },
        title: {
          display: true,
          text: "Score d'alerte",
          color: textColor,
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

// ── Composant tableau paginé pour toutes les formations ──
const FormationsTable: React.FC<{ data: FormationAttention[] }> = ({
  data,
}) => {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<
    "score" | "prog_moyenne" | "taux_echec" | "taux_abandon"
  >("score");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const itemsPerPage = 10;

  const sortedData = [...data].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    return sortOrder === "desc" ? bVal - aVal : aVal - bVal;
  });

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage,
  );

  const SortButton: React.FC<{ field: typeof sortBy; label: string }> = ({
    field,
    label,
  }) => (
    <button
      onClick={() => {
        if (sortBy === field) {
          setSortOrder(sortOrder === "desc" ? "asc" : "desc");
        } else {
          setSortBy(field);
          setSortOrder("desc");
        }
        setPage(1);
      }}
      className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
    >
      {label}
      <ArrowUpDown className="w-3 h-3" />
    </button>
  );

  const getNiveauBadge = (niveau: string) => {
    switch (niveau) {
      case "critique":
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            Critique
          </span>
        );
      case "attention":
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
            Attention
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
            Faible
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-12 gap-3 px-3 py-2 bg-gray-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">
        <div className="col-span-5">Formation</div>
        <div className="col-span-2 text-center">
          <SortButton field="prog_moyenne" label="Progression" />
        </div>
        <div className="col-span-2 text-center">
          <SortButton field="taux_echec" label="Échecs" />
        </div>
        <div className="col-span-2 text-center">
          <SortButton field="taux_abandon" label="Abandons" />
        </div>
        <div className="col-span-1 text-center">
          <SortButton field="score" label="Score" />
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {paginatedData.map((f, i) => (
          <div
            key={i}
            className="grid grid-cols-12 gap-3 px-3 py-2 rounded-lg border border-gray-100 dark:border-slate-800 text-sm"
          >
            <div className="col-span-5 flex items-center gap-2">
              {getNiveauBadge(f.niveau)}
              <span className="font-medium truncate" title={f.titre}>
                {f.titre.length > 30 ? f.titre.slice(0, 30) + "…" : f.titre}
              </span>
            </div>
            <div className="col-span-2 text-center">
              <div className="flex items-center gap-1">
                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${f.prog_moyenne}%` }}
                  />
                </div>
                <span className="text-xs w-8">{f.prog_moyenne}%</span>
              </div>
            </div>
            <div className="col-span-2 text-center">
              <div className="flex items-center gap-1">
                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${f.taux_echec}%` }}
                  />
                </div>
                <span className="text-xs w-8 text-red-500">
                  {f.taux_echec}%
                </span>
              </div>
            </div>
            <div className="col-span-2 text-center">
              <div className="flex items-center gap-1">
                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{ width: `${f.taux_abandon}%` }}
                  />
                </div>
                <span className="text-xs w-8 text-orange-500">
                  {f.taux_abandon}%
                </span>
              </div>
            </div>
            <div className="col-span-1 text-center font-bold">
              <span
                className={`${f.score >= 70 ? "text-red-500" : f.score >= 50 ? "text-orange-500" : "text-yellow-500"}`}
              >
                {f.score}
              </span>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 border-t dark:border-slate-800">
          <span className="text-xs text-gray-500">
            {sortedData.length} formation(s) · Page {page} / {totalPages}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

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

  // ✅ Filtre pour les formations attention
  const [filter, setFilter] = useState<
    "all" | "critique" | "attention" | "faible"
  >("all");

  // Filtrer les données
  const filteredAttention = attention.filter((f) =>
    filter === "all" ? true : f.niveau === filter,
  );

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
              "rgba(16,185,129,0.85)",
              "rgba(99,102,241,0.85)",
              "rgba(148,163,184,0.5)",
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

  return (
    <div className="space-y-6">
      {/* ── Ligne 1 : Donut certifications + Bar catégories ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

      {/* ── Ligne 2 : Formations attention (version optimisée) + IA stats ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section Formations nécessitant attention - Version optimisée */}
        <div className={cardClass + " space-y-4"}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                Formations nécessitant une attention
              </h3>
              {attention.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {filteredAttention.length}/{attention.length}
                </Badge>
              )}
            </div>

            {/* ✅ Filtre par niveau */}
            <div className="flex gap-1">
              <button
                onClick={() => setFilter("all")}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${
                  filter === "all"
                    ? "bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white"
                    : "text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setFilter("critique")}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${
                  filter === "critique"
                    ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                    : "text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                }`}
              >
                Critique
              </button>
              <button
                onClick={() => setFilter("attention")}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${
                  filter === "attention"
                    ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
                    : "text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                }`}
              >
                Attention
              </button>
              <button
                onClick={() => setFilter("faible")}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${
                  filter === "faible"
                    ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                    : "text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                }`}
              >
                Faible
              </button>
            </div>
          </div>

          {loadingAttention ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
            </div>
          ) : filteredAttention.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <p className="text-sm text-gray-400 dark:text-slate-500">
                {filter !== "all"
                  ? `Aucune formation avec niveau "${filter}"`
                  : "✅ Toutes les formations se portent bien"}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Graphique des 10 plus critiques */}
              {filteredAttention.length > 1 && (
                <div className="bg-gray-50 dark:bg-slate-800/30 rounded-xl p-4">
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">
                    📊 Top {Math.min(10, filteredAttention.length)} formations
                    les plus critiques
                  </p>
                  <div style={{ height: "280px" }}>
                    <CriticalFormationsChart data={filteredAttention} />
                  </div>
                </div>
              )}

              {/* Tableau paginé pour toutes les formations */}
              <FormationsTable data={filteredAttention} />
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
