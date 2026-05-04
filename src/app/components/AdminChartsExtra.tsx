import React, { useEffect, useState, useCallback } from "react";
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
  Search,
  SlidersHorizontal,
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
interface CategorieProgression {
  categorie: string;
  moyenne: number;
  nb_apprenants: number;
}

// ── Types pour certifications détaillées ──────────────────────
interface FormationCertif {
  id: string;
  titre: string;
  categorie: string;
  is_coded: boolean;
  formateur: string;
  formateur_id: string;
  nb_inscrits: number;
  nb_certifs: number;
  taux: number;
}
interface CertifDetaillees {
  formations: FormationCertif[];
  categories: string[];
  formateurs: { id: string; nom: string }[];
  toutes_formations: { id: string; titre: string }[];
  total_certifs: number;
  total_inscrits: number;
}

// ── Graphique formations critiques ────────────────────────────
const CriticalFormationsChart: React.FC<{ data: FormationAttention[] }> = ({
  data,
}) => {
  const isDark = useDarkMode();
  const textColor = isDark ? "#94a3b8" : "#475569";
  const gridColor = isDark ? "rgba(148,163,184,0.1)" : "rgba(100,116,139,0.1)";
  const top = [...data].sort((a, b) => b.score - a.score).slice(0, 10);

  return (
    <Bar
      data={{
        labels: top.map((f) => f.titre),
        datasets: [
          {
            label: "Score d'alerte",
            data: top.map((f) => f.score),
            backgroundColor: "rgba(239,68,68,0.8)",
            borderRadius: 4,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items: any[]) => {
                const idx = items[0].dataIndex;
                return top[idx]?.titre ?? "";
              },
              label: (ctx: any) => {
                const f = top[ctx.dataIndex];
                return [
                  `Score: ${f.score}`,
                  `Progression: ${f.prog_moyenne}%`,
                  `Échecs: ${f.taux_echec}%`,
                  `Abandons: ${f.taux_abandon}%`,
                ];
              },
            },
          },
        },
        scales: {
          x: {
            ticks: { color: textColor, font: { size: 10 } },
            grid: { display: false },
          },
          y: {
            beginAtZero: true,
            max: 100,
            ticks: { color: textColor, stepSize: 20 },
            grid: { color: gridColor },
          },
        },
      }}
    />
  );
};

