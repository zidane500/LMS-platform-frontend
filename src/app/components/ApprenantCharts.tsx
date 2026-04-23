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

export const ApprenantCharts: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

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

  // ── Donut : complétées vs non complétées ────────────────
  const donutData = {
    labels: ["Complétées", "Non complétées"],
    datasets: [
      {
        data: [
          stats.formations_completees,
          Math.max(0, stats.total_formations - stats.formations_completees),
        ],
        backgroundColor: ["rgba(99,102,241,0.85)", "rgba(148,163,184,0.2)"],
        borderColor: ["rgb(99,102,241)", "rgba(148,163,184,0.3)"],
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
        labels: { color: "#94a3b8", font: { size: 12 } },
      },
      title: {
        display: true,
        text: "Formations complétées / Total plateforme",
        color: "#94a3b8",
        font: { size: 13 },
      },
    },
  };

  // ── Ligne : complétées par mois ─────────────────────────
  const lineData = {
    labels: stats.labels_mois,
    datasets: [
      {
        label: "Formations complétées",
        data: stats.data_mois,
        fill: true,
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        tension: 0.4,
        pointBackgroundColor: "rgb(16, 185, 129)",
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
        color: "#94a3b8",
        font: { size: 13 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: "#94a3b8", stepSize: 1 },
        grid: { color: "rgba(148,163,184,0.1)" },
      },
      x: {
        ticks: { color: "#94a3b8", maxRotation: 45 },
        grid: { color: "rgba(148,163,184,0.1)" },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Donut */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <div className="max-w-xs mx-auto">
          <Doughnut data={donutData} options={donutOptions} />
        </div>
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-indigo-400">
              {stats.formations_completees}
            </p>
            <p className="text-slate-400 text-xs">Complétées</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-400">
              {stats.total_formations}
            </p>
            <p className="text-slate-400 text-xs">Total plateforme</p>
          </div>
        </div>
      </div>

      {/* Ligne mensuelle */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <Line data={lineData} options={lineOptions} />
      </div>
    </div>
  );
};
