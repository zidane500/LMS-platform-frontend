// src/app/components/AdminCharts.tsx
import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import api from "../services/api";
import { Loader2, Users, Trophy } from "lucide-react";
import { useDarkMode } from "../hooks/useDarkMode";

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

interface UsersStats {
  labels: string[];
  data: number[];
  total: number;
}

interface TopFormation {
  titre: string;
  inscriptions: number;
}

export const AdminCharts: React.FC = () => {
  const isDark = useDarkMode();

  // ── Donut utilisateurs ────────────────────────────────
  const [usersStats, setUsersStats] = useState<UsersStats | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // ── Histogramme formations ────────────────────────────
  const [topFormations, setTopFormations] = useState<TopFormation[]>([]);
  const [loadingTop, setLoadingTop] = useState(true);
  const [topLimit, setTopLimit] = useState(10);
  const [inputLimit, setInputLimit] = useState("10");

  // Couleurs adaptées au thème
  const textColor = isDark ? "#94a3b8" : "#475569";
  const gridColor = isDark ? "rgba(148,163,184,0.1)" : "rgba(100,116,139,0.1)";
  const titleColor = isDark ? "#cbd5e1" : "#1e293b";
  const cardClass = isDark
    ? "bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6"
    : "bg-white border border-gray-200 shadow-sm rounded-2xl p-6";

  // ── Charger stats utilisateurs ────────────────────────
  useEffect(() => {
    api
      .get("/dashboard/users-stats")
      .then((res) => setUsersStats(res.data))
      .catch(() => {})
      .finally(() => setLoadingUsers(false));
  }, []);

  // ── Charger top formations ────────────────────────────
  useEffect(() => {
    setLoadingTop(true);
    api
      .get(`/dashboard/top-formations?limit=${topLimit}`)
      .then((res) => setTopFormations(res.data.formations ?? []))
      .catch(() => {})
      .finally(() => setLoadingTop(false));
  }, [topLimit]);

  const handleApplyLimit = () => {
    const n = parseInt(inputLimit);
    if (!isNaN(n) && n >= 1 && n <= 50) {
      setTopLimit(n);
    }
  };

  // ── Données Donut ─────────────────────────────────────
  const donutData = usersStats
    ? {
        labels: usersStats.labels,
        datasets: [
          {
            data: usersStats.data,
            backgroundColor: [
              "rgba(99,102,241,0.85)", // Apprenants — indigo
              "rgba(16,185,129,0.85)", // Formateurs — vert
              "rgba(239,68,68,0.85)", // Admins     — rouge
            ],
            borderColor: [
              "rgb(99,102,241)",
              "rgb(16,185,129)",
              "rgb(239,68,68)",
            ],
            borderWidth: 2,
          },
        ],
      }
    : null;

  const donutOptions = {
    responsive: true,
    cutout: "65%",
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: textColor,
          padding: 16,
          font: { size: 12 },
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: "Répartition des utilisateurs",
        color: titleColor,
        font: { size: 13 },
        padding: { bottom: 16 },
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const total = usersStats?.total ?? 1;
            const pct = Math.round((ctx.parsed / total) * 100);
            return ` ${ctx.label} : ${ctx.parsed} (${pct}%)`;
          },
        },
      },
    },
  };

  // ── Données Bar ───────────────────────────────────────
  const barData = {
    labels: topFormations.map((f) =>
      f.titre.length > 25 ? f.titre.slice(0, 25) + "…" : f.titre,
    ),
    datasets: [
      {
        label: "Inscriptions",
        data: topFormations.map((f) => f.inscriptions),
        backgroundColor: topFormations.map((_, i) => {
          const opacity = 0.85 - (i / topFormations.length) * 0.35;
          return `rgba(99,102,241,${opacity})`;
        }),
        borderColor: "rgba(99,102,241,1)",
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    indexAxis: "y" as const, // Horizontal pour mieux lire les titres
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: `Top ${topLimit} formations par inscriptions`,
        color: titleColor,
        font: { size: 13 },
        padding: { bottom: 12 },
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) =>
            ` ${ctx.parsed.x} inscription${ctx.parsed.x > 1 ? "s" : ""}`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { color: textColor, stepSize: 1 },
        grid: { color: gridColor },
        border: { color: gridColor },
      },
      y: {
        ticks: { color: textColor, font: { size: 11 } },
        grid: { display: false },
        border: { display: false },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ── Donut utilisateurs ── */}
      <div className={cardClass}>
        {loadingUsers ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          </div>
        ) : donutData ? (
          <>
            <div className="max-w-xs mx-auto">
              <Doughnut data={donutData} options={donutOptions} />
            </div>

            {/* Légende enrichie */}
            <div className="flex justify-center gap-6 mt-4">
              {usersStats!.labels.map((label, i) => (
                <div key={label} className="text-center">
                  <p
                    className="text-xl font-bold"
                    style={{
                      color: [
                        "rgb(99,102,241)",
                        "rgb(16,185,129)",
                        "rgb(239,68,68)",
                      ][i],
                    }}
                  >
                    {usersStats!.data[i]}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            <p className="text-center text-xs text-gray-400 dark:text-slate-500 mt-2">
              Total : {usersStats!.total} utilisateur
              {usersStats!.total > 1 ? "s" : ""}
            </p>
          </>
        ) : (
          <p className="text-center text-gray-400 py-8">
            Données indisponibles
          </p>
        )}
      </div>

      {/* ── Histogramme top formations ── */}
      <div className={cardClass + " space-y-4"}>
        {/* Contrôle du Top N */}
        <div className="flex items-center gap-3 flex-wrap">
          <Users className="w-4 h-4 text-indigo-500 shrink-0" />
          <span className="text-sm font-medium text-gray-700 dark:text-slate-300 shrink-0">
            Afficher le top
          </span>
          <input
            type="number"
            min="1"
            max="50"
            value={inputLimit}
            onChange={(e) => setInputLimit(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleApplyLimit()}
            className={`w-20 text-center text-sm rounded-lg px-2 py-1.5 border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              isDark
                ? "bg-slate-700 text-white border-slate-600"
                : "bg-gray-50 text-gray-900 border-gray-300"
            }`}
          />
          <button
            onClick={handleApplyLimit}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-colors"
          >
            Appliquer
          </button>
          {/* Raccourcis rapides */}
          <div className="flex gap-1 flex-wrap">
            {[5, 10, 20, 30].map((n) => (
              <button
                key={n}
                onClick={() => {
                  setTopLimit(n);
                  setInputLimit(String(n));
                }}
                className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                  topLimit === n
                    ? "bg-indigo-500 border-indigo-500 text-white"
                    : isDark
                      ? "bg-slate-700 border-slate-600 text-slate-300 hover:border-indigo-400"
                      : "bg-white border-gray-300 text-gray-600 hover:border-indigo-400"
                }`}
              >
                Top {n}
              </button>
            ))}
          </div>
        </div>

        {loadingTop ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          </div>
        ) : topFormations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <Trophy className="w-8 h-8 text-gray-300" />
            <p className="text-sm text-gray-400">
              Aucune formation avec des inscriptions
            </p>
          </div>
        ) : (
          <div
            style={{ height: Math.max(200, topFormations.length * 36) + "px" }}
          >
            <Bar
              data={barData}
              options={{ ...barOptions, maintainAspectRatio: false }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