// ── Tableau paginé formations attention ───────────────────────
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
    const diff = b[sortBy] - a[sortBy];
    return sortOrder === "desc" ? diff : -diff;
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
        sortBy === field
          ? setSortOrder((o) => (o === "desc" ? "asc" : "desc"))
          : (setSortBy(field), setSortOrder("desc"));
        setPage(1);
      }}
      className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
    >
      {label}
      <ArrowUpDown className="w-3 h-3" />
    </button>
  );

  const getNiveauBadge = (niveau: string) => {
    const map: Record<string, string> = {
      critique:
        "px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      attention:
        "px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    };
    return (
      <span
        className={
          map[niveau] ??
          "px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
        }
      >
        {niveau.charAt(0).toUpperCase() + niveau.slice(1)}
      </span>
    );
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
            {[
              { val: f.prog_moyenne, color: "bg-green-500" },
              { val: f.taux_echec, color: "bg-red-500" },
              { val: f.taux_abandon, color: "bg-orange-500" },
            ].map((item, j) => (
              <div
                key={j}
                className="col-span-2 text-center flex items-center gap-1"
              >
                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full`}
                    style={{ width: `${item.val}%` }}
                  />
                </div>
                <span className="text-xs w-8">{item.val}%</span>
              </div>
            ))}
            <div className="col-span-1 text-center font-bold">
              <span
                className={
                  f.score >= 70
                    ? "text-red-500"
                    : f.score >= 50
                      ? "text-orange-500"
                      : "text-yellow-500"
                }
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
            {sortedData.length} formation(s) · Page {page}/{totalPages}
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

// ── ✅ Fix 1 — Composant Certifications Détaillées ────────────
const CertificationsDetailees: React.FC = () => {
  const isDark = useDarkMode();
  const textColor = isDark ? "#94a3b8" : "#475569";
  const gridColor = isDark ? "rgba(148,163,184,0.1)" : "rgba(100,116,139,0.08)";
  const titleColor = isDark ? "#cbd5e1" : "#1e293b";

  const [data, setData] = useState<CertifDetaillees | null>(null);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [filterCat, setFilterCat] = useState("all");
  const [filterForm, setFilterForm] = useState("all");
  const [filterUser, setFilterUser] = useState("all");

  const loadData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterCat !== "all") params.append("categorie", filterCat);
    if (filterForm !== "all") params.append("formation_id", filterForm);
    if (filterUser !== "all") params.append("formateur_id", filterUser);

    api
      .get(`/dashboard/certifications-detaillees?${params.toString()}`)
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filterCat, filterForm, filterUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const cardClass = `rounded-2xl p-6 border ${isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-white border-gray-200 shadow-sm"}`;

  // Données du graphique : inscriptions vs certifications
  const formations = data?.formations ?? [];
  const chartLabels = formations.map((f) => f.titre);
  const chartInscrits = formations.map((f) => f.nb_inscrits);
  const chartCertifs = formations.map((f) => f.nb_certifs);

  const barData = {
    labels: chartLabels,
    datasets: [
      {
        label: "Inscrits",
        data: chartInscrits,
        backgroundColor: "rgba(99,102,241,0.7)",
        borderRadius: 4,
      },
      {
        label: "Certifiés",
        data: chartCertifs,
        backgroundColor: "rgba(16,185,129,0.8)",
        borderRadius: 4,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: { color: textColor, font: { size: 11 } },
      },
      title: {
        display: true,
        text: "Certifications vs Inscriptions par formation",
        color: titleColor,
        font: { size: 13 },
        padding: { bottom: 12 },
      },
      tooltip: {
        callbacks: {
          title: (items: any[]) => {
            const idx = items[0].dataIndex;
            return formations[idx]?.titre ?? "";
          },
          afterLabel: (ctx: any) => {
            const f = formations[ctx.dataIndex];
            return f ? `Taux : ${f.taux}%` : "";
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: textColor, font: { size: 10 }, maxRotation: 35 },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: { color: textColor, stepSize: 1, precision: 0 },
        grid: { color: gridColor },
        border: { color: gridColor },
      },
    },
  };

  return (
    <div className={cardClass + " space-y-4"}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Award className="w-4 h-4 text-emerald-500" />
        <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200">
          Certifications générées
        </h3>
        {data && (
          <Badge variant="secondary" className="text-xs ml-auto">
            {data.total_certifs} / {data.total_inscrits} inscrits
          </Badge>
        )}
      </div>

      {/* ✅ Filtres */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {/* Filtre catégorie */}
        <div>
          <label className="text-xs text-gray-500 dark:text-slate-400 block mb-1">
            Catégorie
          </label>
          <select
            value={filterCat}
            onChange={(e) => {
              setFilterCat(e.target.value);
              setFilterForm("all");
            }}
            className="w-full text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700
                       bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 focus:outline-none
                       focus:border-indigo-400 transition-colors"
          >
            <option value="all">Toutes les catégories</option>
            {data?.categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value="__coded__">🔐 Formations codées</option>
          </select>
        </div>

        {/* Filtre formation */}
        <div>
          <label className="text-xs text-gray-500 dark:text-slate-400 block mb-1">
            Formation
          </label>
          <select
            value={filterForm}
            onChange={(e) => setFilterForm(e.target.value)}
            className="w-full text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700
                       bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 focus:outline-none
                       focus:border-indigo-400 transition-colors"
          >
            <option value="all">Toutes les formations</option>
            {data?.toutes_formations.map((f) => (
              <option key={f.id} value={f.id}>
                {f.titre.length > 35 ? f.titre.slice(0, 35) + "…" : f.titre}
              </option>
            ))}
          </select>
        </div>

        {/* Filtre créateur */}
        <div>
          <label className="text-xs text-gray-500 dark:text-slate-400 block mb-1">
            Formateur
          </label>
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="w-full text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700
                       bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 focus:outline-none
                       focus:border-indigo-400 transition-colors"
          >
            <option value="all">Tous les formateurs</option>
            {data?.formateurs.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nom}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Graphique */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
        </div>
      ) : formations.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 gap-2">
          <Award className="w-8 h-8 text-gray-300" />
          <p className="text-sm text-gray-400">
            Aucune donnée pour ces filtres
          </p>
        </div>
      ) : (
        <>
          <div
            style={{
              height: Math.max(200, formations.length * 40) + "px",
              maxHeight: "350px",
            }}
          >
            <Bar data={barData} options={barOptions} />
          </div>

          {/* Résumé par formation */}
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {formations.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-3 py-2 px-3 rounded-xl bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-700/50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {f.is_coded && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                        🔐 Codée
                      </span>
                    )}
                    <p className="text-xs font-semibold text-gray-800 dark:text-slate-200 truncate">
                      {f.titre}
                    </p>
                  </div>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500">
                    {f.formateur} · {f.categorie}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-center">
                    <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      {f.nb_inscrits}
                    </p>
                    <p className="text-[10px] text-gray-400">Inscrits</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {f.nb_certifs}
                    </p>
                    <p className="text-[10px] text-gray-400">Certifiés</p>
                  </div>
                  <div className="text-center min-w-[40px]">
                    <p
                      className={`text-sm font-bold ${f.taux >= 70 ? "text-emerald-500" : f.taux >= 40 ? "text-orange-500" : "text-red-500"}`}
                    >
                      {f.taux}%
                    </p>
                    <p className="text-[10px] text-gray-400">Taux</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ── Composant principal ────────────────────────────────────────
export const AdminChartsExtra: React.FC = () => {
  const isDark = useDarkMode();

  const [attention, setAttention] = useState<FormationAttention[]>([]);
  const [iaStats, setIaStats] = useState<IaStats | null>(null);
  const [categories, setCategories] = useState<CategorieProgression[]>([]);

  const [loadingAttention, setLoadingAttention] = useState(true);
  const [loadingIa, setLoadingIa] = useState(true);
  const [loadingCat, setLoadingCat] = useState(true);

  // Filtre formations attention
  const [filter, setFilter] = useState<
    "all" | "critique" | "attention" | "faible"
  >("all");

  // ✅ Fix 2 — Top N pour catégories
  const [topN, setTopN] = useState<string>(""); // string pour l'input

  const filteredAttention = attention.filter((f) =>
    filter === "all" ? true : f.niveau === filter,
  );

  // ✅ Fix 2 — Tri descendant + limit topN
  const sortedCategories = [...categories].sort(
    (a, b) => b.moyenne - a.moyenne,
  );
  const displayedCategories =
    topN && parseInt(topN) > 0
      ? sortedCategories.slice(0, parseInt(topN))
      : sortedCategories;

  const textColor = isDark ? "#94a3b8" : "#475569";
  const gridColor = isDark ? "rgba(148,163,184,0.1)" : "rgba(100,116,139,0.1)";
  const titleColor = isDark ? "#cbd5e1" : "#1e293b";
  const cardClass = `rounded-2xl p-6 border ${isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-white border-gray-200 shadow-sm"}`;

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
      .get("/dashboard/progression-par-categorie")
      .then((r) => setCategories(r.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingCat(false));
  }, []);

  // ── Bar catégories ────────────────────────────────────────────
  const catBarData = {
    labels: displayedCategories.map((c) => c.categorie),
    datasets: [
      {
        label: "Progression moyenne (%)",
        data: displayedCategories.map((c) => c.moyenne),
        backgroundColor: displayedCategories.map((c) =>
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
        text:
          topN && parseInt(topN) > 0
            ? `Top ${Math.min(parseInt(topN), sortedCategories.length)} catégories (progression décroissante)`
            : "Progression moyenne par catégorie (décroissant)",
        color: titleColor,
        font: { size: 13 },
        padding: { bottom: 10 },
      },
      tooltip: {
        callbacks: {
          title: (items: any[]) => {
            const idx = items[0].dataIndex;
            return displayedCategories[idx]?.categorie ?? "";
          },
          label: (ctx: any) => {
            const cat = displayedCategories[ctx.dataIndex];
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

  // ── Bar IA ────────────────────────────────────────────────────
  const iaBarData = {
    labels: (iaStats?.par_formation ?? []).map((f) => f.titre),
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
      tooltip: {
        callbacks: {
          title: (items: any[]): string => {
            const idx = items[0].dataIndex;
            const formations = iaStats?.par_formation ?? [];
            return formations[idx]?.titre ?? "";
          },
        },
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
      {/* ── Ligne 1 : ✅ Certifications détaillées + Bar catégories ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ✅ Fix 1 — Certifications avec filtres */}
        <CertificationsDetailees />

        {/* ✅ Fix 2 — Catégories avec top N */}
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                Progression par catégorie
              </h3>
            </div>
            {/* ✅ Input Top N */}
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
              <label className="text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">
                Top
              </label>
              <input
                type="number"
                min="1"
                max={sortedCategories.length}
                value={topN}
                onChange={(e) => {
                  const val = e.target.value;
                  if (
                    val === "" ||
                    (parseInt(val) >= 1 && parseInt(val) <= 100)
                  )
                    setTopN(val);
                }}
                placeholder="Tous"
                className="w-16 text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-slate-700
                           bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300
                           focus:outline-none focus:border-indigo-400 text-center"
              />
              {topN && (
                <button
                  onClick={() => setTopN("")}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {loadingCat ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          ) : displayedCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <BarChart2 className="w-8 h-8 text-gray-300" />
              <p className="text-sm text-gray-400">Aucune catégorie</p>
            </div>
          ) : (
            <div
              style={{
                height: Math.max(200, displayedCategories.length * 45) + "px",
              }}
            >
              <Bar data={catBarData} options={catOptions} />
            </div>
          )}

          {sortedCategories.length > 0 && (
            <p className="text-xs text-gray-400 dark:text-slate-500 text-center mt-2">
              {topN && parseInt(topN) > 0
                ? `Affichage : ${Math.min(parseInt(topN), sortedCategories.length)}/${sortedCategories.length} catégories`
                : `${sortedCategories.length} catégorie(s) — triées par progression décroissante`}
            </p>
          )}
        </div>
      </div>

      {/* ── Ligne 2 : Formations attention + IA stats ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formations attention */}
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
            <div className="flex gap-1">
              {(["all", "critique", "attention", "faible"] as const).map(
                (f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-2 py-1 text-xs rounded-md transition-colors ${
                      filter === f
                        ? f === "critique"
                          ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                          : f === "attention"
                            ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
                            : f === "faible"
                              ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                              : "bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white"
                        : "text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {f === "all"
                      ? "Tous"
                      : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ),
              )}
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
                  ? `Aucune formation "${filter}"`
                  : "✅ Toutes les formations se portent bien"}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
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
              <FormationsTable data={filteredAttention} />
            </div>
          )}
        </div>

        {/* IA Stats */}
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
