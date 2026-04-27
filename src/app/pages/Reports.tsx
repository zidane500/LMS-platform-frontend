import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Download, FileText, Filter, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { getFormations } from "../services/formationService";
import { getMesProgressions } from "../services/progressionService";
import type { Course } from "../types";
import type { ProgressionResume } from "../services/progressionService";

export const Reports: React.FC = () => {
  const { currentUser } = useAuth();
  const [selectedFormat, setSelectedFormat] = useState<"csv" | "pdf">("pdf");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [formations, setFormations] = useState<Course[]>([]);
  const [progressions, setProgressions] = useState<ProgressionResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [allForms, progs] = await Promise.all([
          getFormations(),
          getMesProgressions(),
        ]);
        const enrolledIds = new Set(progs.map((p) => String(p.formation_id)));
        setFormations(allForms.filter((f) => enrolledIds.has(String(f.id))));
        setProgressions(progs);
      } catch {
        toast.error("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = () =>
    selectedCourse === "all"
      ? progressions
      : progressions.filter((p) => String(p.formation_id) === selectedCourse);

  const exportToCSV = () => {
    const rows = filtered();
    if (rows.length === 0) {
      toast.error("Aucune donnée à exporter");
      return;
    }

    const headers = ["Formation", "Progression (%)", "Statut"];
    const data = rows.map((p) => [
      p.formation_titre,
      String(p.pourcentage_global),
      p.complete ? "Terminée" : "En cours",
    ]);

    const csv =
      "\uFEFF" +
      [headers, ...data]
        .map((r) => r.map((c) => `"${c}"`).join(","))
        .join("\n");

    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    a.download = `Rapport_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("📊 Rapport CSV téléchargé !");
  };

  const exportToPDF = () => {
    const rows = filtered();
    if (rows.length === 0) {
      toast.error("Aucune donnée à exporter");
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229);
    doc.text("Rapport de Progression", 20, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, 20, 28);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(
      `${currentUser?.firstName ?? ""} ${currentUser?.lastName ?? ""}`,
      20,
      38,
    );
    doc.text(currentUser?.email ?? "", 20, 44);

    let y = 58;
    rows.forEach((p, i) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(13);
      doc.setTextColor(79, 70, 229);
      doc.text(`${i + 1}. ${p.formation_titre}`, 20, y);
      y += 7;

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Progression : ${p.pourcentage_global}%`, 25, y);
      y += 5;
      doc.text(`Statut : ${p.complete ? "Terminée ✓" : "En cours"}`, 25, y);
      y += 10;
    });

    for (let i = 1; i <= doc.getNumberOfPages(); i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} / ${doc.getNumberOfPages()}`, 200, 285, {
        align: "right",
      });
    }

    doc.save(`Rapport_${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("📄 Rapport PDF téléchargé !");
  };

  const handleExport = () => {
    setExporting(true);
    try {
      selectedFormat === "csv" ? exportToCSV() : exportToPDF();
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 dark:from-slate-950 dark:to-purple-950/30">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
            <FileText className="w-10 h-10 text-purple-600" />
            Exporter les rapports
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Téléchargez vos données de progression en CSV ou PDF
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" /> Configuration de l'export
              </CardTitle>
              <CardDescription>
                Sélectionnez les options d'export
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
              ) : (
                <>
                  {/* Format */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Format d'export
                    </label>
                    <Select
                      value={selectedFormat}
                      onValueChange={(v: "csv" | "pdf") => setSelectedFormat(v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">
                          📄 PDF — Document formaté
                        </SelectItem>
                        <SelectItem value="csv">
                          📊 CSV — Données tabulaires
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Formation */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Formation
                    </label>
                    <Select
                      value={selectedCourse}
                      onValueChange={setSelectedCourse}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          Toutes les formations
                        </SelectItem>
                        {formations.map((f) => (
                          <SelectItem key={f.id} value={String(f.id)}>
                            {f.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Aperçu des données */}
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-xl p-4 space-y-2">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                      {filtered().length} formation(s) sélectionnée(s)
                    </p>
                    {filtered().map((p) => (
                      <div
                        key={p.formation_id}
                        className="flex justify-between text-sm text-blue-800 dark:text-blue-200"
                      >
                        <span className="truncate max-w-[70%]">
                          {p.formation_titre}
                        </span>
                        <span
                          className={
                            p.complete
                              ? "text-green-600 dark:text-green-400 font-medium"
                              : "text-orange-500"
                          }
                        >
                          {p.pourcentage_global}% {p.complete ? "✓" : ""}
                        </span>
                      </div>
                    ))}
                    {filtered().length === 0 && (
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        Aucune formation inscrite
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={handleExport}
                    disabled={exporting || filtered().length === 0}
                    className="w-full gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    size="lg"
                  >
                    {exporting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />{" "}
                        Génération...
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5" /> Télécharger (
                        {selectedFormat.toUpperCase()})
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
            <CardContent className="p-6">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Données exportées
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>✓ Progression par formation</li>
                <li>✓ Statut (terminée / en cours)</li>
                <li>✓ Nom et email de l'utilisateur</li>
                <li>✓ Date d'export dans le nom du fichier</li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
