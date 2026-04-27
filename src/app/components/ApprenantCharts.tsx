import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import api from "../services/api";
import { Loader2 } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface Stats {
  total_formations: number;
  formations_completees: number;
  formations_en_cours: number;
  labels_mois: string[];
  data_mois: number[];
}

// ✅ Hook pour détecter le mode dark (surveille la classe sur <html>)
function useDarkMode() {
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark"),
  );
  useEffect(() => {
    const obs = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

export const ApprenantCharts: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const isDark = useDarkMode();

  useEffect(() => {
    api
      .get("/dashboard/apprenant/stats")
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
      </div>
    );
  }
  if (!stats) return null;

  // ── Couleurs adaptées au thème ─────────────────────────
  const textColor = isDark ? "#94a3b8" : "#475569";
  const gridColor = isDark ? "rgba(148,163,184,0.1)" : "rgba(100,116,139,0.12)";
  const titleColor = isDark ? "#cbd5e1" : "#1e293b";

  // ── Donut ──────────────────────────────────────────────
  const donutData = {
    labels: ["Complétées", "Non complétées"],
    datasets: [
      {
        data: [
          stats.formations_completees,
          Math.max(0, stats.total_formations - stats.formations_completees),
        ],
        backgroundColor: [
          "rgba(99,102,241,0.85)",
          isDark ? "rgba(148,163,184,0.2)" : "rgba(203,213,225,0.5)",
        ],
        borderColor: [
          "rgb(99,102,241)",
          isDark ? "rgba(148,163,184,0.3)" : "rgba(148,163,184,0.4)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const donutOptions = {
    responsive: true,
    cutout: "70%",
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: { color: textColor, font: { size: 12 }, padding: 16 },
      },
      title: {
        display: true,
        text: "Formations complétées / Total plateforme",
        color: titleColor,
        font: { size: 13 },
        padding: { bottom: 16 },
      },
    },
  };

  // ── Ligne mensuelle ────────────────────────────────────
  const lineData = {
    labels: stats.labels_mois,
    datasets: [
      {
        label: "Formations complétées",
        data: stats.data_mois,
        fill: true,
        borderColor: "rgb(16,185,129)",
        backgroundColor: isDark
          ? "rgba(16,185,129,0.1)"
          : "rgba(16,185,129,0.08)",
        tension: 0.4,
        pointBackgroundColor: "rgb(16,185,129)",
        pointRadius: 4,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Formations complétées par mois",
        color: titleColor,
        font: { size: 13 },
        padding: { bottom: 12 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: textColor, stepSize: 1 },
        grid: { color: gridColor },
        border: { color: gridColor },
      },
      x: {
        ticks: { color: textColor, maxRotation: 45 },
        grid: { color: gridColor },
        border: { color: gridColor },
      },
    },
  };

  // ── Conteneur thème-aware ──────────────────────────────
  const cardClass =
    "rounded-2xl p-6 border " +
    (isDark
      ? "bg-slate-800/50 border-slate-700/50"
      : "bg-white border-gray-200 shadow-sm");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Donut */}
      <div className={cardClass}>
        <div className="max-w-xs mx-auto">
          <Doughnut data={donutData} options={donutOptions} />
        </div>
        <div className="flex justify-center gap-8 mt-4 text-sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-indigo-500">
              {stats.formations_completees}
            </p>
            <p className="text-gray-500 dark:text-slate-400 text-xs mt-0.5">
              Complétées
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-400 dark:text-slate-400">
              {stats.total_formations}
            </p>
            <p className="text-gray-500 dark:text-slate-400 text-xs mt-0.5">
              Total plateforme
            </p>
          </div>
        </div>
      </div>

      {/* Ligne mensuelle */}
      <div className={cardClass}>
        <Line data={lineData} options={lineOptions} />
      </div>
    </div>
  );
};
