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

// ✅ Enregistrement Chart.js (obligatoire une seule fois)
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
  const [formations, setFormations] = useState<Formation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [labels, setLabels] = useState<string[]>([]);
  const [data, setData] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [formationNom, setFormationNom] = useState("");

  // Charger la liste des formations
  useEffect(() => {
    api
      .get("/dashboard/mes-formations")
      .then((res) => {
        setFormations(res.data);
        if (res.data.length > 0) setSelectedId(res.data[0].id);
      })
      .catch(() => {});
  }, []);

  // Charger les stats quand la formation change
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
        color: "#94a3b8",
        font: { size: 14 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: "#94a3b8", stepSize: 1 },
        grid: { color: "rgba(148,163,184,0.1)" },
      },
      x: {
        ticks: { color: "#94a3b8" },
        grid: { color: "rgba(148,163,184,0.1)" },
      },
    },
  };

  if (formations.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-2xl p-6 text-center text-slate-400 text-sm">
        Aucune formation créée pour le moment.
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-white font-semibold text-sm">
          📈 Inscriptions par semaine
        </h3>
        {/* Sélecteur de formation */}
        <select
          value={selectedId ?? ""}
          onChange={(e) => setSelectedId(Number(e.target.value))}
          className="text-sm bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {formations.map((f) => (
            <option key={f.id} value={f.id}>
              {f.titre}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
        </div>
      ) : (
        <div className="h-[300px] md:h-[320px]">
          <Line data={chartData} options={options} />
        </div>
      )}
    </div>
  );
};
