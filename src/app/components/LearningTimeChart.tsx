// src/app/components/LearningTimeChart.tsx
import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import api from "../services/api";
import { Loader2, Clock } from "lucide-react";
import { useDarkMode } from "../hooks/useDarkMode";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

interface TempsData {
  formation_titre: string;
  duree_minutes: number;
  duree_secondes: number;
}

export const LearningTimeChart: React.FC = () => {
  const [data, setData] = useState<TempsData[]>([]);
  const [loading, setLoading] = useState(true);
  const isDark = useDarkMode();

  useEffect(() => {
    api
      .get("/dashboard/temps-apprentissage")
      .then((res) => setData(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const textColor = isDark ? "#94a3b8" : "#475569";
  const gridColor = isDark ? "rgba(148,163,184,0.1)" : "rgba(100,116,139,0.1)";
  const titleColor = isDark ? "#cbd5e1" : "#1e293b";
  const cardClass = `rounded-2xl p-6 border ${
    isDark
      ? "bg-slate-800/50 border-slate-700/50"
      : "bg-white border-gray-200 shadow-sm"
  }`;

  const formatDuree = (secondes: number) => {
    if (secondes < 60) return `${secondes}s`;
    if (secondes < 3600) return `${Math.round(secondes / 60)}min`;
    const h = Math.floor(secondes / 3600);
    const m = Math.round((secondes % 3600) / 60);
    return m > 0 ? `${h}h${m}min` : `${h}h`;
  };

  const chartData = {
    labels: data.map((d) =>
      d.formation_titre.length > 22
        ? d.formation_titre.slice(0, 22) + "…"
        : d.formation_titre,
    ),
    datasets: [
      {
        label: "Temps passé",
        data: data.map((d) => Math.round(d.duree_secondes / 60)), // en minutes
        backgroundColor: data.map((_, i) => {
          const opacity = 0.9 - (i / Math.max(data.length, 1)) * 0.4;
          return `rgba(16,185,129,${opacity})`;
        }),
        borderColor: "rgba(16,185,129,1)",
        borderWidth: 1,
        borderRadius: 5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y" as const,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Temps d'apprentissage par formation",
        color: titleColor,
        font: { size: 13 },
        padding: { bottom: 12 },
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const secondes = data[ctx.dataIndex]?.duree_secondes ?? 0;
            return ` ${formatDuree(secondes)}`;
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          color: textColor,
          callback: (val: any) => `${val}min`,
        },
        grid: { color: gridColor },
        border: { color: gridColor },
        title: {
          display: true,
          text: "Minutes",
          color: textColor,
          font: { size: 11 },
        },
      },
      y: {
        ticks: { color: textColor, font: { size: 11 } },
        grid: { display: false },
        border: { display: false },
      },
    },
  };

  if (loading) {
    return (
      <div className={cardClass + " flex items-center justify-center h-40"}>
        <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        className={
          cardClass + " flex flex-col items-center justify-center h-40 gap-2"
        }
      >
        <Clock className="w-7 h-7 text-gray-300 dark:text-slate-600" />
        <p className="text-sm text-gray-400 dark:text-slate-500">
          Aucun temps enregistré pour l'instant
        </p>
      </div>
    );
  }

  return (
    <div className={cardClass}>
      <div style={{ height: Math.max(180, data.length * 40) + "px" }}>
        <Bar data={chartData} options={options} />
      </div>

      {/* Résumé total */}
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
        <span className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" /> Temps total d'apprentissage
        </span>
        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
          {formatDuree(data.reduce((s, d) => s + d.duree_secondes, 0))}
        </span>
      </div>
    </div>
  );
};
