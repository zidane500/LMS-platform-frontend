// src/app/components/InstructorChart.tsx
import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import api from "../services/api";
import { Loader2 } from "lucide-react";
import { useDarkMode } from "../hooks/useDarkMode";
import { useAuth } from "../context/AuthContext";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface Formation {
  id: number;
  titre: string;
}

export const InstructorChart: React.FC = () => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin";

  const [allFormations, setAllFormations] = useState<Formation[]>([]);
  const [myFormations, setMyFormations] = useState<Formation[]>([]);
  // ✅ Mode : "all" = toutes les formations | "mine" = créées par l'admin
  const [filterMode, setFilterMode] = useState<"all" | "mine">("all");
  const formations = filterMode === "mine" ? myFormations : allFormations;

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [labels, setLabels] = useState<string[]>([]);
  const [data, setData] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [formationNom, setFormationNom] = useState("");
  const isDark = useDarkMode();

  const cardClass =
    "border rounded-2xl p-6 space-y-4 " +
    (isDark
      ? "bg-slate-800/50 border-slate-700/50"
      : "bg-white border-gray-200 shadow-sm");

  // ── Charger toutes les formations ──────────────────────────
  useEffect(() => {
    api
      .get("/dashboard/mes-formations")
      .then((res) => {
        setAllFormations(res.data);
        // ✅ Formations créées par l'admin (formateur_id = currentUser.id)
        // La route /dashboard/mes-formations retourne déjà les formations de l'utilisateur
        // Pour admin : on a besoin d'une 2e requête avec mine=true
        if (isAdmin) {
          api
            .get("/dashboard/mes-formations?mine=true")
            .then((res2) => {
              setMyFormations(res2.data);
            })
            .catch(() => {});
        }
        if (res.data.length > 0) setSelectedId(res.data[0].id);
      })
      .catch(() => {});
  }, []);

  // Quand on change de mode, reset la sélection
  useEffect(() => {
    if (formations.length > 0) {
      setSelectedId(formations[0].id);
    } else {
      setSelectedId(null);
      setLabels([]);
      setData([]);
      setFormationNom("");
    }
  }, [filterMode]);

  // ── Charger les stats de la formation sélectionnée ────────
  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    api
      .get(`/dashboard/inscriptions-semaine?formation_id=${selectedId}`)
      .then((res) => {
        setLabels(res.data.labels);
        setData(res.data.data);
        setFormationNom(res.data.formation);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedId]);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Nouvelles inscriptions",
        data,
        fill: true,
        borderColor: "rgb(99, 102, 241)",
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        tension: 0.4,
        pointBackgroundColor: "rgb(99, 102, 241)",
        pointRadius: 5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: formationNom
          ? `Inscriptions — ${formationNom}`
          : "Inscriptions par semaine",
        color: isDark ? "#94a3b8" : "#374151",
        font: { size: 14 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: isDark ? "#94a3b8" : "#6b7280",
          stepSize: 1,
        },
        grid: {
          color: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)",
        },
      },
      x: {
        ticks: { color: isDark ? "#94a3b8" : "#6b7280" },
        grid: {
          color: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)",
        },
      },
    },
  };

  if (allFormations.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-2xl p-6 text-center text-slate-400 text-sm">
        Aucune formation disponible.
      </div>
    );
  }

  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
          📈 Inscriptions par semaine
        </h3>

        <div className="flex items-center gap-2 flex-wrap">
          {/* ✅ Bouton filtre "Mes formations" — visible seulement pour admin */}
          {isAdmin && (
            <div className="flex rounded-lg border border-slate-600 overflow-hidden">
              <button
                onClick={() => setFilterMode("all")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  filterMode === "all"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                Toutes
              </button>
              <button
                onClick={() => setFilterMode("mine")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  filterMode === "mine"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                Mes formations
              </button>
            </div>
          )}

          {/* Sélecteur de formation */}
          {formations.length > 0 ? (
            <select
              value={selectedId ?? ""}
              onChange={(e) => setSelectedId(Number(e.target.value))}
              className={`text-sm rounded-lg px-3 py-1.5 border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isDark
                  ? "bg-slate-700 text-white border-slate-600"
                  : "bg-white text-gray-900 border-gray-300"
              }`}
            >
              {formations.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.titre}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-slate-500 italic">
              {isAdmin
                ? "Aucune formation créée par l'admin"
                : "Aucune formation"}
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
        </div>
      ) : formations.length === 0 && filterMode === "mine" ? (
        <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
          Vous n'avez pas encore créé de formation.
        </div>
      ) : (
        <div className="h-[300px] md:h-[320px]">
          <Line data={chartData} options={options} />
        </div>
      )}
    </div>
  );
};
